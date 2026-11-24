import { useState } from 'react';
import '../../assets/destination-photo.css';

export default function DestinationPhoto({
  destination,
  alt = destination?.name || 'Destination',
  className,
  loading = 'lazy',
}) {
  const [failed, setFailed] = useState([]);
  const sources = [
    ...new Set(
      [
        destination?.image,
        ...(destination?.gallery || []).map((photo) => photo.image),
      ].filter((source) => typeof source === 'string' && source.trim()),
    ),
  ];
  const source = sources.find((candidate) => !failed.includes(candidate));

  if (!source) {
    return (
      <span
        className={[className, 'destination-photo-placeholder'].filter(Boolean).join(' ')}
        role="img"
        aria-label={`${alt}: photo unavailable`}
      >
        Photo unavailable
      </span>
    );
  }

  return (
    <img
      key={source}
      className={className}
      src={source}
      alt={alt}
      loading={loading}
      onError={() =>
        setFailed((current) =>
          current.includes(source) ? current : [...current, source],
        )
      }
    />
  );
}
