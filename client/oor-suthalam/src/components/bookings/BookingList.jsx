import QuotePanel from './QuotePanel';
import { useEffect, useState } from 'react';
import useResource from '../../hooks/useResource';
import { bookingService } from '../../services/bookingService';
import { money, formatDate } from '../../utils/format';
import Resource from '../common/Resource';
import Button from '../common/Button';
import BookingStatus from './BookingStatus';
import BookingChangeForm from './BookingChangeForm';

export default function BookingList({ admin = false }) {
  const resource = useResource(bookingService.list, '', { keepPreviousData: true });
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [changing, setChanging] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) resource.reload();
    }, 30000);
    const refresh = () => {
      if (!document.hidden) resource.reload();
    };
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [resource.reload]);

  async function changeStatus(id, status) {
    if (status === 'cancelled' && !window.confirm('Cancel this booking request?')) {
      return;
    }

    setBusyId(id);
    setError('');

    try {
      await bookingService.updateStatus(id, status);
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {changing && (
        <BookingChangeForm
          booking={changing}
          onClose={() => setChanging(null)}
          onSaved={() => {
            setChanging(null);
            setMessage(
              'Package change requested. Your original booking stays unchanged until approval.',
            );
            resource.reload();
          }}
        />
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <Resource resource={resource} empty="No booking requests yet.">
        {(bookings) => (
          <div className="stack">
            {bookings.map((booking) => (
              <article className="panel booking-card" key={booking._id}>
                <div>
                  <BookingStatus status={booking.status} />

                  <h3>{booking.package?.title || 'Unavailable package'}</h3>

                  <p>
                    {formatDate(booking.startDate)} · {booking.travelers} traveler(s)
                  </p>

                  {admin && (
                    <p>
                      {booking.traveler?.name} · {booking.traveler?.email}
                    </p>
                  )}

                  <small>Reference: {booking._id}</small>
                  {booking.changeRequest?.status && (
                    <p>
                      Package change: <strong>{booking.changeRequest.status}</strong>
                      {booking.changeRequest.status === 'pending'
                        ? ` · ${booking.changeRequest.package?.title || 'Awaiting review'}`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="stack">
                  <QuotePanel
                    request={booking}
                    admin={admin}
                    onUpdated={resource.reload}
                  />
                  <strong>
                    {booking.priceMode === 'quote' && booking.quote?.status !== 'accepted'
                      ? 'Quote requested'
                      : money(booking.total)}
                  </strong>

                  {booking.status !== 'cancelled' && (
                    <div className="actions">
                      {!admin && booking.changeRequest?.status !== 'pending' && (
                        <Button
                          className="secondary"
                          onClick={() => setChanging(booking)}
                        >
                          Change package / dates
                        </Button>
                      )}
                      {admin && booking.status === 'pending' && (
                        <Button
                          busy={busyId === booking._id}
                          onClick={() => changeStatus(booking._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}

                      <Button
                        className="secondary"
                        busy={busyId === booking._id}
                        onClick={() => changeStatus(booking._id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Resource>
    </>
  );
}
