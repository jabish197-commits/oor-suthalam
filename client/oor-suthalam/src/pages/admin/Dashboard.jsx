import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { adminService } from '../../services/adminService';
import { money, formatDate } from '../../utils/format';
import Resource from '../../components/common/Resource';
import AdminIcon from '../../components/common/AdminIcon';
import BookingStatus from '../../components/bookings/BookingStatus';

function DashboardContent({ data }) {
  const { stats, recentBookings, recentInquiries } = data;
  const cards = [
    [
      'Destinations',
      stats.destinations,
      'Published destinations',
      'destination',
      '/admin/destinations',
    ],
    [
      'Active packages',
      stats.activePackages,
      'Available packages',
      'package',
      '/admin/packages',
    ],
    [
      'Pending bookings',
      stats.pendingBookings,
      'Requests awaiting your review',
      'booking',
      '/admin/bookings',
    ],
    ['Travelers', stats.travelers, 'Registered travelers', 'users', '/admin/users'],
  ];
  const statuses = [
    ['Confirmed', stats.confirmedBookings, 'confirmed'],
    ['Pending', stats.pendingBookings, 'pending'],
    ['Cancelled', stats.cancelledBookings, 'cancelled'],
  ];

  return (
    <>
      <div className="admin-stat-grid">
        {cards.map(([title, value, note, icon, path]) => (
          <Link className="admin-stat-card" to={path} key={title}>
            <div className="admin-stat-top">
              <span>{title}</span>
              <span className={`admin-stat-icon ${icon}`}>
                <AdminIcon name={icon} />
              </span>
            </div>
            <strong>{value.toLocaleString('en-IN')}</strong>
            <div className="admin-stat-foot">
              <span>{note}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-overview-grid">
        <section className="admin-card admin-recent-bookings">
          <div className="admin-card-heading">
            <div>
              <h2>Recent bookings</h2>
            </div>
            <Link to="/admin/bookings">View all </Link>
          </div>
          {recentBookings.length ? (
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Traveler & getaway</th>
                    <th>Departure</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.traveler?.name || 'Traveler'}</strong>
                        <small>{booking.package?.title || 'Archived package'}</small>
                      </td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td className="admin-money">
                        {booking.priceMode === 'quote'
                          ? 'Quote required'
                          : money(booking.total)}
                      </td>
                      <td>
                        <BookingStatus status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-bookings">
              <span className="admin-empty-icon">
                <AdminIcon name="booking" size={28} />
              </span>
              <h3>No bookings yet.</h3>
              <p>
                New booking requests will appear here.
                <br />
                Get your catalog ready for the first journey.
              </p>
              <Link className="admin-inline-link" to="/admin/packages">
                Manage packages{' '}
              </Link>
            </div>
          )}
          <div className="admin-card-footer">
            <span>
              <span className="admin-live-dot" /> {stats.totalBookings} total requests
            </span>
            <span>Latest six bookings</span>
          </div>
        </section>

        <aside className="admin-side-stack">
          <section className="admin-card admin-quick-actions">
            <h2>Quick actions</h2>
            <Link to="/admin/destinations">Manage destinations</Link>
            <Link to="/admin/packages">Manage packages</Link>
            <Link to="/admin/bookings">Review booking requests</Link>
            <Link to="/admin/changes">Review package changes</Link>
          </section>
          <section className="admin-card admin-value-card">
            <span className="admin-value-label">CONFIRMED BOOKING VALUE</span>
            <strong>{money(stats.confirmedValue)}</strong>
            <p>
              Across {stats.confirmedBookings} confirmed booking
              {stats.confirmedBookings === 1 ? '' : 's'}.<br />
              Booking value, not collected payments.
            </p>
          </section>
        </aside>

        <section className="admin-card admin-status-card">
          <div className="admin-card-heading">
            <div>
              <h2>Booking breakdown</h2>
            </div>
            <span className="admin-soft-label">All time</span>
          </div>
          <div className="admin-booking-total">
            <strong>{stats.totalBookings}</strong>
            <span>Total booking requests</span>
          </div>
          <div className="admin-status-bars">
            {statuses.map(([label, value, status]) => (
              <div className="admin-status-row" key={status}>
                <div>
                  <span>
                    <i className={status} />
                    {label}
                  </span>
                  <strong>{value}</strong>
                </div>
                <div className="admin-progress-track">
                  <span
                    className={status}
                    style={{
                      width: `${stats.totalBookings ? (value / stats.totalBookings) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!stats.totalBookings && (
            <p className="admin-chart-note">
              Activity appears with your first booking request.
            </p>
          )}
        </section>

        <section className="admin-card admin-inquiries-card">
          <div className="admin-card-heading">
            <div>
              <h2>Latest inquiries</h2>
            </div>
            <span className="admin-count-badge">{stats.totalInquiries}</span>
          </div>
          {recentInquiries.length ? (
            <div className="admin-inquiry-list">
              {recentInquiries.map((inquiry) => (
                <article key={inquiry._id}>
                  <span className="admin-inquiry-avatar">
                    {inquiry.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <div className="admin-inquiry-title">
                      <strong>{inquiry.name}</strong>
                      <time>{formatDate(inquiry.createdAt)}</time>
                    </div>
                    <p>{inquiry.message}</p>
                    <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-small-empty">
              <AdminIcon name="mail" size={30} />
              <h3>No enquiries yet.</h3>
              <p>Messages from your contact page will appear here.</p>
            </div>
          )}
        </section>
      </div>
      <div className="admin-update-note">
        Data refreshed{' '}
        {new Date(data.updatedAt).toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
        })}{' '}
        · Refreshes every 30 seconds while this page is visible.
      </div>
    </>
  );
}

export default function Dashboard() {
  const resource = useResource(adminService.overview, '', { keepPreviousData: true });
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) resource.reload();
    }, 30000);
    return () => clearInterval(interval);
  }, [resource.reload]);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Overview</h1>
          <p>Monitor bookings, manage your catalog and review requests.</p>
        </div>
        <button
          className="admin-utility-button"
          onClick={resource.reload}
          disabled={resource.loading}
        >
          <AdminIcon name="refresh" size={17} />
          Refresh data
        </button>
      </div>
      <Resource resource={resource}>
        {(data) => <DashboardContent data={data} />}
      </Resource>
    </>
  );
}
