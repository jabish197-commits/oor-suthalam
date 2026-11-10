import { Link, useParams } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { packageService } from '../../services/packageService';
import Resource from '../../components/common/Resource';
import BookingForm from '../../components/bookings/BookingForm';

export default function PackageDetails() {
  const { id } = useParams();

  const resource = useResource(() => packageService.detail(id), id);

  return (
    <section className="page">
      <Link className="back-link" to="/packages">
        ← All packages
      </Link>

      <Resource resource={resource}>
        {(item) => (
          <div className="detail-grid">
            <div>
              <small className="eyebrow">
                {item.days} DAYS / {item.destination?.name}
              </small>

              <h1>{item.title}</h1>

              {item.destination?.image && (
                <img
                  className="detail-image"
                  src={item.destination.image}
                  alt={item.destination.name}
                />
              )}

              <p className="lead">{item.description}</p>

              <h2>What’s included</h2>

              <ul className="feature-list">
                {(item.inclusions || []).map((inclusion, index) => (
                  <li key={`${index}-${inclusion}`}>✓ {inclusion}</li>
                ))}
              </ul>
            </div>

            <BookingForm travelPackage={item} />
          </div>
        )}
      </Resource>
    </section>
  );
}
