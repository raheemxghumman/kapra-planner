import { motion } from 'motion/react';
import { Link } from 'react-router';
import type { Product } from '../../types/catalogue';
import { imageUrl } from '../../utils/format';

const PANELS = [
  {
    role: 'brand',
    eyebrow: 'For brands',
    title: 'Be part of the outfit, not just the search.',
    points: [
      'Your products appear in complete looks the stylist builds',
      'Manage stock, stores and orders in one panel',
      'See which pieces get saved, tried on and bought',
    ],
    cta: 'List your brand',
  },
  {
    role: 'tailor',
    eyebrow: 'For tailors',
    title: 'Orders from customers who already know what they want.',
    points: [
      'Bookings arrive with the outfit and exact measurements',
      'Paid online before you cut the fabric',
      'Good reviews move you up the map',
    ],
    cta: 'Join as a tailor',
  },
];

export function PartnersSection({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-28 md:px-10">
      <p className="eyebrow text-muted">Partners</p>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PANELS.map((panel, index) => (
          <motion.article
            key={panel.role}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-[32px] p-8 md:p-12 ${index === 0 ? 'bg-ink text-paper' : 'bg-blush text-ink'}`}
          >
            {products[index + 6] && (
              <img
                src={imageUrl(products[index + 6].images[0], 500)}
                alt=""
                className="absolute -right-10 -bottom-16 w-56 rotate-6 rounded-2xl object-cover opacity-90 shadow-2xl transition-transform duration-1000 ease-[var(--ease-soft)] group-hover:rotate-2 group-hover:-translate-y-4 md:w-64"
              />
            )}
            <div className="relative max-w-sm">
              <p className={`eyebrow ${index === 0 ? 'text-paper/60' : 'text-ink/60'}`}>{panel.eyebrow}</p>
              <h3 className="mt-4 text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05] tracking-[-0.01em]">{panel.title}</h3>
              <ul className="mt-8 space-y-3 text-[15px]">
                {panel.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className={index === 0 ? 'text-blush' : 'text-henna'}>—</span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                to={`/register?role=${panel.role}`}
                className={`mt-10 inline-flex rounded-full px-6 py-3 text-sm transition-colors ${index === 0 ? 'bg-paper text-ink hover:bg-blush' : 'bg-ink text-paper hover:bg-olive'}`}
              >
                {panel.cta}
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
