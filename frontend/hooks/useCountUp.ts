import { useEffect, useState } from 'react';

export function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    
    let start: number | null = null;
    let animId: number;
    
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      setValue(parseFloat((eased * target).toFixed(2)));
      
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    
    animId = requestAnimationFrame(step);
    
    return () => cancelAnimationFrame(animId);
  }, [target, duration, enabled]);

  return value;
}
