import '../../assets/destination-location.css';
import { lazy, Suspense } from 'react';
const DestinationMap = lazy(() => import('./DestinationMap'));
import { locationTowns } from '../../utils/locationTowns';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { distanceKm } from '../../utils/distance';
export default function DestinationLocation({ destination, embed = false }) {
  const location = useCurrentLocation();
  if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) return null;
  const km = distanceKm(location.coordinates, destination);
  const directions = new URL('https://www.google.com/maps/dir/');
  directions.searchParams.set('api', '1');
  directions.searchParams.set('destination', `${destination.lat},${destination.lng}`);
  if (location.coordinates)
    directions.searchParams.set(
      'origin',
      `${location.coordinates.lat},${location.coordinates.lng}`,
    );
  return (
    <section className="destination-location location-card">
      <header className="location-heading">
        <div>
          <span className="location-eyebrow">GETTING THERE</span>
          <h3>Find your way to {destination.name}</h3>
        </div>
        <span className="location-pin" aria-hidden="true">
          ↗
        </span>
      </header>
      <div className="location-origin-row">
        <label className="location-town-field">
          Starting from
          <select
            value={location.coordinates?.label || ''}
            onChange={(event) => {
              const town = locationTowns.find((item) => item.name === event.target.value);
              if (town) location.choose(town);
              else location.clear();
            }}
          >
            <option value="">Choose your town</option>
            {locationTowns.map((town) => (
              <option key={town.name} value={town.name}>
                {town.name}
              </option>
            ))}
          </select>
        </label>
        <span className="location-or">or</span>
        <button
          type="button"
          className="location-gps"
          disabled={location.loading}
          onClick={location.locate}
        >
          <span aria-hidden="true">◎</span>{' '}
          {location.loading ? 'Locating…' : 'Use current location'}
        </button>
      </div>
      {location.loading && (
        <div className="location-status" role="status">
          Finding your location. You can choose a town instead.
          <button type="button" onClick={location.clear}>
            Cancel
          </button>
        </div>
      )}
      {location.error && (
        <p className="location-help" role="status">
          {location.error}
        </p>
      )}
      {km !== null ? (
        <div className="location-distance-summary" aria-live="polite">
          <div>
            <span>
              {location.coordinates?.label || 'Your location'}{' '}
              <span aria-hidden="true">→</span> {destination.name}
            </span>
            <strong>
              {km.toFixed(1)} <small>km</small>
            </strong>
            <p>Approximate straight-line distance · road distance will be longer.</p>
          </div>
          <button type="button" className="location-clear" onClick={location.clear}>
            Change start
          </button>
        </div>
      ) : (
        <p className="location-intro">
          Choose where you’re starting to see the distance.
        </p>
      )}
      {embed && (
        <Suspense fallback={<div className="destination-map-frame">Loading map…</div>}>
          <DestinationMap destination={destination} />
        </Suspense>
      )}
      <footer className="location-footer">
        <a
          className="button location-directions"
          href={directions.toString()}
          target="_blank"
          rel="noreferrer"
        >
          Get directions <span aria-hidden="true">↗</span>
        </a>
        <small>
          Opens Google Maps for the road route. Your selected start is shared only when
          you open it.
        </small>
      </footer>
    </section>
  );
}
