import { useEffect, useRef } from 'react';

export default function LoginVideo() {
  const video = useRef(null);
  useEffect(() => {
    const element = video.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    element.muted = true;
    element.defaultMuted = true;
    const resume = () => {
      if (!motion.matches && !document.hidden && element.paused)
        element.play().catch(() => {});
    };
    const updateMotion = () => (motion.matches ? element.pause() : resume());
    resume();
    element.addEventListener('canplay', resume);
    document.addEventListener('pointerdown', resume, { passive: true });
    document.addEventListener('visibilitychange', resume);
    motion.addEventListener('change', updateMotion);
    return () => {
      element.removeEventListener('canplay', resume);
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('visibilitychange', resume);
      motion.removeEventListener('change', updateMotion);
    };
  }, []);
  return (
    <video
      ref={video}
      className="login-background-video"
      src="/videos/clear-sea.mp4"
      poster="/images/sunny-coast.jpg"
      muted
      autoPlay
      loop
      playsInline
      controls={false}
      disablePictureInPicture
      preload="auto"
      aria-hidden="true"
    />
  );
}
