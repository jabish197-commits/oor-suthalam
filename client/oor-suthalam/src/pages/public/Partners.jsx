import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { bookingService } from '../../services/bookingService';
import useResource from '../../hooks/useResource';
import Resource from '../../components/common/Resource';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/format';

function PartnerDirectory() {
  const resource = useResource(() => api('/partners/directory'));
  return (
    <section className="stack">
      <h2>Our approved travel partners</h2>
      <Resource
        resource={resource}
        empty="Partner applications are open. Approved companies will appear here."
      >
        {(items) => (
          <div className="card-grid">
            {items.map((item) => (
              <article key={item._id} className="panel">
                <h3>{item.company}</h3>
                <p>{item.regions}</p>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </Resource>
    </section>
  );
}

function Assignments() {
  const resource = useResource(() => api('/partners/assignments'));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function respond(id, status) {
    if (
      !window.confirm(
        `${status === 'accepted' ? 'Accept' : 'Decline'} this assigned travel request? This does not issue tickets or collect payment.`,
      )
    )
      return;
    setBusy(id);
    setError('');
    try {
      await api(`/partners/assignments/${id}/response`, {
        method: 'PATCH',
        body: { status },
      });
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <h2>Assigned travel requests</h2>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <Resource resource={resource} empty="No requests have been assigned yet.">
        {(items) => (
          <div className="stack">
            {items.map((item) => (
              <article className="panel" key={item._id}>
                <h3>{item.package?.title}</h3>
                <p>
                  {item.package?.destination?.name} · {formatDate(item.startDate)} ·{' '}
                  {item.travelers} travelers
                </p>
                <p>Booking status: {item.status}</p>
                <p>Partner response: {item.partnerStatus || 'assigned'}</p>
                {(!item.partnerStatus || item.partnerStatus === 'assigned') &&
                  item.changeRequest?.status !== 'pending' && (
                    <div className="actions">
                      <Button
                        busy={busy === item._id}
                        onClick={() => respond(item._id, 'accepted')}
                      >
                        Accept request
                      </Button>
                      <Button
                        busy={busy === item._id}
                        className="secondary"
                        onClick={() => respond(item._id, 'declined')}
                      >
                        Decline request
                      </Button>
                    </div>
                  )}
                {item.changeRequest?.status === 'pending' && (
                  <p>
                    A package change is under admin review. Wait for updated instructions.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </Resource>
    </>
  );
}
export function AdminPartners() {
  const partners = useResource(() => api('/partners'));
  const bookings = useResource(bookingService.list);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function review(id, status) {
    if (
      !window.confirm(
        `${status === 'approved' ? 'Approve' : 'Reject'} this partner? Only approved partners can access assigned requests.`,
      )
    )
      return;
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/partners/${id}/status`, { method: 'PATCH', body: { status } });
      setMessage(status === 'approved' ? 'Partner approved.' : 'Partner access revoked.');
      partners.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  async function assign(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy('assign');
    setError('');
    setMessage('');
    try {
      await api(`/partners/${body.booking}/assign`, {
        method: 'POST',
        body: { partner: body.partner },
      });
      setMessage('Travel request assigned. No email was sent.');
      bookings.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="stack">
      <div className="admin-page-heading">
        <div>
          <h1>Travel partners</h1>
          <p>Review applications and assign booking requests to approved companies.</p>
        </div>
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
      <Resource resource={partners} allowEmpty>
        {(items) => (
          <>
            <div className="stack">
              {items.map((item) => (
                <article className="panel" key={item._id}>
                  <h2>{item.company}</h2>
                  <p>
                    {item.owner?.name} · {item.owner?.email} · {item.phone}
                  </p>
                  <p>{item.regions}</p>
                  <p>{item.description}</p>
                  <strong>Status: {item.status}</strong>
                  <div className="actions">
                    <Button
                      disabled={item.status === 'approved'}
                      busy={busy === item._id}
                      onClick={() => review(item._id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      busy={busy === item._id}
                      className="secondary"
                      onClick={() => review(item._id, 'rejected')}
                    >
                      Reject / revoke
                    </Button>
                  </div>
                </article>
              ))}
              {!items.length && <p>No partnership applications yet.</p>}
            </div>
            <h2>Assign a booking request</h2>
            <p>
              Partner access is limited to assigned package, destination, date, group size
              and status. Traveler contact details remain private.
            </p>
            <Resource resource={bookings} empty="No bookings available to assign.">
              {(requests) => (
                <form className="panel stack" onSubmit={assign}>
                  <label>
                    Booking
                    <select name="booking" required defaultValue="">
                      <option value="" disabled>
                        Select a booking
                      </option>
                      {requests
                        .filter((r) => r.status !== 'cancelled')
                        .map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.package?.title} · {r.traveler?.name} ·{' '}
                            {formatDate(r.startDate)}
                            {r.partner ? ' · Already assigned' : ''}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Approved partner
                    <select name="partner" required defaultValue="">
                      <option value="" disabled>
                        Select a partner
                      </option>
                      {items
                        .filter((p) => p.status === 'approved')
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.company}
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button
                    busy={busy === 'assign'}
                    disabled={!items.some((p) => p.status === 'approved')}
                  >
                    Assign request
                  </Button>
                </form>
              )}
            </Resource>
          </>
        )}
      </Resource>
    </section>
  );
}

export default function Partners() {
  const { user } = useAuth();
  const mine = useResource(
    () => (user && user.role !== 'admin' ? api('/partners/me') : Promise.resolve(null)),
    user?._id,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function apply(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/partners/apply', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      });
      mine.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (user?.role === 'admin') return <Navigate to="/admin/partners" replace />;
  return (
    <section className="page stack">
      <div className="page-heading">
        <h1>Travel with us.</h1>
        <p>Run a travel company? Apply to become an Oor Suthalam travel partner.</p>
      </div>
      <PartnerDirectory />
      {!user ? (
        <Link className="button" to="/login">
          Sign in to apply
        </Link>
      ) : mine.loading ? (
        <p role="status">Loading application…</p>
      ) : mine.error ? (
        <p className="notice error">{mine.error.message || mine.error}</p>
      ) : mine.data ? (
        <>
          <article className="panel">
            <h2>{mine.data.company}</h2>
            <p>
              Application status: <strong>{mine.data.status}</strong>
            </p>
            <p>
              {mine.data.status === 'approved'
                ? 'Your partner workspace is ready. Admin-assigned requests appear below.'
                : mine.data.status === 'rejected'
                  ? 'Your application was not approved. Contact the administrator for review.'
                  : 'Admin will review your details before partner access is enabled.'}
            </p>
          </article>
          {mine.data.status === 'approved' && <Assignments />}
        </>
      ) : (
        <form className="panel stack" onSubmit={apply}>
          <h2>Partnership application</h2>
          <label>
            Company name
            <input name="company" required minLength={2} maxLength={150} />
          </label>
          <label>
            Business phone
            <input
              name="phone"
              type="tel"
              required
              minLength={7}
              maxLength={30}
              pattern="[+0-9\s()-]+"
            />
          </label>
          <label>
            Destinations / service regions
            <input name="regions" required minLength={2} maxLength={500} />
          </label>
          <label>
            Company and services
            <textarea name="description" required minLength={10} maxLength={2000} />
          </label>
          <p>
            Submitting an application does not create a partnership agreement. Admin
            approval is required; assigned requests are shared inside this website.
          </p>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <Button busy={busy}>Apply for partnership</Button>
        </form>
      )}
    </section>
  );
}
