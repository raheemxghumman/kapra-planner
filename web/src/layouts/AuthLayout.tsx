import { motion } from 'motion/react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PageTransition } from '../components/ui/PageTransition';

const FabricScene = lazy(() => import('../components/three/FabricScene'));

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Split screen: form on the left, the 3D fabric scene on a dark panel on the right (desktop). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <PageTransition>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col px-6 py-8 sm:px-12">
          <Link to="/" className="font-logo text-3xl italic" aria-label="Kapra Planner home">
            kapra
          </Link>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl leading-tight"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 text-muted"
            >
              {subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              {children}
            </motion.div>
          </div>
        </div>

        <aside className="relative hidden overflow-hidden bg-ink lg:block">
          <Suspense fallback={null}>
            <FabricScene distance={7} />
          </Suspense>
          {/* Dark fade behind the tagline keeps it readable over the light fabric. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
          <p className="absolute bottom-10 left-10 max-w-xs font-logo text-2xl leading-snug text-paper italic">
            One occasion. One budget. Stitched by tailors you can trust.
          </p>
        </aside>
      </div>
    </PageTransition>
  );
}
