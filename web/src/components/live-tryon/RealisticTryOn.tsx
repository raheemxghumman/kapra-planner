import { Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getTryOn, startTryOn, uploadPhoto } from '../../api/customer.api';
import type { Product } from '../../types/catalogue';
import { getErrorMessage } from '../../utils/errors';
import { CompareSlider } from '../ui/CompareSlider';

const COUNTDOWN_SECONDS = 3;
const POLL_MS = 3_000;
const GIVE_UP_MS = 4 * 60_000;

type Step =
  | { name: 'countdown'; seconds: number }
  | { name: 'working'; message: string }
  | { name: 'done'; before: string; after: string }
  | { name: 'error'; message: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * "Make it realistic": after a short countdown (so the user can pose), takes a photo from the
 * camera and runs the AI photo try-on on it (FASHN VTON first; see the API's provider chain).
 * The live view shows the fit instantly; this gives a photo-realistic picture of the same moment.
 */
export function RealisticTryOn({
  product,
  capture,
  onClose,
}: {
  product: Product;
  /** Takes the photo (camera picture only, without the AR garment). */
  capture: () => Promise<Blob | null>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>({ name: 'countdown', seconds: COUNTDOWN_SECONDS });

  useEffect(() => {
    let cancelled = false;
    let before = '';

    (async () => {
      for (let seconds = COUNTDOWN_SECONDS; seconds > 0; seconds--) {
        if (cancelled) return;
        setStep({ name: 'countdown', seconds });
        await sleep(1_000);
      }
      if (cancelled) return;
      const photo = await capture();
      if (!photo) throw new Error('No camera picture to use. Stand in the frame and try again.');
      before = URL.createObjectURL(photo);

      setStep({ name: 'working', message: 'Uploading your photo…' });
      const uploaded = await uploadPhoto(
        new File([photo], 'live-try-on.jpg', { type: 'image/jpeg' }),
      );
      let tryOn = await startTryOn(uploaded.id, product.id);

      const startedAt = Date.now();
      while (!cancelled && (tryOn.status === 'pending' || tryOn.status === 'processing')) {
        setStep({ name: 'working', message: 'Dressing you with AI… this takes about 30 seconds' });
        if (Date.now() - startedAt > GIVE_UP_MS)
          throw new Error('The try-on is taking too long. Please try again.');
        await sleep(POLL_MS);
        tryOn = await getTryOn(tryOn.id);
      }
      if (cancelled) return;
      if (tryOn.status !== 'completed' || !tryOn.resultUrl)
        throw new Error(tryOn.error ?? 'The try-on failed.');
      setStep({ name: 'done', before, after: tryOn.resultUrl });
    })().catch(
      (error: unknown) => !cancelled && setStep({ name: 'error', message: getErrorMessage(error) }),
    );

    return () => {
      cancelled = true;
      if (before) URL.revokeObjectURL(before);
    };
  }, [capture, product.id]);

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-ink/85 p-4 text-paper backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-paper/15 hover:bg-paper/25"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      {step.name === 'countdown' && (
        <div className="text-center" role="status">
          <p className="font-logo text-8xl italic">{step.seconds}</p>
          <p className="mt-3 text-sm text-paper/80">Strike a pose: taking your photo</p>
        </div>
      )}

      {step.name === 'working' && (
        <div className="max-w-xs space-y-4 text-center" role="status">
          <Sparkles className="mx-auto animate-pulse text-blush" size={36} />
          <p>{step.message}</p>
        </div>
      )}

      {step.name === 'error' && (
        <div className="max-w-sm space-y-4 text-center" role="alert">
          <p>{step.message}</p>
          {/photos/i.test(step.message) && (
            <Link
              to="/app/try-on"
              className="inline-block rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink"
            >
              Manage my photos
            </Link>
          )}
        </div>
      )}

      {step.name === 'done' && (
        <div className="w-full max-w-[min(28rem,42vh)] space-y-3 text-center">
          <CompareSlider
            before={step.before}
            after={step.after}
            className="aspect-[3/4] w-full overflow-hidden rounded-2xl"
          />
          <p className="text-sm text-paper/80">Drag to compare. It is saved in your try-ons.</p>
          <div className="flex justify-center gap-2">
            <a
              href={step.after}
              download
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Open full size
            </a>
            <Link
              to="/app/try-on"
              className="rounded-full border border-paper/40 px-5 py-2.5 text-sm font-semibold"
            >
              My try-ons
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
