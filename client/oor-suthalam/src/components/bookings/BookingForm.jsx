import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { money, today } from '../../utils/format';
import Button from '../common/Button';

export default function BookingForm({ travelPackage }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(today());
  const [travelers, setTravelers] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await bookingService.create({
        package: travelPackage._id,
        startDate,
        travelers,
      });

      navigate('/traveler/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <small className="eyebrow">MAKE IT A PLAN</small>

      <h3>
        {travelPackage.priceMode === 'quote' ? (
          'Personalised quote'
        ) : (
          <>
            {money(travelPackage.price)} <small>/ person</small>
          </>
        )}
      </h3>

      <label>
        Departure date
        <input
          type="date"
          required
          min={today()}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>

      <label>
        Travelers
        <input
          type="number"
          min="1"
          max="20"
          required
          value={travelers}
          onChange={(event) => setTravelers(Number(event.target.value))}
        />
      </label>

      <div className="summary-row">
        <span>Total</span>
        <strong>
          {travelPackage.priceMode === 'quote'
            ? 'To be quoted'
            : money(travelPackage.price * travelers)}
        </strong>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {user ? (
        <Button busy={busy}>
          {travelPackage.priceMode === 'quote' ? 'Request a quote' : 'Request booking'}
        </Button>
      ) : (
        <Link
          className="button"
          to="/login"
          state={{ from: `/packages/${travelPackage._id}` }}
        >
          Login to book
        </Link>
      )}

      <small>No payment is collected. Bookings require admin confirmation.</small>
    </form>
  );
}
