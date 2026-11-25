import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { adminService } from '../../services/adminService';
import { money, formatDate } from '../../utils/format';
import Resource from '../../components/common/Resource';
import AdminIcon from '../../components/common/AdminIcon';
import BookingStatus from '../../components/bookings/BookingStatus';

export function DashboardContent({ data }) {
  const { stats, recentBookings, recentInquiries } = data;
  const statuses = [
    { label: 'Confirmed', value: stats.confirmedBookings, color: '#138f80' },
    { label: 'Pending', value: stats.pendingBookings, color: '#e5b857' },
    { label: 'Cancelled', value: stats.cancelledBookings, color: '#bd7f83' },
  ];
  const total = statuses.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const metrics = [
    ['Destinations', stats.destinations, '/admin/destinations'],
    ['Packages', stats.activePackages, '/admin/packages'],
    ['Travelers', stats.travelers, '/admin/users'],
    ['Inquiries', stats.totalInquiries, '/admin/messages'],
  ];
  return (
    <div className="studio-overview">
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <span className="studio-kicker">YOUR BUSINESS, AT A GLANCE</span>
          <h2>
            Good journeys.
            <br />
            <em>Better oversight.</em>
          </h2>
          <p>Everything you need to keep the next journey moving.</p>
          <Link to="/admin/bookings" className="studio-review-link">
            Review bookings <span>{stats.pendingBookings} pending</span>
          </Link>
        </div>
        <div className="studio-value">
          <span>Confirmed booking value</span>
          <strong>{money(stats.confirmedValue)}</strong>
          <small>{stats.confirmedBookings} confirmed bookings · All time</small>
          <p>Booking value, not collected payments.</p>
        </div>
      </section>

      <nav className="studio-metrics" aria-label="Business totals">
        {metrics.map(([label, value, path]) => (
          <Link to={path} key={label}>
            <strong>{value.toLocaleString('en-IN')}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="studio-dashboard-grid">
        <section className="studio-surface studio-booking-health">
          <div className="studio-section-heading">
            <div>
              <span className="studio-kicker">THE BIG PICTURE</span>
              <h2>Booking health</h2>
            </div>
            <span className="studio-period">All time</span>
          </div>
          <div className="studio-chart-layout">
            <div className="studio-donut">
              <svg
                viewBox="0 0 140 140"
                role="img"
                aria-label={`Booking status: ${stats.confirmedBookings} confirmed, ${stats.pendingBookings} pending, ${stats.cancelledBookings} cancelled`}
              >
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#edf1ef"
                  strokeWidth="13"
                />
                {statuses.map((item) => {
                  const percentage = total ? (item.value / total) * 100 : 0;
                  const start = offset;
                  offset += percentage;
                  return (
                    <circle
                      key={item.label}
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="13"
                      pathLength="100"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      strokeDashoffset={-start}
                      transform="rotate(-90 70 70)"
                    />
                  );
                })}
              </svg>
              <div>
                <strong>{stats.totalBookings}</strong>
                <span>requests</span>
              </div>
            </div>
            <div className="studio-chart-legend">
              {statuses.map((item) => (
                <div key={item.label}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <strong>
                    {item.value}
                    <small>{total ? Math.round((item.value / total) * 100) : 0}%</small>
                  </strong>
                </div>
              ))}
            </div>
          </div>
          {!total && (
            <p className="studio-empty-note">
              Your first booking will bring this chart to life.
            </p>
          )}
          <Link className="studio-text-link" to="/admin/bookings">
            Open booking requests
          </Link>
        </section>

        <section className="studio-surface studio-activity">
          <div className="studio-section-heading">
            <div>
              <span className="studio-kicker">KEEP THINGS MOVING</span>
              <h2>Recent bookings</h2>
            </div>
            <Link to="/admin/bookings">View all</Link>
          </div>
          {recentBookings.length ? (
            <div className="studio-booking-list">
              {recentBookings.map((booking) => (
                <Link
                  to="/admin/bookings"
                  key={booking._id}
                  className="studio-booking-row"
                >
                  <span className="studio-list-icon">
                    <AdminIcon name="booking" size={18} />
                  </span>
                  <span className="studio-booking-person">
                    <strong>{booking.traveler?.name || 'Traveler'}</strong>
                    <small>{booking.package?.title || 'Archived package'}</small>
                    <time>{formatDate(booking.startDate)}</time>
                  </span>
                  <BookingStatus status={booking.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="studio-empty">
              <AdminIcon name="booking" size={32} />
              <h3>Ready for the first request</h3>
              <p>New booking requests will appear here.</p>
              <Link to="/admin/packages">Prepare your packages</Link>
            </div>
          )}
        </section>

        <section className="studio-surface studio-inbox">
          <div className="studio-section-heading">
            <div>
              <span className="studio-kicker">START A CONVERSATION</span>
              <h2>Latest inquiries</h2>
            </div>
            <Link to="/admin/messages">Open inbox</Link>
          </div>
          {recentInquiries.length ? (
            <div className="studio-inquiry-list">
              {recentInquiries.map((inquiry) => (
                <Link to="/admin/messages" key={inquiry._id}>
                  <span className="studio-inquiry-initial">
                    {inquiry.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span>
                    <strong>{inquiry.name}</strong>
                    <p>{inquiry.message}</p>
                    <time>{formatDate(inquiry.createdAt)}</time>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="studio-empty">
              <AdminIcon name="mail" size={28} />
              <h3>A quiet inbox</h3>
              <p>Contact messages will appear here when travelers get in touch.</p>
            </div>
          )}
        </section>
        <section className="studio-shortcuts" aria-label="Manage your catalog">
          <div>
            <span className="studio-kicker">MAKE ROOM FOR THE NEXT TRIP</span>
            <h2>Your travel collection</h2>
          </div>
          <Link to="/admin/destinations">
            <AdminIcon name="destination" />
            Destinations
          </Link>
          <Link to="/admin/packages">
            <AdminIcon name="package" />
            Packages
          </Link>
          <Link to="/admin/galleries">
            <AdminIcon name="destination" />
            Photo galleries
          </Link>
        </section>
      </div>
      <p className="studio-updated">
        Updated{' '}
        {new Date(data.updatedAt).toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
        })}{' '}
        · Refreshes automatically while you’re here.
      </p>
    </div>
  );
}
export default function Dashboard() {
  const resource = useResource(adminService.overview, '', { keepPreviousData: true });
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) resource.reload();
    }, 30000);
    return () => clearInterval(timer);
  }, [resource.reload]);
  return (
    <>
      <div className="admin-page-heading studio-page-heading">
        <div>
          <span className="studio-kicker">OOR SUTHALAM STUDIO</span>
          <h1>Overview</h1>
          <p>A little clarity for your day.</p>
        </div>
        <button
          className="admin-utility-button"
          onClick={resource.reload}
          disabled={resource.loading || resource.refreshing}
          aria-label="Refresh dashboard"
        >
          <AdminIcon name="refresh" size={17} />
          <span>{resource.refreshing ? 'Updating…' : 'Refresh'}</span>
        </button>
      </div>
      <Resource resource={resource}>
        {(data) => <DashboardContent data={data} />}
      </Resource>
    </>
  );
}
