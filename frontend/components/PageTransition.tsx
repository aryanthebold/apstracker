'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode, useRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) {
      // First page load or same route re-render
      setPhase('enter');
      const timer = setTimeout(() => setPhase('idle'), 50);
      return () => clearTimeout(timer);
    }

    // Route changed — exit then enter
    setPhase('exit');
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      setPhase('enter');
      
      // Safely scroll to top
      try {
        window.scrollTo(0, 0);
      } catch (e) {
        console.warn('ScrollTo failed', e);
      }
      
      prevPath.current = pathname;
      const enterTimer = setTimeout(() => setPhase('idle'), 50);
      return () => clearTimeout(enterTimer);
    }, 250);
    
    return () => clearTimeout(exitTimer);
  }, [pathname, children]);

  // Keep children updated when no transition is happening
  useEffect(() => {
    if (phase === 'idle') {
      setDisplayChildren(children);
    }
  }, [children, phase]);

  return (
    <div
      className="page-transition-wrapper"
      style={{
        opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
        transform:
          phase === 'enter'
            ? 'translateY(16px)'
            : phase === 'exit'
            ? 'translateY(-8px)'
            : 'translateY(0)',
        transition:
          phase === 'idle'
            ? 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'opacity 200ms ease-out, transform 200ms ease-out',
        willChange: 'opacity, transform',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      {displayChildren}
    </div>
  );
}
