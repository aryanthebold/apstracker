'use client';

/**
 * IridescentBackground — pure CSS animated gradient background.
 * Place inside the hero section with `position: relative`.
 * The gradient is `position: fixed` so it stays as user scrolls.
 */
export default function IridescentBackground() {
  return (
    <>
      {/* Animated iridescent gradient — fixed so it persists on scroll */}
      <div
        className="fixed inset-0 -z-40 pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg,
            #0D1B4B,
            #4F8EF7,
            #7B5EA7,
            #9B59B6,
            #E91E8C,
            #0D1B4B
          )`,
          backgroundSize: '300% 300%',
          animation: 'iridescent 8s ease-in-out infinite',
          willChange: 'background-position',
          transform: 'translateZ(0)',
        }}
      />
      {/* Dark overlay for text readability */}
      <div
        className="fixed inset-0 -z-39 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.82)' }}
      />
    </>
  );
}
