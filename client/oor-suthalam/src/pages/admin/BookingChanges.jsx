import { useState } from 'react';
import useResource from '../../hooks/useResource';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import Resource from '../../components/common/Resource';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/format';

export default function BookingChanges() {
  const resource = useResource(bookingService.list);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  async function review(id, decision) {
    if (
      !window.confirm(
        `${decision === 'approved' ? 'Approve' : 'Reject'} this package change? Approval recalculates the fare and returns the booking to pending.`,
      )
    )
      return;
    setBusy(id);
    setError('');
    try {
      await api(`/bookings/${id}/change`, { method: 'PATCH', body: { decision } });
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Package change requests</h1>
          <p>Review proposed changes before updating the original booking.</p>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <Resource resource={resource} allowEmpty>
        {(items) => {
          const pending = items.filter(
            (item) =>
              item.changeRequest?.status === 'pending' && item.status !== 'cancelled',
          );
          return pending.length ? (
            <div className="stack">
              {pending.map((item) => (
                <article key={item._id} className="admin-card" style={{ padding: 24 }}>
                  <h2>{item.traveler?.name}</h2>
                  <p>{item.traveler?.email}</p>
                  <p>Current: {item.package?.title}</p>
                  <p>
                    Requested:{' '}
                    <strong>
                      {item.changeRequest.package?.title || 'Unavailable package'}
                    </strong>
                  </p>
                  <p>
                    {formatDate(item.changeRequest.startDate)} ·{' '}
                    {item.changeRequest.travelers} traveler(s)
                  </p>
                  <div className="actions">
                    <Button
                      busy={busy === item._id}
                      onClick={() => review(item._id, 'approved')}
                    >
                      Approve change
                    </Button>
                    <Button
                      className="secondary"
                      busy={busy === item._id}
                      onClick={() => review(item._id, 'rejected')}
                    >
                      Reject change
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-card" style={{ padding: 24 }}>
              No pending package changes.
            </p>
          );
        }}
      </Resource>
    </>
  );
}
