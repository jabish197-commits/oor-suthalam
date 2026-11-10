import '../../assets/place-gallery.css';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../../utils/format';

export default function DestinationCard({ destination }) {
  const photos = [
    ...new Set(
      [
        destination.image,
        ...(destination.gallery || []).map((place) => place.image),
      ].filter(Boolean),
    ),
  ];
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
        <Link
          to={`/destinations/${destination._id}`}
          className={`destination-art ${destination.category?.toLowerCase()}`}
        >
          {photos.length ? (
            <img
              src={photos[frame % photos.length]}
              alt={destination.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
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
    </article>
  );
}
