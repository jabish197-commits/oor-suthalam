import { useEffect, useRef, useState } from 'react';
import '../../assets/scenic-hero.css';
import useResource from '../../hooks/useResource';
import { api } from '../../services/api';

export default function ScenicHero() {
  const settings = useResource(() => api('/site-settings'));
  const heroVideo = settings.data?.heroVideo || '/videos/sunny-coast.mp4';
  const heroPoster = settings.data ? settings.data.heroPoster : '/images/sunny-coast.jpg';
  const video = useRef(null);
  const [index, setIndex] = useState(0);
  const playlist =
    heroVideo === '/videos/sunny-coast.mp4'
      ? [heroVideo, '/videos/clear-sea.mp4', '/videos/coastal-sunset.mp4']
      : [heroVideo];
  const [, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const element = video.current;
    if (element) {
      element.muted = true;
      element.defaultMuted = true;
    }
    const resume = () => {
      if (!reduce.matches && !document.hidden && element?.paused)
        element.play().catch(() => {});
    };
    const pauseForMotion = () => {
      if (reduce.matches) element?.pause();
      else resume();
    };
    resume();
    element?.addEventListener('canplay', resume);
    document.addEventListener('visibilitychange', resume);
    document.addEventListener('pointerdown', resume, { passive: true });
    reduce.addEventListener('change', pauseForMotion);
    return () => {
      element?.removeEventListener('canplay', resume);
      document.removeEventListener('visibilitychange', resume);
      document.removeEventListener('pointerdown', resume);
      reduce.removeEventListener('change', pauseForMotion);
    };
  }, [heroVideo, index]);
  return (
    <section className="scenic-hero" aria-label="Discover Tamil Nadu & Kerala">
      <video
        ref={video}
        className="scenic-hero-video"
        key={playlist[index % playlist.length]}
        src={playlist[index % playlist.length]}
        poster={heroPoster || undefined}
        muted
        autoPlay
        playsInline
        controls={false}
        disablePictureInPicture
        preload="auto"
        aria-hidden="true"
        onEnded={() => setIndex((current) => current + 1)}
        onError={() => setFailed(true)}
      />
      <div className="scenic-hero-shade" />
      <div className="scenic-hero-content">
        <span className="scenic-kicker">OOR SUTHALAM · EXPLORE TAMIL NADU & KERALA</span>
        <h1>
          A little escape.
          <br />
          <em>A world of stories.</em>
        </h1>
        <p>
          Find your next favourite place, from misty hill towns to quiet coastal streets.
          Plan a journey that feels like you.
        </p>
      </div>
    </section>
  );
}
