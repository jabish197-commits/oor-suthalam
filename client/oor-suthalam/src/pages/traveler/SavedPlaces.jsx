// client/src/pages/traveler/SavedPlaces.jsx
import useResource from '../../hooks/useResource';
import { authService } from '../../services/authService';
import Resource from '../../components/common/Resource';
import DestinationCard from '../../components/destinations/DestinationCard';

export default function SavedPlaces() {
  const resource = useResource(authService.savedPlaces);

  return (
    <>
      <div className="page-heading">
        <small className="eyebrow">FOR ANOTHER DAY</small>
        <h1>Saved places.</h1>
        <p>A little collection of places calling your name.</p>
      </div>

      <Resource
        resource={resource}
        empty="No saved places yet. Save one from a destination’s page."
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
