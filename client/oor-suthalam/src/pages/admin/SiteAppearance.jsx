import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import useResource from '../../hooks/useResource';
import Resource from '../../components/common/Resource';
import Button from '../../components/common/Button';
import PhotoUpload from '../../components/common/PhotoUpload';
import { destinationService } from '../../services/destinationService';

export default function SiteAppearance() {
  const resource = useResource(() => api('/site-settings'));
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <small className="eyebrow">WEBSITE CONTENT</small>
          <h1>Homepage video</h1>
          <p>Change the banner video shown to visitors.</p>
        </div>
      </div>
      <Resource resource={resource}>
        {(settings) => (
          <AppearanceForm
            key={settings.heroVideo + settings.heroPoster}
            settings={settings}
          />
        )}
      </Resource>
    </>
  );
}
function AppearanceForm({ settings }) {
  const [file, setFile] = useState(null),
    [preview, setPreview] = useState(''),
    [playable, setPlayable] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [reset, setReset] = useState(false);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const data = new FormData(event.currentTarget);
    try {
      let heroVideo = reset ? '' : settings.heroVideo,
        heroPoster = reset ? '' : settings.heroPoster;
      if (file) {
        if (!playable)
          throw new Error('The selected video cannot be played. Choose an H.264 MP4.');
        heroVideo = (await api('/site-settings/video', { method: 'POST', body: file }))
          .video;
        heroPoster = '';
      }
      const poster = data.get('heroPosterFile');
      if (poster?.size) heroPoster = (await destinationService.uploadImage(poster)).image;
      await api('/site-settings', { method: 'PUT', body: { heroVideo, heroPoster } });
      setSuccess(
        'Homepage video saved successfully. Visitors will see it when they reload the homepage.',
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel stack admin-media-form" onSubmit={save}>
      <fieldset
        disabled={busy}
        style={{ border: 0, padding: 0, margin: 0 }}
        className="stack"
      >
        <label>
          Banner video (MP4, maximum 30 MB)
          <input
            key={reset ? 'default-video' : 'custom-video'}
            type="file"
            accept="video/mp4,.mp4"
            onChange={(e) => {
              const next = e.target.files[0];
              setError('');
              setSuccess('');
              setPlayable(false);
              if (next && (next.type !== 'video/mp4' || next.size > 30 * 1024 * 1024)) {
                e.target.value = '';
                setFile(null);
                setError('Choose an MP4 video up to 30 MB.');
                return;
              }
              setFile(next || null);
              if (next) setReset(false);
            }}
          />
        </label>
        <video
          className="admin-video-preview"
          src={preview || (reset ? '/videos/sunny-coast.mp4' : settings.heroVideo)}
          controls
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setPlayable(true)}
          onError={() => {
            setPlayable(false);
            if (file)
              setError(
                'This browser cannot play the selected video. Export an H.264 MP4.',
              );
          }}
        />
        <label>
          Optional video cover photo
          <PhotoUpload name="heroPoster" current={reset ? '' : settings.heroPoster} />
        </label>
        <label className="budget-checkbox">
          <input
            type="checkbox"
            checked={reset}
            onChange={(e) => {
              setReset(e.target.checked);
              if (e.target.checked) {
                setFile(null);
                setPreview('');
              }
            }}
          />{' '}
          Use the default sunny coastal video
        </label>
        <small>
          Use footage you own or have permission to publish. H.264 MP4 is recommended for
          mobile browsers. The banner plays muted and has a pause button.
        </small>
      </fieldset>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice success" role="status">
          {success}
        </p>
      )}
      <Button busy={busy}>Save video changes</Button>
    </form>
  );
}
