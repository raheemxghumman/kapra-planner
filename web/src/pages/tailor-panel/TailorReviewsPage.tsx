import { MessageSquareReply } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { listOwnReviews, replyToReview } from '../../api/tailors.api';
import { Button } from '../../components/ui/Button';
import { Stars } from '../../components/ui/Display';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { timeAgo } from '../../utils/time';

const TONE = { positive: 'olive', neutral: 'sand', negative: 'henna' } as const;

export function TailorReviewsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const reviews = useApi((signal) => listOwnReviews(page, signal), [page]);
  const [replying, setReplying] = useState<string | null>(null);
  const [text, setText] = useState('');

  const reply = useAction(async (id: string) => {
    await replyToReview(id, text.trim());
    setReplying(null);
    setText('');
    reviews.reload();
    toast({ title: 'Reply posted' });
  });

  return (
    <div>
      <PageHeader eyebrow="Reviews" title="What customers" accent="say" description="The sentiment label comes from a pre-trained language model; it feeds 30% of your Kapra score." />
      {reviews.error && <ErrorNote message={reviews.error} onRetry={reviews.reload} />}
      {reviews.loading && !reviews.data ? (
        <Skeleton className="h-80" />
      ) : reviews.data?.data.length === 0 ? (
        <EmptyState title="No reviews yet" description="Customers can review you after a completed booking." />
      ) : (
        <>
          <ul className="space-y-4">
            {reviews.data?.data.map((review, index) => (
              <motion.li key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-[20px] border border-hairline bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Stars value={review.rating} />
                    <span className="text-sm font-semibold">{review.customerName}</span>
                    <span className="text-xs text-stone">{timeAgo(review.createdAt)}</span>
                  </div>
                  {review.sentimentLabel ? <StatusPill tone={TONE[review.sentimentLabel]}>{review.sentimentLabel}</StatusPill> : <StatusPill tone="stone">not scored yet</StatusPill>}
                </div>
                {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
                {review.reply ? (
                  <p className="mt-3 border-l-2 border-olive pl-3 text-sm text-ink/70">
                    <span className="font-semibold">Your reply:</span> {review.reply}
                  </p>
                ) : replying === review.id ? (
                  <div className="mt-4 flex gap-2">
                    <input autoFocus value={text} maxLength={500} onChange={(event) => setText(event.target.value)} placeholder="Thank them, or explain what you will improve" className="flex-1 rounded-full border border-hairline bg-paper px-4 py-2 text-sm outline-none focus:border-olive" />
                    <Button size="sm" disabled={text.trim().length < 2} loading={reply.running} onClick={() => reply.run(review.id)}>
                      Post
                    </Button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setReplying(review.id)} className="mt-3 flex items-center gap-1.5 text-sm text-muted hover:text-ink">
                    <MessageSquareReply size={14} /> Reply
                  </button>
                )}
              </motion.li>
            ))}
          </ul>
          {reviews.data && reviews.data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Newer
              </Button>
              <span className="text-muted">
                {page} / {reviews.data.meta.totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= reviews.data.meta.totalPages} onClick={() => setPage(page + 1)}>
                Older
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
