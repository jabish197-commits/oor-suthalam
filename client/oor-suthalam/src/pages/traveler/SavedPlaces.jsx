// client/src/pages/traveler/SavedPlaces.jsx
import useResource from '../../hooks/useResource';
import { authService } from '../../services/authService';
import Resource from '../../components/common/Resource';
import DestinationCard from '../../components/destinations/DestinationCard';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function SavedPlaces() {
  const resource = useResource(authService.savedPlaces);
  const { user } = useAuth();
  const savedIds = new Set(
    (user?.savedPlaces || []).map((place) => String(place?._id || place)),
  );
  const visibleResource = {
    ...resource,
    data: resource.data?.filter((place) => savedIds.has(String(place._id))),
  };

  return (
    <>
      <div className="page-heading">
        <small className="eyebrow">FOR ANOTHER DAY</small>
        <h1>Saved places.</h1>
        <p>A little collection of places calling your name.</p>
      </div>

      <Resource
        resource={visibleResource}
        empty={
          <>
            <p>No saved places yet. Tap a heart to keep a place here.</p>
            <Link className="button" to="/destinations">
              Explore destinations
            </Link>
          </>
        }
      >
        {(data) => (
          <div className="card-grid">
            {data.map((destination) => (
              <DestinationCard key={destination._id} destination={destination} />
            ))}
          </div>
        )}
      </Resource>
    </>
  );
}
