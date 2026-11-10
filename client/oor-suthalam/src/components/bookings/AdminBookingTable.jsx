import { Fragment } from 'react';
import QuotePanel from './QuotePanel';
import { useState } from 'react';
import { bookingService } from '../../services/bookingService';
import useResource from '../../hooks/useResource';
import { money, formatDate } from '../../utils/format';
import Resource from '../common/Resource';
import Button from '../common/Button';
import AdminIcon from '../common/AdminIcon';
import BookingStatus from './BookingStatus';

export default function AdminBookingTable() {
  const resource = useResource(bookingService.list);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function update(id, nextStatus) {
    if (
      nextStatus === 'cancelled' &&
      !window.confirm('Cancel this booking? This cannot be reopened.')
    )
      return;
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await bookingService.updateStatus(id, nextStatus);
      setMessage(
        nextStatus === 'confirmed' ? 'Booking confirmed.' : 'Booking cancelled.',
      );
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Bookings</h1>
          <p>Review requests and keep your travelers in the loop.</p>
        </div>
        <button
          className="admin-utility-button"
          disabled={resource.loading || Boolean(busyId)}
          onClick={resource.reload}
        >
          <AdminIcon name="refresh" size={16} />
          Refresh
        </button>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <section className="admin-card">
        <div className="admin-toolbar">
          <label className="admin-search">
            <AdminIcon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search bookings"
              placeholder="Search traveler or package…"
            />
          </label>
          <select
            aria-label="Filter booking status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Resource
          resource={resource}
          empty="No booking requests yet. New requests will appear here."
        >
          {(bookings) => {
            const filtered = bookings.filter(
              (booking) =>
                (!status || booking.status === status) &&
                `${booking.traveler?.name || ''} ${booking.traveler?.email || ''} ${booking.package?.title || ''}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase()),
            );
            return (
              <>
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Traveler</th>
                        <th>Journey</th>
                        <th>Departure</th>
                        <th>Value</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((booking) => (
                        <Fragment key={booking._id}>
                          <tr>
                            <td>
                              <strong>{booking.traveler?.name || 'Traveler'}</strong>
                              <small>{booking.traveler?.email}</small>
                            </td>
                            <td>
                              <strong>
                                {booking.package?.title || 'Archived package'}
                              </strong>
                              <small>
                                {booking.travelers} traveler
                                {booking.travelers === 1 ? '' : 's'}
                              </small>
                            </td>
                            <td>{formatDate(booking.startDate)}</td>
                            <td className="admin-money">
                              {booking.priceMode === 'quote' &&
                              booking.quote?.status !== 'accepted'
                                ? 'Quote required'
                                : money(booking.total)}
                            </td>
                            <td>
                              <BookingStatus status={booking.status} />
                              {booking.partner && (
                                <small>
                                  Partner: {booking.partnerStatus || 'assigned'}
                                </small>
                              )}
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                {booking.status === 'pending' &&
                                  ((booking.priceMode !== 'quote' && !booking.quote) ||
                                    booking.quote?.status === 'accepted') && (
                                    <Button
                                      disabled={Boolean(busyId)}
                                      busy={busyId === booking._id}
                                      onClick={() => update(booking._id, 'confirmed')}
                                    >
                                      Confirm
                                    </Button>
                                  )}
                                {booking.status !== 'cancelled' && (
                                  <Button
                                    className="secondary"
                                    disabled={Boolean(busyId)}
                                    onClick={() => update(booking._id, 'cancelled')}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                {booking.status === 'cancelled' && <small>Closed</small>}
                              </div>
                            </td>
                          </tr>
                          <tr className="admin-quote-row">
                            <td colSpan="6">
                              <QuotePanel
                                request={booking}
                                admin
                                onUpdated={resource.reload}
                              />
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                      {!filtered.length && (
                        <tr>
                          <td colSpan="6">
                            <div className="admin-empty-results">
                              <AdminIcon name="search" size={26} />
                              <h3>No matching bookings</h3>
                              <p>Try another search or status filter.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-table-meta">
                  Showing {filtered.length} of {bookings.length} available requests · No
                  payments are collected through this app
                </div>
              </>
            );
          }}
        </Resource>
      </section>
    </>
  );
}
