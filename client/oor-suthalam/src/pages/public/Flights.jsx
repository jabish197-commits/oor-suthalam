import QuotePanel from '../../components/bookings/QuotePanel';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { flightService } from '../../services/flightService';
import useResource from '../../hooks/useResource';
import Resource from '../../components/common/Resource';
import Button from '../../components/common/Button';
import { today, formatDate } from '../../utils/format';

function FlightRequests({ user, refreshKey }) {
  const resource = useResource(flightService.list, refreshKey);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  async function update(id, status) {
    if (status === 'cancelled' && !window.confirm('Cancel this flight enquiry?')) return;
    setBusy(id);
    setError('');
    try {
      await flightService.update(id, status);
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="stack">
      {user.role === 'admin' ? (
        <div className="admin-page-heading">
          <div>
            <h1>Flight enquiries</h1>
            <p>Review routes, travel dates and traveler preferences.</p>
          </div>
          <button
            className="admin-utility-button"
            onClick={resource.reload}
            disabled={resource.loading}
          >
            Refresh
          </button>
        </div>
      ) : (
        <h2>My flight enquiries</h2>
      )}
      <p>
        {user.role === 'admin'
          ? 'Review traveler requests and follow up with flight options. Marking a request reviewed does not issue a ticket.'
          : 'No ticket is issued here. Admin reviews your route and contacts you about options.'}
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {user.role === 'admin' && (
        <div className="admin-toolbar">
          <input
            aria-label="Search flight enquiries"
            placeholder="Search route, name or email…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Filter enquiry status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}
      <Resource resource={resource} empty="No flight enquiries yet.">
        {(items) => {
          const filtered = items.filter(
            (item) =>
              (!status || item.status === status) &&
              [item.origin, item.destination, item.traveler?.name, item.traveler?.email]
                .join(' ')
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
          );
          return filtered.length ? (
            filtered.map((item) => (
              <article key={item._id} className="panel stack">
                <strong>
                  {item.origin} to {item.destination}
                </strong>
                <p>
                  {formatDate(item.departureDate)}
                  {item.returnDate
                    ? ` — ${formatDate(item.returnDate)}`
                    : ' · One way'} · {item.travelers} traveler(s) · {item.cabin}
                </p>
                {user.role === 'admin' && (
                  <p>
                    {item.traveler?.name} · {item.traveler?.email}
                  </p>
                )}
                <span className="tag" style={{ position: 'static', alignSelf: 'start' }}>
                  {item.status}
                </span>
                {item.notes && <p>{item.notes}</p>}
                <QuotePanel
                  request={item}
                  kind="flights"
                  admin={user.role === 'admin'}
                  onUpdated={resource.reload}
                />
                {item.status !== 'cancelled' && (
                  <div className="actions">
                    {user.role === 'admin' && item.status === 'pending' && (
                      <Button
                        busy={busy === item._id}
                        onClick={() => update(item._id, 'reviewed')}
                      >
                        Mark reviewed
                      </Button>
                    )}
                    <Button
                      className="secondary"
                      busy={busy === item._id}
                      onClick={() => update(item._id, 'cancelled')}
                    >
                      Cancel enquiry
                    </Button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <p className="empty-state">No matching flight enquiries.</p>
          );
        }}
      </Resource>
    </section>
  );
}

export default function Flights({ management = false }) {
  const { user } = useAuth();
  const [roundTrip, setRoundTrip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState(0);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    body.travelers = Number(body.travelers);
    if (!roundTrip) delete body.returnDate;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await flightService.create(body);
      setMessage('Flight enquiry sent. This is not an issued ticket.');
      setVersion((value) => value + 1);
      form.reset();
      setRoundTrip(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (management) {
    return (
      <section className="stack">
        <FlightRequests user={user} refreshKey={version} />
      </section>
    );
  }
  return (
    <section className="page stack">
      <div className="page-heading">
        <h1>Plan your flight.</h1>
        <p>Send your route and travel dates for a personalised flight quote.</p>
      </div>
      <div className="panel">
        <p>
          <strong>Flight enquiry service</strong> · Live airline fares, seat availability
          and ticket issuance are not connected. No payment is collected.
        </p>
      </div>
      {user ? (
        <>
          <form className="panel stack" onSubmit={submit}>
            <h2>Request flight options</h2>
            <label>
              Journey type
              <select
                value={roundTrip ? 'return' : 'oneway'}
                onChange={(e) => setRoundTrip(e.target.value === 'return')}
              >
                <option value="oneway">One way</option>
                <option value="return">Return</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                From (city or airport)
                <input
                  name="origin"
                  placeholder="Chennai (MAA)"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                To (city or airport)
                <input
                  name="destination"
                  placeholder="Dubai (DXB)"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                Departure
                <input name="departureDate" type="date" min={today()} required />
              </label>
              {roundTrip && (
                <label>
                  Return
                  <input name="returnDate" type="date" min={today()} required />
                </label>
              )}
              <label>
                Travelers
                <input
                  name="travelers"
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={9}
                  required
                />
              </label>
              <label>
                Cabin
                <select name="cabin">
                  <option>Economy</option>
                  <option>Premium economy</option>
                  <option>Business</option>
                </select>
              </label>
            </div>
            <label>
              Preferences (optional)
              <textarea
                name="notes"
                maxLength={1000}
                placeholder="Preferred timings or nearby airports. Do not enter passport or payment details."
              />
            </label>
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
            <Button busy={busy}>Send flight enquiry</Button>
          </form>
          <FlightRequests user={user} refreshKey={version} />
        </>
      ) : (
        <Link className="button" to="/login">
          Sign in to request flight options
        </Link>
      )}
    </section>
  );
}
