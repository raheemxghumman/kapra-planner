import { motion } from 'motion/react';
import { lazy, Suspense } from 'react';
import { PageTransition } from '../components/ui/PageTransition';

// The 3D scene pulls in three.js (~600 KB), so it is loaded only when this page needs it.
const FabricScene = lazy(() => import('../components/three/FabricScene'));

const STEPS = [
  {
    number: '01',
    title: 'Plan it',
    text: 'Tell the AI stylist the occasion, budget and style. Get complete outfits from real, in-stock pieces.',
  },
  {
    number: '02',
    title: 'Try it on',
    text: 'See the outfit on your own photo before you buy or stitch anything.',
  },
  {
    number: '03',
    title: 'Get it stitched',
    text: 'Find rated tailors near you, book and pay online, then track your order and chat until delivery.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function HomePage() {
  return (
    <PageTransition>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
          className="space-y-6"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold tracking-[0.2em] text-muted uppercase"
          >
            AI outfit planner for Pakistan
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-logo text-7xl leading-[0.9] italic md:text-8xl"
          >
            kapra
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-md text-lg text-muted">
            One occasion. One budget. Complete outfits from Pakistani brands, tried on you and
            stitched by tailors you can trust.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <motion.a
              href="#how-it-works"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper"
            >
              See how it works
            </motion.a>
          </motion.div>
        </motion.div>

        <div className="relative h-[420px] md:h-[520px]">
          <Suspense
            fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-card" />}
          >
            <FabricScene />
          </Suspense>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-hairline bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-hairline bg-paper p-6 shadow-sm"
            >
              <span className="text-xs font-semibold tracking-[0.2em] text-olive">
                {step.number}
              </span>
              <h2 className="mt-3 text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
