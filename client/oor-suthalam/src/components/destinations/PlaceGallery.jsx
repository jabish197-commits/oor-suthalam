import { useEffect, useRef, useState } from 'react';
import '../../assets/place-gallery.css';
export default function PlaceGallery({ destination }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const places =
    destination.galleryConfigured || destination.gallery?.length
      ? destination.gallery
      : (destination.activities || []).map((title) => ({
          title,
          caption: `A suggested stop in ${destination.name}. Check visitor access and opening hours before travel.`,
          image: '',
        }));
  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal();
    if (!selected && dialog.current.open) dialog.current.close();
  }, [selected]);
  return (
    <section className="place-gallery">
      <div className="section-heading">
        <div>
          <small className="eyebrow">EXPLORE THE DETAILS</small>
          <h2>Places in {destination.name}</h2>
        </div>
      </div>
      <div className="place-gallery-grid">
        {places.map((place, index) => (
          <article className="place-gallery-card" key={place._id || index}>
            {place.image ? (
              <button
                className="place-gallery-photo"
                type="button"
                onClick={() => setSelected(place)}
                aria-label={`View photo of ${place.title}`}
              >
                <img src={place.image} alt={place.title} loading="lazy" />
                <span>View photo</span>
              </button>
            ) : (
              <div className="place-gallery-placeholder">
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <small>Photo coming soon</small>
              </div>
            )}
            <div className="place-gallery-caption">
              <h3>{place.title}</h3>
              {place.caption && <p>{place.caption}</p>}
            </div>
          </article>
        ))}
      </div>
      {!places.length && (
        <p className="notice">
          Places will appear here when the destination gallery is updated.
        </p>
      )}
      <dialog
        ref={dialog}
        className="place-photo-dialog"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
      >
        <button type="button" onClick={() => setSelected(null)} aria-label="Close photo">
          ×
        </button>
        {selected && (
          <>
            <img src={selected.image} alt={selected.title} />
            <h3>{selected.title}</h3>
            <p>{selected.caption}</p>
          </>
        )}
      </dialog>
    </section>
  );
}
