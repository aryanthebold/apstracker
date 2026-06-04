'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  once?: boolean;
  threshold?: number;
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
  threshold = 0.15,
  duration = 600,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [once, threshold]);

  const directionStyles: Record<string, { from: string; to: string }> = {
    up: {
      from: 'translate3d(0, 40px, 0)',
      to: 'translate3d(0, 0, 0)',
    },
    down: {
      from: 'translate3d(0, -30px, 0)',
      to: 'translate3d(0, 0, 0)',
    },
    left: {
      from: 'translate3d(50px, 0, 0)',
      to: 'translate3d(0, 0, 0)',
    },
    right: {
      from: 'translate3d(-50px, 0, 0)',
      to: 'translate3d(0, 0, 0)',
    },
    scale: {
      from: 'scale(0.92)',
      to: 'scale(1)',
    },
  };

  const { from, to } = directionStyles[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? to : from,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
