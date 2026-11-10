import { Link, useSearchParams } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { packageService } from '../../services/packageService';
import { money } from '../../utils/format';
import Resource from '../../components/common/Resource';

export default function Packages() {
  const [params] = useSearchParams();
  const destination = params.get('destination');
  const resource = useResource(packageService.list);

  return (
    <section className="page">
      <div className="page-heading">
        <small className="eyebrow">THOUGHTFULLY PUT TOGETHER</small>
        <h1>Less planning. More going.</h1>
        <p>
          Discover Tamil Nadu & Kerala itineraries. For a budget-based shortlist, try the
          trip planner.
        </p>
      </div>
      <Link className="button secondary" to="/traveler/plan">
        Find a plan for my budget
      </Link>
      <Resource resource={resource} empty="No packages are available yet.">
        {(packages) => (
          <div className="card-grid">
            {!packages.some(
              (item) => !destination || item.destination?._id === destination,
            ) && <p>No packages match this destination.</p>}
            {packages
              .filter((item) => !destination || item.destination?._id === destination)
              .map((item) => (
                <article className="destination-card" key={item._id}>
                  <Link to={`/packages/${item._id}`}>
                    <div className="destination-art">
                      {item.destination?.image ||
                      item.destination?.gallery?.find((photo) => photo.image)?.image ? (
                        <img
                          src={
                            item.destination.image ||
                            item.destination.gallery.find((photo) => photo.image).image
                          }
                          alt={item.destination.name}
                          loading="lazy"
                        />
                      ) : (
                        <span className="landscape-symbol" aria-hidden="true">
                          △
                        </span>
                      )}

                      <span className="tag">{item.days} days</span>
                    </div>

                    <div className="card-body">
                      <small>{item.destination?.name}</small>
                      <h3>{item.title} </h3>
                      <p>{item.description}</p>
                      <div className="card-bottom">
                        <strong>
                          {item.priceMode === 'quote'
                            ? 'Request quote'
                            : money(item.price)}
                        </strong>
                        <small>per person</small>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
          </div>
        )}
      </Resource>
    </section>
  );
}
