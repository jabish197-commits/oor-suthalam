import useScrollReveal from '../../hooks/useScrollReveal';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { distanceKm } from '../../utils/distance';
import '../../assets/discovery-filters.css';
import { useSearchParams } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import Resource from '../../components/common/Resource';
import DestinationCard from '../../components/destinations/DestinationCard';
import SearchFilters from '../../components/destinations/SearchFilters';

export default function Destinations() {
  const location = useCurrentLocation();
  const [params, setParams] = useSearchParams();
  const key = params.toString();

  const resource = useResource(() => destinationService.list(key), key, {
    keepPreviousData: true,
  });

  const revealRoot = useScrollReveal([resource.data]);
  function updateFilter(name, value) {
    const next = new URLSearchParams(params);

    if (value) next.set(name, value);
    else next.delete(name);

    setParams(next, { replace: true });
  }

  return (
    <section ref={revealRoot} className="page">
      <div className="page-heading">
        <small className="eyebrow">EXPLORE TAMIL NADU & KERALA</small>
        <h1>Closer places. Deeper discoveries.</h1>
        <p>From familiar favourites to quieter towns across Tamil Nadu & Kerala.</p>
      </div>

      <SearchFilters
        query={params.get('q') || ''}
        category={params.get('category') || ''}
        discovery={params.get('hidden') || ''}
        onDiscoveryChange={(value) => updateFilter('hidden', value)}
        onLocate={location.locate}
        onClearLocation={location.clear}
        locating={location.loading}
        nearby={Boolean(location.coordinates)}
        onQueryChange={(value) => updateFilter('q', value)}
        onCategoryChange={(value) => updateFilter('category', value)}
      />

      {location.error && (
        <p className="notice error" role="alert">
          {location.error}
        </p>
      )}
      <Resource resource={resource} empty="No destinations found. Try another search.">
        {(data) => (
          <>
            <p className="muted">{data.length} destinations</p>

            <div className="card-grid">
              {[...data]
                .map((destination) => ({
                  ...destination,
                  distance: distanceKm(location.coordinates, destination),
                }))
                .sort((a, b) =>
                  location.coordinates
                    ? (a.distance ?? Infinity) - (b.distance ?? Infinity)
                    : 0,
                )
                .map((destination) => (
                  <DestinationCard key={destination._id} destination={destination} />
                ))}
            </div>
          </>
        )}
      </Resource>
    </section>
  );
}
