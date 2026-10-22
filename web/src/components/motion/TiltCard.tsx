import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Leans towards the pointer in 3D (perspective + rotateX/rotateY) and lifts a light glare.
 * Springs smooth the movement so it feels like a real card, not a jittery effect.
 */
export function TiltCard({ children, className, intensity = 10 }: { children: ReactNode; className?: string; intensity?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22 };
  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), spring);
  const glareX = useTransform(x, (value) => `${value * 100}%`);
  const glareY = useTransform(y, (value) => `${value * 100}%`);
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 45%)`,
  );

  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          x.set((event.clientX - rect.left) / rect.width);
          y.set((event.clientY - rect.top) / rect.height);
        }}
        onPointerLeave={() => {
          x.set(0.5);
          y.set(0.5);
        }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full"
      >
        {children}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glare }}
        />
      </motion.div>
    </div>
  );
}
