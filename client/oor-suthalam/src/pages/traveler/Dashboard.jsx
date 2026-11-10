import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useResource from '../../hooks/useResource';
import { tripService } from '../../services/tripService';
import { formatDate } from '../../utils/format';
import Resource from '../../components/common/Resource';

export default function Dashboard() {
  const { user } = useAuth();
  const trips = useResource(tripService.list);

  return (
    <>
      <div className="section-heading">
        <div>
          <small className="eyebrow">YOUR NEXT ADVENTURE</small>
          <h1>Hello, {user.name}.</h1>
          <p>Where shall we go next?</p>
        </div>

        <Link className="button" to="/traveler/plan">
          Plan a trip
        </Link>
      </div>

      <div className="quick-links">
        <Link className="panel" to="/destinations">
          <h3>Discover places </h3>
          <p>Find a new favorite.</p>
        </Link>

        <Link className="panel" to="/traveler/saved">
          <h3>Saved places </h3>
          <p>{user.savedPlaces?.length || 0} places on your list.</p>
        </Link>

        <Link className="panel" to="/traveler/bookings">
          <h3>My bookings </h3>
          <p>Keep track of your requests.</p>
        </Link>
      </div>

      <h2>Your travel notebook</h2>

      <Resource
        resource={trips}
        empty="No trips planned yet. Start with a place you’d love to see."
      >
        {(data) => (
          <div className="stack">
            {data.map((trip) => (
              <Link
                className="panel trip-link"
                key={trip._id}
                to={`/traveler/trips/${trip._id}`}
              >
                <div>
                  <h3>{trip.title}</h3>
                  <p>
                    {trip.destination?.name} · {formatDate(trip.startDate)} · {trip.days}{' '}
                    days
                  </p>
                </div>

                <span>View itinerary </span>
              </Link>
            ))}
          </div>
        )}
      </Resource>
    </>
  );
}
