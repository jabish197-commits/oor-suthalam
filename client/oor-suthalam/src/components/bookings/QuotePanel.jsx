import { useState } from 'react';
import { api } from '../../services/api';
import { money } from '../../utils/format';
import Button from '../common/Button';
import '../../assets/quotes.css';

export default function QuotePanel({
  request,
  kind = 'bookings',
  admin = false,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const quote = request.quote;
  const closed = ['cancelled', 'confirmed'].includes(request.status);
  const awaitingChange = request.changeRequest?.status === 'pending';
  const expired =
    quote && new Date(quote.expiresAt) <= new Date() && quote.status === 'offered';
  async function offer(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.total = Number(body.total);
    body.expiresAt = new Date(body.expiresAt).toISOString();
    if (
      !window.confirm(
        'Send this total price and terms to the traveler? Any previous quote will be replaced.',
      )
    )
      return;
    await mutate(`/bookings`, body, true);
  }
  async function mutate(_unused, body, offering = false) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/${kind}/${request._id}/quote${offering ? '' : '/respond'}`, {
        method: 'POST',
        body,
      });
      setMessage(
        offering
          ? 'Quote sent. The traveler can review it in their requests.'
          : body.decision === 'accepted'
            ? 'Quote accepted. Package confirmation remains subject to admin review.'
            : 'Quote declined. You can discuss another option with the team.',
      );
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="quote-panel" aria-label="Travel quote">
      {quote && (
        <>
          <div className="quote-heading">
            <strong>{money(quote.total)}</strong>
            <span className="status">
              {expired
                ? 'Expired'
                : quote.status === 'offered'
                  ? 'Awaiting your decision'
                  : quote.status}
            </span>
          </div>
          <p className="quote-basis">
            Total for all {request.travelers} traveler(s) · INR
          </p>
          <dl>
            <dt>Included</dt>
            <dd>{quote.inclusions}</dd>
            <dt>Excluded</dt>
            <dd>{quote.exclusions}</dd>
            <dt>Terms and cancellation</dt>
            <dd>{quote.terms}</dd>
          </dl>
          <p>Valid until {new Date(quote.expiresAt).toLocaleString()}</p>
          <small>
            No payment is collected.{' '}
            {kind === 'flights'
              ? 'Acceptance does not reserve a seat or issue a ticket.'
              : 'Acceptance does not confirm the booking; admin confirmation follows.'}
          </small>
          {!admin &&
            !closed &&
            !awaitingChange &&
            quote.status === 'offered' &&
            !expired && (
              <div className="actions">
                <Button
                  busy={busy}
                  onClick={() => {
                    if (
                      window.confirm('Accept this total price and the displayed terms?')
                    )
                      mutate('', { version: quote.version, decision: 'accepted' });
                  }}
                >
                  Accept quote
                </Button>
                <Button
                  className="secondary"
                  busy={busy}
                  onClick={() => {
                    if (window.confirm('Decline this quote?'))
                      mutate('', { version: quote.version, decision: 'declined' });
                  }}
                >
                  Decline
                </Button>
              </div>
            )}
        </>
      )}
      {admin && !closed && !awaitingChange && (
        <button
          type="button"
          className="admin-utility-button"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Close quote editor' : quote ? 'Revise quote' : 'Create quote'}
        </button>
      )}
      {editing && (
        <form className="stack" onSubmit={offer}>
          <label>
            Total price for the whole group (₹)
            <input
              type="number"
              name="total"
              min="1"
              max="10000000"
              step="0.01"
              required
              defaultValue={quote?.total || ''}
            />
          </label>
          <label>
            Included
            <textarea
              name="inclusions"
              required
              maxLength={3000}
              defaultValue={quote?.inclusions || ''}
            />
          </label>
          <label>
            Excluded
            <textarea
              name="exclusions"
              required
              maxLength={3000}
              defaultValue={quote?.exclusions || ''}
            />
          </label>
          <label>
            Terms and cancellation
            <textarea
              name="terms"
              required
              maxLength={3000}
              defaultValue={quote?.terms || ''}
            />
          </label>
          <label>
            Valid until
            <input name="expiresAt" type="datetime-local" required />
          </label>
          <Button busy={busy}>Send quote</Button>
        </form>
      )}
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
    </section>
  );
}
