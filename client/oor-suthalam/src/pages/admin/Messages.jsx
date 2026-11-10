import EmailReply from '../../components/common/EmailReply';
import { api } from '../../services/api';
import useResource from '../../hooks/useResource';
import { useState } from 'react';
import { useAdminMessages } from '../../context/AdminMessagesContext';
import Resource from '../../components/common/Resource';
import AdminIcon from '../../components/common/AdminIcon';
import { formatDate } from '../../utils/format';

export default function Messages() {
  const { resource, connected, markRead } = useAdminMessages();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const smtp = useResource(() => api('/inquiries/email-status'));
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Messages</h1>
          <p>Contact enquiries from your website.</p>
        </div>
        <button
          className="admin-utility-button"
          onClick={resource.reload}
          disabled={resource.loading}
        >
          <AdminIcon name="refresh" size={16} />
          Refresh
        </button>
      </div>
      <p role="status">
        {connected
          ? 'Live updates connected'
          : 'Live updates disconnected. Use Refresh to check for messages.'}
      </p>
      {smtp.data && !smtp.data.configured && (
        <p className="notice error">
          Email replies need Gmail SMTP configuration in server/.env. Messages are still
          saved normally.
        </p>
      )}
      <section className="admin-card">
        <div className="admin-toolbar">
          <label className="admin-search">
            <AdminIcon name="search" size={17} />
            <input
              aria-label="Search messages"
              placeholder="Search name, email or message…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <Resource
          resource={resource}
          empty="No messages yet. Contact form submissions will appear here."
        >
          {(items) => {
            const filtered = items.filter((item) =>
              `${item.name} ${item.email} ${item.message}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
            );
            return (
              <div className="admin-message-list">
                {filtered.length ? (
                  filtered.map((item) => (
                    <article key={item._id} className="admin-message">
                      <div className="admin-message-heading">
                        <div>
                          <h2>
                            {item.name} {!item.readAt && <small> · New</small>}
                          </h2>
                          <a href={`mailto:${item.email}`}>{item.email}</a>
                        </div>
                        <time dateTime={item.createdAt}>
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                      <p>{selected === item._id || item.message.length <= 100 ? item.message : item.message.slice(0,100) + '…'}</p>
                      <button
                        className="admin-utility-button"
                        onClick={async () => {
                          setSelected(selected === item._id ? '' : item._id);
                          if (!item.readAt) {
                            try {
                              await markRead(item._id);
                            } catch (error) {
                              window.alert(error.message);
                            }
                          }
                        }}
                        aria-expanded={selected === item._id}
                      >
                        <AdminIcon name="mail" size={16} />
                        {selected === item._id ? 'Close reply' : 'Open message / reply'}
                      </button>
                      {selected === item._id && <EmailReply inquiry={item} />}
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No matching messages.</p>
                )}
                <div className="admin-table-meta">
                  Showing {filtered.length} of {items.length} recent messages · Up to 200
                  messages
                </div>
              </div>
            );
          }}
        </Resource>
      </section>
    </>
  );
}
