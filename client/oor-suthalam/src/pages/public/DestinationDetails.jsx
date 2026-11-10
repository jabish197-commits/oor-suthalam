import DestinationLocation from '../../components/destinations/DestinationLocation';
import '../../assets/discovery-filters.css';
import PlaceGallery from '../../components/destinations/PlaceGallery';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import useResource from '../../hooks/useResource.js';
import { destinationService } from '../../services/destinationService.js';
import { authService } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';

import Resource from '../../components/common/Resource.jsx';
import Button from '../../components/common/Button.jsx';
import '../../assets/destination-details.css';
import { money } from '../../utils/format.js';

export default function DestinationDetails() {
  const { id } = useParams();
  const { user, setUser } = useAuth();

  const resource = useResource(() => destinationService.detail(id), id);

  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const saved = user?.savedPlaces?.some((place) => String(place?._id || place) === id);

  async function toggle() {
    setBusy(true);
    setError('');

    try {
      const updatedUser = saved
        ? await authService.removeSavedPlace(id)
        : await authService.savePlace(id);

      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page destination-detail-page">
      <Link className="back-link" to="/destinations">
        ← All destinations
      </Link>

      <Resource resource={resource}>
        {(destination) => (
          <div className="detail-grid">
            <div>
              <small className="eyebrow">
                {destination.category} / {destination.region}
              </small>

              <h1>{destination.name}</h1>

              {tab === 'overview' && destination.image && (
                <img
                  className="detail-image"
                  src={destination.image}
                  alt={destination.name}
                />
              )}

              <div className="destination-detail-tabs" aria-label="Destination sections">
                <button
                  type="button"
                  aria-pressed={tab === 'overview'}
                  onClick={() => setTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  aria-pressed={tab === 'gallery'}
                  onClick={() => setTab('gallery')}
                >
                  Place gallery
                </button>
                <button
                  className="destination-map-tab"
                  type="button"
                  onClick={() => setTab('map')}
                  aria-pressed={tab === 'map'}
                >
                  Map & distance
                </button>
              </div>
              {tab === 'map' ? (
                <DestinationLocation destination={destination} embed />
              ) : tab === 'gallery' ? (
                <PlaceGallery destination={destination} />
              ) : (
                <>
                  <p className="lead">{destination.description}</p>
                  {destination.accessNote && (
                    <section className="panel">
                      <h3>Before you go</h3>
                      <p>{destination.accessNote}</p>
                      {destination.sourceUrl && (
                        <a href={destination.sourceUrl} target="_blank" rel="noreferrer">
                          District visitor information
                        </a>
                      )}
                    </section>
                  )}

                  {destination.activities?.length > 0 && <h2>Things to do</h2>}

                  <ul className="feature-list">
                    {(destination.activities || []).map((activity, index) => (
                      <li key={`${index}-${activity}`}>{activity}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="panel stack">
              <h2>Plan your visit</h2>

              <h3>
                {destination.dailyBudget
                  ? money(destination.dailyBudget)
                  : 'Budget on request'}
                {destination.dailyBudget > 0 && <small> per person / day</small>}
              </h3>

              <p>
                Estimated daily budget for planning. This is not a confirmed package
                price; final costs depend on your dates and choices.
              </p>

              <Link className="button" to={`/traveler/plan?destination=${id}`}>
                Plan a trip here
              </Link>

              {user ? (
                <Button type="button" busy={busy} className="secondary" onClick={toggle}>
                  {saved ? '♥ Saved · Remove' : '♡ Save this place'}
                </Button>
              ) : (
                <Link
                  className="underlined"
                  to="/login"
                  state={{ from: `/destinations/${id}` }}
                >
                  Sign in to save
                </Link>
              )}

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </aside>
          </div>
        )}
      </Resource>
    </section>
  );
}
