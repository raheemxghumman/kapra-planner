import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { listAdminReviews, setReviewHidden } from '../../api/panels.api';
import { Button } from '../../components/ui/Button';
import { Stars } from '../../components/ui/Display';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { timeAgo } from '../../utils/time';

const TONE = { positive: 'olive', neutral: 'sand', negative: 'henna' } as const;

/** Review moderation. "Most negative" uses the language model's scores to surface problems first. */
export function AdminReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'negative' | 'hidden'>('negative');
  const [page, setPage] = useState(1);
  const reviews = useApi((signal) => listAdminReviews({ filter, page }, signal), [filter, page]);
  const toggle = useAction(async (id: string, hidden: boolean) => {
    await setReviewHidden(id, hidden);
    reviews.reload();
  });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Review" accent="moderation" description="Hidden reviews no longer count towards a tailor's rating or Kapra score; the ranking updates immediately." />
      <Tabs
        className="mb-6"
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        tabs={[
          { value: 'negative', label: 'Most negative' },
          { value: 'all', label: 'Newest' },
          { value: 'hidden', label: 'Hidden' },
        ]}
      />
      {reviews.error && <ErrorNote message={reviews.error} onRetry={reviews.reload} />}
      {reviews.loading && !reviews.data ? (
        <Skeleton className="h-96" />
      ) : reviews.data?.data.length === 0 ? (
        <EmptyState title="Nothing here" />
      ) : (
        <ul className="space-y-3">
          {reviews.data?.data.map((review, index) => (
            <motion.li key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className={`rounded-[20px] border border-hairline bg-card p-5 ${review.isHidden ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Stars value={review.rating} />
                  <span className="font-semibold">{review.customer.name}</span>
                  <span className="text-muted">on</span>
                  <Link to={`/tailors/${review.tailor.slug}`} className="underline underline-offset-4">
                    {review.tailor.businessName}
                  </Link>
                  <span className="text-xs text-stone">{timeAgo(review.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {review.sentimentLabel && (
                    <StatusPill tone={TONE[review.sentimentLabel]}>
                      {review.sentimentLabel} {review.sentimentScore !== null && `· ${Math.round(review.sentimentScore * 100)}`}
                    </StatusPill>
                  )}
                  <Button size="sm" variant="ghost" loading={toggle.running} onClick={() => toggle.run(review.id, !review.isHidden)}>
                    {review.isHidden ? <Eye size={13} /> : <EyeOff size={13} />} {review.isHidden ? 'Show' : 'Hide'}
                  </Button>
                </div>
              </div>
              {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
            </motion.li>
          ))}
        </ul>
      )}
      {reviews.data && reviews.data.meta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            {page} / {reviews.data.meta.totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= reviews.data.meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
