import { useState } from 'react';
import { api } from '../../services/api';
import useResource from '../../hooks/useResource';
import Resource from './Resource';
import Button from './Button';

export default function EmailReply({ inquiry }) {
  const history = useResource(
    () => api(`/inquiries/${inquiry._id}/replies`),
    inquiry._id,
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  async function submit(event) {
    event.preventDefault();
    if (!window.confirm(`Send this email reply to ${inquiry.email}?`)) return;
    const form = event.currentTarget;
    setBusy(true);
    setNotice('');
    setSuccess(false);
    try {
      const result = await api(`/inquiries/${inquiry._id}/replies`, {
        method: 'POST',
        body: { ...Object.fromEntries(new FormData(form)), requestId },
      });
      setSuccess(result.status === 'accepted');
      setNotice(
        result.status === 'accepted'
          ? 'Gmail accepted the reply for delivery. Inbox delivery is not yet confirmed.'
          : result.status === 'failed'
            ? 'Email was not sent. Check SMTP credentials and the recipient before trying again.'
            : 'Delivery is not confirmed. Check Sent mail and reply history before sending another reply.',
      );
      if (result.status === 'accepted') {
        form.reset();
        setRequestId(crypto.randomUUID());
      }
      if (result.status === 'failed') setRequestId(crypto.randomUUID());
      history.reload();
    } catch (error) {
      setNotice(error.message);
      history.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-reply-panel">
      <h3>Email reply</h3>
      <p>To: {inquiry.email}</p>
      <form className="stack" onSubmit={submit}>
        <label>
          Subject
          <input
            name="subject"
            required
            maxLength={150}
            defaultValue="Re: Your Oor Suthalam enquiry"
          />
        </label>
        <label>
          Reply
          <textarea
            name="message"
            required
            maxLength={5000}
            rows={5}
            placeholder="Write your reply…"
          />
        </label>
        {notice && (
          <p
            className={`notice ${success ? 'success' : 'error'}`}
            role={success ? 'status' : 'alert'}
          >
            {notice}
          </p>
        )}
        <Button busy={busy}>Send email reply</Button>
      </form>
      <h3>Reply history</h3>
      <Resource resource={history} empty="No email replies yet.">
        {(items) =>
          items.map((item) => (
            <article className="admin-reply-history" key={item._id}>
              <strong>{item.subject}</strong>
              <small>
                {new Date(item.createdAt).toLocaleString()} ·{' '}
                {item.status === 'accepted'
                  ? 'Accepted by email server'
                  : item.status === 'unknown' || item.status === 'sending'
                    ? 'Delivery unconfirmed — check Sent mail'
                    : 'Not sent'}
              </small>
              <p>{item.message}</p>
            </article>
          ))
        }
      </Resource>
    </div>
  );
}
