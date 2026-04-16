import { useEffect, useState } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

export function useMouseParallax(intensity: number = 20): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId: number;
    const handleMove = (e: MouseEvent) => {
      rafId = requestAnimationFrame(() => {
        setOffset({
          x: ((e.clientX / window.innerWidth) - 0.5) * intensity,
          y: ((e.clientY / window.innerHeight) - 0.5) * intensity,
        });
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
    };
  }, [intensity]);

  return offset;
}
