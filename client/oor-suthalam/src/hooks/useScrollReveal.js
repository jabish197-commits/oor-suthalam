import { useEffect, useRef } from 'react';

// Progressive enhancement: without an observer or with reduced motion, content stays visible.
export default function useScrollReveal(dependencies = []) {
  const root = useRef(null);
  useEffect(() => {
    if (
      !root.current ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    root.current
      .querySelectorAll(
        '.explore-section, .trip-finder, .destination-card, .escape-package',
      )
      .forEach((node) => {
        if (node.classList.contains('is-revealed')) return;
        node.classList.add('scroll-reveal');
        const index = Array.from(node.parentElement.children).indexOf(node);
        node.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 65}ms`);
        observer.observe(node);
      });
    return () => observer.disconnect();
  }, dependencies);
  return root;
}
