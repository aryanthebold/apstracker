'use client';

import { useEffect, useState } from 'react';

/**
 * ScrollProgressBar — thin 2px accent-blue bar at the very top of the page
 * that fills left-to-right as the user scrolls down.
 */
export default function ScrollProgressBar() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setWidth(0);
        return;
      }
      setWidth(Math.min(100, (scrollTop / docHeight) * 100));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (width === 0) return null;

  return (
    <div
      className="scroll-progress-bar"
      style={{ width: `${width}%` }}
      aria-hidden="true"
    />
  );
}
