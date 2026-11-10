import { useState } from 'react';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import { api } from '../../services/api';
import Resource from '../../components/common/Resource';
import PhotoUpload from '../../components/common/PhotoUpload';
import Button from '../../components/common/Button';
const galleryFor = (place) =>
  (place.galleryConfigured || place.gallery?.length
    ? place.gallery
    : (place.activities || []).map((title) => ({
        title,
        caption: `Suggested stop in ${place.name}. Confirm opening hours and visitor access before travel.`,
        image: '',
      }))
  ).map((item) => ({ ...item, editKey: crypto.randomUUID() }));
export default function ManageGalleries() {
  const resource = useResource(destinationService.list);
  const [selected, setSelected] = useState('');
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <small className="eyebrow">DESTINATION CONTENT</small>
          <h1>Place galleries</h1>
          <p>Add individual attractions and upload their photos for each destination.</p>
        </div>
      </div>
      <Resource resource={resource} empty="Create a destination first.">
        {(places) => (
          <>
            <label className="admin-gallery-select">
              Destination
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Choose a destination</option>
                {places.map((place) => (
                  <option key={place._id} value={place._id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </label>
            {places.find((p) => p._id === selected) && (
              <GalleryEditor
                key={selected}
                place={places.find((p) => p._id === selected)}
              />
            )}
          </>
        )}
      </Resource>
    </>
  );
}
function GalleryEditor({ place }) {
  const [rows, setRows] = useState(() => galleryFor(place)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  function change(index, key, value) {
    setMessage('');
    setRows((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const gallery = [];
      for (const row of rows) {
        let image = row.image || '';
        const file = form.get(`${row.editKey}File`);
        if (file?.size) image = (await destinationService.uploadImage(file)).image;
        gallery.push({ title: row.title, caption: row.caption || '', image });
      }
      const updated = await api(`/destinations/${place._id}/gallery`, {
        method: 'PUT',
        body: { gallery },
      });
      setRows(galleryFor(updated));
      setMessage(`${place.name} gallery saved successfully.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack admin-gallery-editor" onSubmit={save}>
      <fieldset
        className="stack"
        disabled={busy}
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        {rows.map((row, index) => (
          <article className="panel stack" key={row.editKey}>
            <div className="summary-row">
              <h3>Place {index + 1}</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setRows((items) => items.filter((_, i) => i !== index));
                  setMessage('');
                }}
              >
                Remove entry
              </button>
            </div>
            <label>
              Place name
              <input
                value={row.title}
                onChange={(e) => change(index, 'title', e.target.value)}
                required
                minLength={2}
                maxLength={120}
              />
            </label>
            <label>
              About this place
              <textarea
                value={row.caption}
                onChange={(e) => change(index, 'caption', e.target.value)}
                maxLength={500}
                rows={2}
              />
            </label>
            <label>
              Place photo
              <PhotoUpload name={row.editKey} current={row.image} />
            </label>
            {row.image && (
              <button
                type="button"
                className="text-button"
                onClick={() => change(index, 'image', '')}
              >
                Clear current photo
              </button>
            )}
          </article>
        ))}
        {!rows.length && <p className="notice">No gallery entries. Add a place below.</p>}
        <button
          type="button"
          className="button secondary"
          disabled={rows.length >= 20}
          onClick={() =>
            setRows((items) => [
              ...items,
              { title: '', caption: '', image: '', editKey: crypto.randomUUID() },
            ])
          }
        >
          Add a place
        </button>
      </fieldset>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <Button busy={busy}>Save gallery changes</Button>
    </form>
  );
}
