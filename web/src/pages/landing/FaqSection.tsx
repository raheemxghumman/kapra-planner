import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'Are the products real and in stock?',
    a: 'Yes. Every piece comes from the brand’s own online store and is refreshed every night. The stylist can only pick items that are in stock in your size, and we check each one again before showing it.',
  },
  {
    q: 'What does the virtual try-on do with my photo?',
    a: 'It is used only to render outfits on you. Photos are stored privately, never shown to anyone else, never used to train models, and you can delete them at any time.',
  },
  {
    q: 'How are tailors ranked?',
    a: 'By a best score that combines ratings, what customers actually wrote in their reviews (read by a sentiment model), and how many orders the tailor completes. New tailors with one five-star review cannot jump to the top.',
  },
  {
    q: 'How do payments work?',
    a: 'Through Stripe’s secure checkout. Your card details never touch our servers. If a tailor declines your booking, the payment is refunded automatically.',
  },
  {
    q: 'Does it cost anything to use Kapra?',
    a: 'Planning outfits, browsing and trying on are free. You only pay the brand for products and the tailor for stitching.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-28 md:px-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="eyebrow text-muted">Questions</p>
        <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] tracking-[-0.02em]">
          Things people <span className="font-logo italic">ask</span> us
        </h2>
      </div>
      <dl className="divide-y divide-hairline border-y border-hairline lg:col-span-8">
        {QUESTIONS.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q}>
              <dt>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg md:text-xl"
                >
                  {item.q}
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-light"
                    aria-hidden
                  >
                    +
                  </motion.span>
                </button>
              </dt>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.dd
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-6 leading-relaxed text-ink/70">{item.a}</p>
                  </motion.dd>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
