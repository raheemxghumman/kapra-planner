import { Download, Lock, ScanFace, Scissors, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getProduct } from '../../../api/catalogue.api';
import { deletePhoto, deleteTryOn, getTryOn, getWishlist, listPhotos, listTryOns, startTryOn, uploadPhoto } from '../../../api/customer.api';
import { Button, ButtonLink } from '../../../components/ui/Button';
import { CompareSlider } from '../../../components/ui/CompareSlider';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Dropzone } from '../../../components/ui/Dropzone';
import { EmptyState, ErrorNote, Skeleton } from '../../../components/ui/Feedback';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Panel } from '../../../components/ui/Panel';
import { useAction } from '../../../hooks/useAction';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../hooks/useToast';
import type { Product, ProductCategory } from '../../../types/catalogue';
import type { TryOn } from '../../../types/tryon';
import { cn, imageUrl, labelOf } from '../../../utils/format';
import { timeAgo } from '../../../utils/time';

const WEARABLE: ProductCategory[] = ['kurta', 'top', 'trousers', 'suit', 'dress', 'unstitched', 'outerwear'];
const POLL_MS = 3_000;

export function TryOnPage() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const productId = params.get('product');
  const photos = useApi((signal) => listPhotos(signal));
  const history = useApi((signal) => listTryOns(signal));
  const saved = useApi((signal) => getWishlist(signal));
  const linked = useApi((signal) => (productId ? getProduct(productId, signal) : Promise.resolve(null)), [productId]);

  const [photoId, setPhotoId] = useState<string | null>(null);
  const [piece, setPiece] = useState<Product | null>(null);
  const [job, setJob] = useState<TryOn | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const reloadHistory = history.reload;
  const selectedPhoto = photos.data?.find((photo) => photo.id === (photoId ?? photos.data?.[0]?.id));
  const selectedPiece = piece ?? linked.data ?? null;
  const candidates = (saved.data ?? []).filter((product) => WEARABLE.includes(product.category));

  // While a job is running, ask the server for its status every 3 seconds.
  useEffect(() => {
    if (!job || !['pending', 'processing'].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      const latest = await getTryOn(job.id).catch(() => null);
      if (!latest) return;
      setJob(latest);
      if (latest.status === 'completed') {
        toast({ title: 'Your try-on is ready' });
        reloadHistory();
      }
      if (latest.status === 'failed') reloadHistory();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [job, toast, reloadHistory]);

  const upload = async (file: File) => {
    setUploading(0);
    try {
      const photo = await uploadPhoto(file, setUploading);
      setPhotoId(photo.id);
      photos.reload();
    } catch (error) {
      toast({ title: 'Upload failed', description: (error as Error).message, tone: 'error' });
    } finally {
      setUploading(null);
    }
  };

  const start = useAction(async () => {
    const created = await startTryOn(selectedPhoto!.id, selectedPiece!.id);
    setJob(created);
  });
  const removePhoto = useAction(async (id: string) => {
    await deletePhoto(id);
    setToDelete(null);
    setPhotoId(null);
    photos.reload();
    history.reload();
  });
  const removeTryOn = useAction(async (id: string) => {
    await deleteTryOn(id);
    if (job?.id === id) setJob(null);
    history.reload();
  });

  const running = job && ['pending', 'processing'].includes(job.status);

  return (
    <div>
      <PageHeader eyebrow="Virtual try-on" title="See it" accent="on you" description="Upload a full-length photo, pick a piece and our try-on model dresses you in it. Takes about half a minute." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          <Panel eyebrow="Step 1" title="Your photo" actions={<span className="flex items-center gap-1 text-xs text-muted"><Lock size={12} /> Only you can see it</span>}>
            {photos.loading ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="space-y-4">
                {photos.data && photos.data.length > 0 && (
                  <div className="flex gap-3">
                    {photos.data.map((photo) => (
                      <div key={photo.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => setPhotoId(photo.id)}
                          className={cn('block h-32 w-24 overflow-hidden rounded-xl border-2 transition-all', selectedPhoto?.id === photo.id ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100')}
                        >
                          <img src={photo.url.replace('/upload/', '/upload/c_fill,w_200,h_266/')} alt="Your photo" className="h-full w-full object-cover" />
                        </button>
                        <button type="button" aria-label="Delete photo" onClick={() => setToDelete(photo.id)} className="absolute -top-2 -right-2 hidden h-6 w-6 place-items-center rounded-full bg-ink text-paper group-hover:grid">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {(photos.data?.length ?? 0) < 3 && (
                  <Dropzone onFile={upload} disabled={uploading !== null} label={uploading !== null ? `Uploading… ${uploading}%` : 'Add a full-length photo'} hint="Stand straight, plain background, good light. Up to 3 photos." />
                )}
              </div>
            )}
          </Panel>

          <Panel eyebrow="Step 2" title="The piece">
            {selectedPiece ? (
              <div className="flex items-center gap-4">
                <img src={imageUrl(selectedPiece.images[0], 200)} alt="" className="h-28 w-20 rounded-xl bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-muted">{selectedPiece.brand.name}</p>
                  <p className="text-sm">{selectedPiece.title}</p>
                  <p className="text-xs text-muted">{labelOf(selectedPiece.category)}</p>
                  {!WEARABLE.includes(selectedPiece.category) && <p className="mt-1 text-xs text-henna">Only clothing can be tried on.</p>}
                </div>
                <button
                  type="button"
                  className="text-xs text-muted underline underline-offset-4 hover:text-ink"
                  onClick={() => {
                    setPiece(null);
                    setParams({});
                  }}
                >
                  Change
                </button>
              </div>
            ) : candidates.length ? (
              <div>
                <p className="mb-3 text-sm text-muted">From your saved pieces:</p>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {candidates.map((product) => (
                    <button key={product.id} type="button" onClick={() => setPiece(product)} className="w-24 shrink-0 text-left">
                      <img src={imageUrl(product.images[0], 200)} alt="" className="h-32 w-24 rounded-xl bg-sand object-cover transition-transform hover:-translate-y-1" />
                      <p className="mt-1 truncate text-xs">{product.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Open any piece in the <Link to="/shop" className="text-ink underline underline-offset-4">catalogue</Link> and press “Try on”, or save pieces to pick them here.
              </p>
            )}
          </Panel>

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedPhoto || !selectedPiece || !WEARABLE.includes(selectedPiece.category) || Boolean(running)}
            loading={start.running}
            onClick={() => start.run()}
          >
            <ScanFace size={17} /> Try it on
          </Button>
        </div>

        <div className="space-y-6">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] border border-hairline bg-[#e3dccf]">
            <AnimatePresence mode="wait">
              {job?.status === 'completed' && job.resultUrl && selectedPhoto ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} className="h-full">
                  <CompareSlider before={selectedPhoto.url} after={job.resultUrl} className="h-full rounded-none" />
                </motion.div>
              ) : running && selectedPhoto ? (
                <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-full">
                  <img src={selectedPhoto.url} alt="" className="h-full w-full object-cover opacity-70 grayscale" />
                  <motion.div
                    className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-blush/60 to-transparent mix-blend-multiply"
                    animate={{ top: ['-15%', '100%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-paper/90 p-4 backdrop-blur">
                    <p className="text-sm font-semibold">{job.status === 'pending' ? 'Waiting for a free GPU…' : 'Dressing you…'}</p>
                    <p className="text-xs text-muted">Usually 25-40 seconds. You can leave this page; we will notify you.</p>
                  </div>
                </motion.div>
              ) : job?.status === 'failed' ? (
                <motion.div key="failed" className="grid h-full place-items-center p-8">
                  <ErrorNote message={job.error ?? 'The try-on failed.'} onRetry={() => start.run()} />
                </motion.div>
              ) : selectedPhoto ? (
                <motion.img key={selectedPhoto.id} src={selectedPhoto.url} alt="Your photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full object-cover" />
              ) : (
                <motion.div key="empty" className="grid h-full place-items-center">
                  <EmptyState title="Your mirror" description="Add a photo on the left to begin." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {job?.status === 'completed' && job.resultUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
              <ButtonLink to={`/tailors?tryOn=${job.id}`}>
                <Scissors size={15} /> Book a tailor for this
              </ButtonLink>
              <a href={job.resultUrl.replace('/upload/', '/upload/fl_attachment/')} className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-sm font-semibold hover:border-ink">
                <Download size={15} /> Download
              </a>
            </motion.div>
          )}

          {history.data && history.data.filter((item) => item.resultUrl).length > 0 && (
            <div>
              <p className="eyebrow mb-3 text-muted">Earlier try-ons</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {history.data
                  .filter((item) => item.resultUrl)
                  .map((item) => (
                    <div key={item.id} className="group relative">
                      <button type="button" onClick={() => { setJob(item); setPhotoId(item.photoId); }} className="block aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand">
                        <img src={item.resultUrl!.replace('/upload/', '/upload/c_fill,w_240,h_320/')} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </button>
                      <p className="mt-1 truncate text-[11px] text-muted">{item.product?.title ?? ''} · {timeAgo(item.createdAt)}</p>
                      <button type="button" aria-label="Delete try-on" onClick={() => removeTryOn.run(item.id)} className="absolute top-1.5 right-1.5 hidden h-6 w-6 place-items-center rounded-full bg-ink/80 text-paper group-hover:grid">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removePhoto.run(toDelete)}
        loading={removePhoto.running}
        title="Delete this photo?"
        description="The photo and every try-on made with it are deleted for good."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
