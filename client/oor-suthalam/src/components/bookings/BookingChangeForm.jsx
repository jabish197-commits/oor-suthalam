import { useState } from 'react';
import useResource from '../../hooks/useResource';
import { packageService } from '../../services/packageService';
import { api } from '../../services/api';
import Resource from '../common/Resource';
import Button from '../common/Button';
import { today } from '../../utils/format';

export default function BookingChangeForm({ booking, onSaved, onClose }) {
  const packages = useResource(packageService.list);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.travelers = Number(body.travelers);
    setBusy(true);
    setError('');
    try {
      await api(`/bookings/${booking._id}/change`, { method: 'POST', body });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel stack">
      <h2>Request a package change</h2>
      <p>
        Your current booking stays unchanged until admin approves. The new price is
        recalculated from the selected package.
      </p>
      <Resource resource={packages} empty="No packages available for a change.">
        {(items) => (
          <form className="stack" onSubmit={submit}>
            <label>
              New package
              <select name="package" required defaultValue={booking.package?._id}>
                <option value="" disabled>
                  Select a package
                </option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                    {item.priceMode === 'quote'
                      ? ' · Quote required'
                      : ` · ₹${item.price}/person`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Departure date
              <input
                name="startDate"
                type="date"
                required
                min={today()}
                defaultValue={
                  booking.startDate.slice(0, 10) < today()
                    ? today()
                    : booking.startDate.slice(0, 10)
                }
              />
            </label>
            <label>
              Travelers
              <input
                name="travelers"
                type="number"
                min={1}
                max={20}
                defaultValue={booking.travelers}
                required
              />
            </label>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <Button busy={busy}>Submit change request</Button>
              <Button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </form>
        )}
      </Resource>
    </section>
  );
}
