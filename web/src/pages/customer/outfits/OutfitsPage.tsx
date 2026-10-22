import { motion } from 'motion/react';
import { Link } from 'react-router';
import { listOutfits } from '../../../api/customer.api';
import { OutfitBoard } from '../../../components/outfit/OutfitBoard';
import { ButtonLink } from '../../../components/ui/Button';
import { EmptyState, ErrorNote, Skeleton } from '../../../components/ui/Feedback';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useApi } from '../../../hooks/useApi';
import { formatPrice, labelOf } from '../../../utils/format';
import { formatDate } from '../../../utils/time';

export function OutfitsPage() {
  const outfits = useApi((signal) => listOutfits(signal));

  return (
    <div>
      <PageHeader eyebrow="Wardrobe" title="Your saved" accent="looks" actions={<ButtonLink to="/app/stylist">New look</ButtonLink>} />
      {outfits.error && <ErrorNote message={outfits.error} onRetry={outfits.reload} />}
      {outfits.loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-80" />
          ))}
        </div>
      ) : outfits.data?.length === 0 ? (
        <EmptyState title="No saved looks" description="Ask the AI stylist for a few ideas and keep the ones you love." action={<ButtonLink to="/app/stylist">Style me</ButtonLink>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.data?.map((outfit, index) => {
            const total = outfit.items.reduce((sum, item) => sum + item.product.price, 0);
            return (
              <motion.div key={outfit.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.6 }}>
                <Link to={`/app/outfits/${outfit.id}`} className="group block rounded-[24px] border border-hairline bg-card p-4 transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(43,41,38,0.6)]">
                  <div className="rounded-2xl bg-[#e3dccf] p-3">
                    <OutfitBoard items={outfit.items} compact linked={false} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                      <p className="truncate font-logo text-xl italic">{outfit.name}</p>
                      <p className="text-xs text-muted">
                        {outfit.occasion ? `${labelOf(outfit.occasion)} · ` : ''}
                        {outfit.items.length} pieces · {formatDate(outfit.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(total)}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
