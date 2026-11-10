import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { tripService } from '../../services/tripService';
import { formatDate } from '../../utils/format';
import Resource from '../../components/common/Resource';
import Button from '../../components/common/Button';
import ItineraryDay from '../../components/trips/ItineraryDay';
import BudgetSummary from '../../components/trips/BudgetSummary';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const resource = useResource(() => tripService.detail(id), id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    if (!window.confirm('Delete this trip from your notebook?')) return;

    setBusy(true);
    setError('');

    try {
      await tripService.remove(id);
      navigate('/traveler');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back-link" to="/traveler">
        ← My notebook
      </Link>

      <Resource resource={resource}>
        {(trip) => (
          <>
            <div className="page-heading">
              <small className="eyebrow">{trip.destination?.name}</small>
              <h1>{trip.title}</h1>
              <p>
                {trip.origin && `From ${trip.origin} · `}
                {formatDate(trip.startDate)} · {trip.days} days · {trip.travelers}{' '}
                traveler(s)
              </p>
            </div>

            <p>
              <Link
                className="button secondary"
                to={`/packages?destination=${trip.destination?._id}`}
              >
                View local packages & request a quote
              </Link>
            </p>
            <div className="detail-grid">
              <div className="stack">
                {(trip.itinerary || []).map((day) => (
                  <ItineraryDay key={day.day} day={day} />
                ))}
              </div>

              <BudgetSummary
                budget={trip.budget}
                estimatedCost={trip.estimatedCost}
                costs={trip.costs}
                estimateNote={trip.estimateNote}
              />
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <Button className="danger" busy={busy} onClick={remove}>
              Delete trip
            </Button>
          </>
        )}
      </Resource>
    </>
  );
}
