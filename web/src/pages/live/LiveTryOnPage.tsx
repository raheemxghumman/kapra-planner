import { Camera, Minus, Plus, ScanFace, Sparkles, SwitchCamera, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { getProduct, searchProducts } from '../../api/catalogue.api';
import {
  checkFraming,
  FRAMING_HINTS,
  POSE,
  smoothLandmarks,
  type BodyPoints,
  type Framing,
  type Landmark,
} from '../../components/live-tryon/fit';
import { RealisticTryOn } from '../../components/live-tryon/RealisticTryOn';
import { LiveRenderer } from '../../components/live-tryon/renderer';
import { useCamera } from '../../components/live-tryon/useCamera';
import { findModelBody, loadVision, type Vision } from '../../components/live-tryon/vision';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import type { GarmentFit } from '../../types/catalogue';
import { cn, formatPrice, imageUrl } from '../../utils/format';

/** How long the user must stand well-framed before the garment appears, and how long tracking may drop out. */
const LOCK_AFTER_MS = 700;
const UNLOCK_AFTER_MS = 1500;
const SIZE_STEP = 0.05;

/**
 * Live (AR) try-on. The camera picture is drawn on a canvas every frame; MediaPipe Pose finds
 * the body, and the product's transparent cut-out is drawn on top with a transform that pins
 * its collar to the base of the user's neck (see LiveRenderer). Everything runs on the device.
 * "Make it realistic" turns the same moment into a photo-realistic AI try-on.
 */
export function LiveTryOnPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const product = useApi((signal) => getProduct(id, signal), [id]);
  const live = product.data?.liveTryOn ?? null;

  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camera = useCamera(videoRef, facing);

  const [vision, setVision] = useState<Vision | null>(null);
  const [trackerFailed, setTrackerFailed] = useState(false);
  const [realistic, setRealistic] = useState(false);
  const [framing, setFraming] = useState<Framing>('no-person');
  const [locked, setLocked] = useState(false);
  const [size, setSize] = useState(1);

  // The drawing loop runs 30-60 times a second, so it reads these refs instead of React state.
  const garmentRef = useRef<HTMLImageElement | null>(null);
  const fitRef = useRef<GarmentFit | null>(null);
  const modelBodyRef = useRef<BodyPoints | null>(null);
  const sizeRef = useRef(1);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const mirroredRef = useRef(true);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Other pieces of the same kind that can be tried on live.
  const pieces = useApi(
    (signal) =>
      product.data
        ? searchProducts({ liveTryOn: true, category: [product.data.category], limit: 12 }, signal)
        : Promise.resolve(null),
    [product.data?.category],
  );

  // Load the body-tracking models once.
  useEffect(() => {
    let active = true;
    let loaded: Vision | null = null;
    loadVision()
      .then((models) => {
        loaded = models;
        if (active) setVision(models);
        else models.close();
      })
      .catch(() => active && setTrackerFailed(true));
    return () => {
      active = false;
      loaded?.close();
    };
  }, []);

  // Load the garment cut-out (crossOrigin lets "Save photo" export the canvas).
  useEffect(() => {
    fitRef.current = live?.fit ?? null;
    if (!live) return void (garmentRef.current = null);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = live.cutoutUrl;
    garmentRef.current = image;

    // For a photo of a model, find the model's joints so the garment is pinned joint to joint.
    modelBodyRef.current = null;
    let current = true;
    if (live.modelPhotoUrl) {
      findModelBody(live.modelPhotoUrl, live.fit)
        .then((body) => current && (modelBodyRef.current = body))
        .catch(() => undefined); // keeps the collar rule
    }
    return () => {
      current = false;
    };
  }, [live]);

  // The camera + tracking + drawing loop.
  useEffect(() => {
    if (camera.status !== 'ready' || !vision) return;
    const renderer = new LiveRenderer(vision.segmenter);
    let frame = 0;
    let lastVideoTime = -1;
    let landmarks: Landmark[] | null = null;
    let readySince: number | null = null;
    let lostSince: number | null = null;
    let isLocked = false;
    let lastFraming: Framing | null = null;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (
        !video ||
        !canvas ||
        !context ||
        video.readyState < 2 ||
        video.currentTime === lastVideoTime
      )
        return;
      lastVideoTime = video.currentTime;

      const { videoWidth: width, videoHeight: height } = video;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const found = vision.pose.detectForVideo(video, performance.now()).landmarks[0];
      landmarks = found ? smoothLandmarks(landmarks, found) : null;
      landmarksRef.current = landmarks;
      const fit = fitRef.current;
      const next = checkFraming(landmarks ?? undefined, fit?.anchor ?? 'shoulders', width / height);

      // Lock on after a moment of good framing; let go only after tracking is lost for a while,
      // so a quick turn or a hand in front does not make the garment flicker.
      const now = performance.now();
      readySince = next === 'ready' ? (readySince ?? now) : null;
      lostSince = next === 'no-person' ? (lostSince ?? now) : null;
      if (!isLocked && readySince !== null && now - readySince > LOCK_AFTER_MS) isLocked = true;
      if (isLocked && lostSince !== null && now - lostSince > UNLOCK_AFTER_MS) isLocked = false;
      if (next !== lastFraming) setFraming((lastFraming = next));
      setLocked(isLocked);

      const garment = garmentRef.current;
      const showGarment =
        isLocked &&
        landmarks &&
        fit &&
        garment?.complete &&
        garment.naturalWidth > 0 &&
        next !== 'no-person';
      renderer.draw(
        context,
        video,
        showGarment
          ? {
              garment,
              fit,
              landmarks: landmarks!,
              size: sizeRef.current,
              modelBody: modelBodyRef.current,
              mirrored: mirroredRef.current,
            }
          : null,
      );
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [camera.status, vision]);

  const mirrored = facing === 'user';
  useEffect(() => {
    mirroredRef.current = mirrored;
  }, [mirrored]);

  /** Saves what the user sees (mirrored like a mirror for the front camera) as a JPEG. */
  const savePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return;
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    if (mirrored) {
      context.translate(copy.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(canvas, 0, 0);
    try {
      copy.toBlob(
        (blob) => {
          if (!blob) return;
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `kapra-live-try-on.jpg`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
        },
        'image/jpeg',
        0.92,
      );
    } catch {
      toast({ title: 'This photo could not be saved', tone: 'error' });
    }
  };

  /**
   * The photo for "Make it realistic": the camera picture alone (no AR garment), cropped to a
   * portrait around the person, which suits the AI try-on model best.
   */
  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const landmarks = landmarksRef.current;
    if (!video || !video.videoWidth || !landmarks) return null;
    const { videoWidth: width, videoHeight: height } = video;
    const centre = ((landmarks[POSE.leftShoulder].x + landmarks[POSE.rightShoulder].x) / 2) * width;
    const cropWidth = Math.min(width, Math.round(height * 0.75));
    const left = Math.round(Math.min(Math.max(0, centre - cropWidth / 2), width - cropWidth));
    const photo = document.createElement('canvas');
    photo.width = cropWidth;
    photo.height = height;
    photo.getContext('2d')!.drawImage(video, left, 0, cropWidth, height, 0, 0, cropWidth, height);
    return new Promise((resolve) => photo.toBlob(resolve, 'image/jpeg', 0.92));
  }, []);

  /** The AI try-on saves to the customer's account, so it needs a customer login. */
  const makeRealistic = () => {
    if (!user) return navigate('/login', { state: { from: `/live/${id}` } });
    if (user.role !== 'customer')
      return toast({ title: 'Switch to a customer account for this', tone: 'info' });
    setRealistic(true);
  };

  const status =
    camera.status === 'error'
      ? camera.message
      : trackerFailed
        ? 'Body tracking could not be loaded on this device.'
        : camera.status === 'starting'
          ? 'Starting the camera…'
          : !vision
            ? 'Loading body tracking…'
            : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper">
      {/* The video only feeds the canvas; it stays in the page because some browsers pause hidden videos. */}
      <video
        ref={videoRef}
        className="pointer-events-none absolute h-px w-px opacity-0"
        playsInline
        muted
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={cn('h-full w-full object-cover', mirrored && '-scale-x-100')}
          aria-label="Camera view with the garment on you"
        />

        {!locked && !status && <FrameGuide ready={framing === 'ready'} />}

        {realistic && product.data && (
          <RealisticTryOn
            product={product.data}
            capture={capturePhoto}
            onClose={() => setRealistic(false)}
          />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-ink/70 to-transparent p-4">
          <Link
            to={`/shop/${id}`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-paper/15 backdrop-blur hover:bg-paper/25"
            aria-label="Close live try-on"
          >
            <X size={18} />
          </Link>
          {product.data && (
            <div className="min-w-0 text-center">
              <p className="eyebrow text-paper/70">{product.data.brand.name} · Live try-on</p>
              <p className="truncate font-logo text-lg italic">{product.data.title}</p>
              <p className="text-xs text-paper/70">{formatPrice(product.data.price)}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setFacing(mirrored ? 'environment' : 'user')}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-paper/15 backdrop-blur hover:bg-paper/25"
            aria-label="Switch camera"
          >
            <SwitchCamera size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!status && (
            <motion.p
              key={locked ? 'locked' : framing}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'absolute top-24 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-center text-sm font-semibold whitespace-nowrap backdrop-blur',
                locked || framing === 'ready' ? 'bg-olive/90' : 'bg-ink/70',
              )}
              role="status"
            >
              {locked ? 'Move around to see it on you' : FRAMING_HINTS[framing]}
            </motion.p>
          )}
        </AnimatePresence>

        {(status || (product.data && !live) || product.error) && (
          <div className="absolute inset-0 grid place-items-center bg-ink/80 p-6 text-center">
            <div className="max-w-sm space-y-4">
              <ScanFace className="mx-auto text-blush" size={36} />
              <p className="text-lg">
                {product.error
                  ? product.error
                  : product.data && !live
                    ? 'This piece cannot be tried on live yet.'
                    : status}
              </p>
              {product.data && !live && (
                <Link
                  to={`/app/try-on?product=${id}`}
                  className="inline-block rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink"
                >
                  Try it on a photo instead
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-paper/10 bg-ink p-4">
        <div className="flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-1 rounded-full bg-paper/10 p-1"
            aria-label="Garment size"
          >
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full hover:bg-paper/15"
              onClick={() => setSize((value) => Math.max(0.75, value - SIZE_STEP))}
              aria-label="Smaller"
            >
              <Minus size={16} />
            </button>
            <span className="w-14 text-center text-xs">Fit {Math.round(size * 100)}%</span>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full hover:bg-paper/15"
              onClick={() => setSize((value) => Math.min(1.3, value + SIZE_STEP))}
              aria-label="Bigger"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={savePhoto}
            disabled={!locked}
            className="grid size-16 place-items-center rounded-full border-4 border-paper/40 bg-paper text-ink transition-transform active:scale-95 disabled:opacity-40"
            aria-label="Save a photo"
          >
            <Camera size={22} />
          </button>
          <button
            type="button"
            onClick={makeRealistic}
            disabled={!locked}
            className="flex items-center gap-1.5 rounded-full bg-blush px-4 py-2.5 text-xs font-semibold text-ink transition-opacity disabled:opacity-40"
          >
            <Sparkles size={14} /> Make it realistic
          </button>
        </div>

        {pieces.data && pieces.data.data.length > 1 && (
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
            aria-label="Other pieces to try"
          >
            {pieces.data.data.map((piece) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => navigate(`/live/${piece.id}`, { replace: true })}
                className={cn(
                  'w-16 shrink-0 overflow-hidden rounded-lg border-2',
                  piece.id === id
                    ? 'border-blush'
                    : 'border-transparent opacity-70 hover:opacity-100',
                )}
                aria-label={`Try ${piece.title}`}
                aria-current={piece.id === id}
              >
                <img
                  src={imageUrl(piece.images.at(-1), 160)}
                  alt=""
                  className="aspect-[3/4] w-full bg-sand object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Dotted body outline that shows the user where to stand; it turns green once they fit. */
function FrameGuide({ ready }: { ready: boolean }) {
  return (
    <svg
      viewBox="0 0 200 300"
      className="pointer-events-none absolute top-1/2 left-1/2 h-[78%] -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <g
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="7 6"
        strokeLinecap="round"
        className={cn('transition-colors duration-300', ready ? 'stroke-olive' : 'stroke-paper/70')}
      >
        <circle cx="100" cy="42" r="24" />
        <path d="M100 66 v10 M45 92 q55 -22 110 0 M45 92 l-8 95 M155 92 l8 95 M62 100 l4 100 h68 l4 -100 M74 200 l-4 92 M126 200 l4 92" />
      </g>
    </svg>
  );
}
