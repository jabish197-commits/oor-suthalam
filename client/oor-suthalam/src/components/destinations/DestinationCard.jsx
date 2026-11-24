import '../../assets/place-gallery.css';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { money } from '../../utils/format';

export default function DestinationCard({ destination, showFavorite = false }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saved = user?.savedPlaces?.some((place) => String(place?._id || place) === String(destination._id));
  async function toggleFavorite() {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      setUser(await (saved ? authService.removeSavedPlace(destination._id) : authService.savePlace(destination._id)));
    } catch (error) {
      setSaveError(error.message || 'Unable to save this place. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  const [failedPhotos, setFailedPhotos] = useState([]);
  const photos = [
    ...new Set(
      [
        destination.image,
        ...(destination.gallery || []).map((place) => place.image),
      ].filter(Boolean),
    ),
  ].filter((photo) => !failedPhotos.includes(photo));
  const [playing, setPlaying] = useState(false);
  const card = useRef(null);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) =>
        setPlaying(
          entry.isIntersecting &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        ),
      { threshold: 0.1 },
    );
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || photos.length < 2) return;
    const timer = setInterval(
      () => setFrame((current) => (current + 1) % photos.length),
      2200,
    );
    return () => clearInterval(timer);
  }, [playing, photos.length]);
  return (
    <article ref={card} className="destination-card">
      <div>
        {showFavorite && (
          <button type="button" className="destination-favorite" aria-label={`${saved ? 'Remove' : 'Save'} ${destination.name}${saved ? ' from saved places' : ' to saved places'}`} aria-pressed={Boolean(saved)} disabled={saving} onClick={toggleFavorite}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11Z" /></svg>
          </button>
        )}
        <Link
          to={`/destinations/${destination._id}`}
          className={`destination-art ${destination.category?.toLowerCase()}`}
        >
          {photos.length ? (
            <img
              key={photos[frame % photos.length]}
              src={photos[frame % photos.length]}
              alt={destination.name}
              loading="lazy"
              onError={(event) => {
                const failed = event.currentTarget.getAttribute('src');
                setFailedPhotos((current) => current.includes(failed) ? current : [...current, failed]);
              }}
            />
          ) : (
            <span className="landscape-symbol" aria-hidden="true">
              {destination.category === 'Coast' ? '≈' : '△'}
            </span>
          )}

          <span className="tag">
            {destination.hiddenGem ? 'Quieter discovery' : destination.category}
          </span>
        </Link>

        <Link className="card-body" to={`/destinations/${destination._id}`}>
          <small>{destination.region}</small>
          <h3>{destination.name} </h3>
          {destination.distance != null && (
            <small className="destination-distance">
              {destination.distance.toFixed(1)} km · straight-line
            </small>
          )}
          <p>{destination.description}</p>

          <div className="card-bottom">
            <strong>
              {destination.dailyBudget
                ? money(destination.dailyBudget)
                : 'Budget on request'}
            </strong>
            <small>per person / day est.</small>
          </div>
        </Link>
      </div>
      {saveError && <p className="destination-save-error" role="alert">{saveError}</p>}
    </article>
  );
}
