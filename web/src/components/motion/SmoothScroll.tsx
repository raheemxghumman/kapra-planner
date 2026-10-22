import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router';

let lenis: Lenis | null = null;

/** Scrolls to the top instantly (used on page changes) whether or not Lenis is running. */
function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/**
 * Smooth, slightly eased scrolling for the whole site (Lenis). It interpolates the native
 * scroll position, so sticky elements, scroll-linked animations and the scrollbar keep working.
 * Turned off for users who ask their system for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
    let frame = 0;
    const loop = (time: number) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return <>{children}</>;
}
