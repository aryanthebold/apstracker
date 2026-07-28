'use client';

import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedNumberProps {
  value: number | null | undefined;
  duration?: number;
  enabled?: boolean;
  prefix?: string;
  suffix?: string;
  fallback?: string;
  decimals?: number;
}

export default function AnimatedNumber({ 
  value, 
  duration = 800, 
  enabled = true,
  prefix = '',
  suffix = '',
  fallback = 'N/A',
  decimals = 2
}: AnimatedNumberProps) {
  const displayValue = useCountUp(value ?? 0, duration, enabled && value != null);

  if (value == null) {
    return <span>{fallback}</span>;
  }

  return (
    <span>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
