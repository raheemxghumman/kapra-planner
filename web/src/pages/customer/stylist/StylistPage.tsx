import { Bot, History, Wand2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { getProduct } from '../../../api/catalogue.api';
import { askStylist, listStylistRequests } from '../../../api/customer.api';
import { ColourPicker } from '../../../components/catalogue/ColourPicker';
import { Button } from '../../../components/ui/Button';
import { ErrorNote } from '../../../components/ui/Feedback';
import { ChipGroup, RangeField, TextAreaField } from '../../../components/ui/Fields';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusPill } from '../../../components/ui/StatusPill';
import { useApi } from '../../../hooks/useApi';
import type { Occasion, WearStyle } from '../../../types/catalogue';
import type { StylistRequest } from '../../../types/stylist';
import { getErrorMessage } from '../../../utils/errors';
import { formatPrice, imageUrl, labelOf } from '../../../utils/format';
import { timeAgo } from '../../../utils/time';
import { StylistThinking } from './StylistThinking';
import { SuggestionCard } from './SuggestionCard';

const OCCASIONS: Occasion[] = ['casual', 'office', 'festive', 'formal', 'wedding', 'party'];

/**
 * The AI stylist: describe the occasion, budget and taste; get 2-3 complete outfits made of
 * real, in-stock pieces in your size. "?product=<id>" builds every look around that piece.
 */
export function StylistPage() {
  const [params, setParams] = useSearchParams();
  const anchorId = params.get('product');
  const anchor = useApi((signal) => (anchorId ? getProduct(anchorId, signal) : Promise.resolve(null)), [anchorId]);
  const history = useApi((signal) => listStylistRequests(signal));

  const [occasion, setOccasion] = useState<Occasion>('festive');
  const [budget, setBudget] = useState(15_000);
  const [style, setStyle] = useState<WearStyle | 'profile'>('profile');
  const [colours, setColours] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StylistRequest | null>(null);

  const submit = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const request = await askStylist({
        occasion,
        budget,
        style: style === 'profile' ? undefined : style,
        colours: colours.length ? colours : undefined,
        notes: notes.trim() || undefined,
        anchorProductId: anchorId ?? undefined,
      });
      setResult(request);
      history.reload();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="AI stylist"
        title="Dress me for"
        accent={labelOf(occasion).toLowerCase()}
        description="Complete looks from real, in-stock pieces across 12 Pakistani brands, in your size and within your budget."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6 rounded-[24px] border border-hairline bg-card p-6">
            <AnimatePresence>
              {anchor.data && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                  <img src={imageUrl(anchor.data.images[0], 120)} alt="" className="h-14 w-11 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-muted">Built around</p>
                    <p className="truncate text-sm">{anchor.data.title}</p>
                  </div>
                  <button type="button" aria-label="Remove" onClick={() => setParams({})} className="text-muted hover:text-ink">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <ChipGroup label="Occasion" options={OCCASIONS.map((value) => ({ value, label: labelOf(value) }))} value={[occasion]} onChange={([value]) => setOccasion(value)} />
            <RangeField label="Budget for the whole look" min={3_000} max={60_000} step={500} value={budget} onChange={setBudget} format={formatPrice} />
            <ChipGroup
              label="Style"
              options={[
                { value: 'profile', label: 'My usual' },
                { value: 'eastern', label: 'Eastern' },
                { value: 'western', label: 'Western' },
              ]}
              value={[style]}
              onChange={([value]) => setStyle(value)}
            />
            <ColourPicker label="Colours (optional)" value={colours} onChange={setColours} />
            <TextAreaField label="Anything else?" value={notes} maxLength={300} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. mehndi, light fabric, modest" />
            <Button size="lg" className="w-full" onClick={submit} loading={running}>
              <Wand2 size={16} /> {running ? 'Styling…' : 'Style me'}
            </Button>
          </div>
        </aside>

        <section aria-live="polite">
          <AnimatePresence mode="wait">
            {running ? (
              <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-[26px] border border-hairline bg-card">
                <StylistThinking />
              </motion.div>
            ) : result ? (
              <motion.div key={result.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={result.engine === 'ai' ? 'olive' : 'sand'}>
                    {result.engine === 'ai' ? 'AI stylist' : 'Classic picks (AI busy)'}
                  </StatusPill>
                  <span className="text-sm text-muted">
                    {result.suggestions.length} looks for {labelOf(result.occasion).toLowerCase()} · {formatPrice(result.budget)}
                    {result.durationMs && ` · ${(result.durationMs / 1000).toFixed(1)} s`}
                  </span>
                </div>
                {result.suggestions.map((suggestion, index) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} budget={result.budget} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {error && <ErrorNote message={error} onRetry={submit} />}
                <div className="relative overflow-hidden rounded-[26px] border border-hairline bg-ink p-8 text-paper">
                  <Bot size={26} strokeWidth={1.4} className="text-blush" />
                  <p className="mt-6 max-w-md font-logo text-[2.2rem] leading-[1.05] italic">“Pick the occasion and budget. I’ll do the rest.”</p>
                  <ul className="mt-6 grid gap-2 text-sm text-paper/70 sm:grid-cols-2">
                    <li>· Only pieces in stock, in your size</li>
                    <li>· Every look complete and within budget</li>
                    <li>· Reasons based on real fabric and colour</li>
                    <li>· Learns from what you like and dislike</li>
                  </ul>
                  <motion.div
                    aria-hidden
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-24 -right-24 h-72 w-72 rounded-full border border-dashed border-paper/15"
                  />
                </div>

                {history.data && history.data.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3 flex items-center gap-2 text-muted">
                      <History size={13} /> Earlier requests
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {history.data.slice(0, 6).map((request) => (
                        <button
                          key={request.id}
                          type="button"
                          onClick={() => setResult(request)}
                          className="flex items-center gap-3 rounded-2xl border border-hairline bg-card p-3 text-left transition-colors hover:border-ink"
                        >
                          <div className="flex -space-x-3">
                            {request.suggestions.slice(0, 3).map((suggestion) => (
                              <img key={suggestion.id} src={imageUrl(suggestion.items[0]?.product.images[0], 120)} alt="" className="h-12 w-10 rounded-md border-2 border-card bg-sand object-cover" />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {labelOf(request.occasion)} · {formatPrice(request.budget)}
                            </p>
                            <p className="text-xs text-muted">{timeAgo(request.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
