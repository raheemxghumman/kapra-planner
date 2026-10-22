import { Bookmark, ScanFace, Scissors, ThumbsDown, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { rateSuggestion, saveSuggestion } from '../../../api/customer.api';
import { OutfitBoard } from '../../../components/outfit/OutfitBoard';
import { Button, ButtonLink } from '../../../components/ui/Button';
import { useAction } from '../../../hooks/useAction';
import { useToast } from '../../../hooks/useToast';
import type { OutfitSuggestion } from '../../../types/stylist';
import { cn, formatPrice, imageUrl, labelOf } from '../../../utils/format';

/** One look from the stylist: the board, the reasoning, every piece and what to do next. */
export function SuggestionCard({ suggestion, budget, index }: { suggestion: OutfitSuggestion; budget: number; index: number }) {
  const { toast } = useToast();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean | null>(null);
  const save = useAction(async () => {
    const outfit = await saveSuggestion(suggestion.id);
    setSavedId(outfit.id);
    toast({ title: 'Look saved', description: suggestion.title, action: { label: 'Open outfit', to: `/app/outfits/${outfit.id}` } });
  });
  const rate = useAction(async (value: boolean) => {
    setLiked(value);
    await rateSuggestion(suggestion.id, value);
    if (!value) toast({ title: 'Noted', description: 'We will avoid these pieces next time.', tone: 'info' });
  });

  const main = suggestion.items.find((item) => item.slot === 'full_look' || item.slot === 'top') ?? suggestion.items[0];
  const stitchable = suggestion.items.some((item) => item.product.category === 'unstitched');
  const used = Math.min(100, (suggestion.totalPrice / budget) * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[26px] border border-hairline bg-card"
    >
      <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
        <div className="bg-[#e3dccf] p-5">
          <OutfitBoard items={suggestion.items} />
        </div>
        <div className="flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-muted">Look {index + 1}</p>
            <div className="flex gap-1">
              <button type="button" aria-label="I like this" aria-pressed={liked === true} onClick={() => rate.run(true)} className={cn('rounded-full p-2 transition-colors', liked === true ? 'bg-olive text-paper' : 'text-muted hover:bg-ink/5')}>
                <ThumbsUp size={15} />
              </button>
              <button type="button" aria-label="Not for me" aria-pressed={liked === false} onClick={() => rate.run(false)} className={cn('rounded-full p-2 transition-colors', liked === false ? 'bg-henna text-paper' : 'text-muted hover:bg-ink/5')}>
                <ThumbsDown size={15} />
              </button>
            </div>
          </div>
          <h3 className="mt-1 font-logo text-[2rem] leading-[1.05] italic">{suggestion.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{suggestion.reason}</p>

          <ul className="mt-5 divide-y divide-hairline/70 border-y border-hairline/70">
            {suggestion.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-2.5">
                <img src={imageUrl(item.product.images[0], 120)} alt="" className="h-14 w-11 shrink-0 rounded-md bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <Link to={`/shop/${item.productId}`} className="truncate text-sm hover:underline">
                      {item.product.title}
                    </Link>
                    <span className="shrink-0 text-sm">{formatPrice(item.product.price)}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {labelOf(item.slot)} · {item.product.brand.name}
                    {item.variant?.size && ` · size ${item.variant.size}`}
                  </p>
                  {item.reason && <p className="mt-0.5 text-xs text-ink/60 italic">“{item.reason}”</p>}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total</span>
              <span className="font-semibold">
                {formatPrice(suggestion.totalPrice)} <span className="font-normal text-muted">of {formatPrice(budget)}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline/70">
              <motion.div initial={{ width: 0 }} animate={{ width: `${used}%` }} transition={{ duration: 1.2, delay: 0.4 + index * 0.15 }} className="h-full rounded-full bg-olive" />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {savedId ? (
              <ButtonLink to={`/app/outfits/${savedId}`} size="sm" variant="soft">
                <Bookmark size={14} className="fill-current" /> Saved · open
              </ButtonLink>
            ) : (
              <Button size="sm" onClick={() => save.run()} loading={save.running}>
                <Bookmark size={14} /> Save look
              </Button>
            )}
            {main && (
              <ButtonLink to={`/app/try-on?product=${main.productId}`} size="sm" variant="ghost">
                <ScanFace size={14} /> Try on
              </ButtonLink>
            )}
            <ButtonLink to={`/tailors${stitchable ? '?speciality=women_eastern' : ''}`} size="sm" variant="ghost">
              <Scissors size={14} /> {stitchable ? 'Get it stitched' : 'Find a tailor'}
            </ButtonLink>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
