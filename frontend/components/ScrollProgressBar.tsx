'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * ScrollProgressBar — thin 2px accent-blue bar at the very top of the page
 * that fills left-to-right as the user scrolls down.
 * Uses requestAnimationFrame throttle to avoid layout thrashing.
 */
export default function ScrollProgressBar() {
  const [width, setWidth] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return; // Already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) {
          setWidth(0);
          return;
        }
        setWidth(Math.min(100, (scrollTop / docHeight) * 100));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (width === 0) return null;

  return (
    <div
      className="scroll-progress-bar"
      style={{ width: `${width}%`, willChange: 'width', transform: 'translateZ(0)' }}
      aria-hidden="true"
    />
  );
}
