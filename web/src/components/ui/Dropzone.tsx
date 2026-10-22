import { ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/format';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Click or drop a photo. Checks type and size in the browser for a quick message; the server
 * checks again by reading the file's real content.
 */
export function Dropzone({
  onFile,
  disabled,
  label = 'Drop a photo here or click to choose',
  hint = 'JPEG, PNG or WebP, up to 8 MB',
  className,
  children,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError('Please choose a JPEG, PNG or WebP image.');
    if (file.size > MAX_BYTES) return setError('That photo is larger than 8 MB.');
    setError(null);
    onFile(file);
  };

  return (
    <div className={className}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files[0]);
        }}
        animate={{ scale: dragging ? 1.015 : 1 }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed px-6 py-10 text-center transition-colors disabled:opacity-50',
          dragging ? 'border-olive bg-olive/5' : 'border-stone/60 bg-card hover:border-ink',
        )}
      >
        {children ?? (
          <>
            <ImagePlus size={26} strokeWidth={1.4} className="text-muted" />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted">{hint}</span>
          </>
        )}
      </motion.button>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {error && <p className="mt-2 text-xs text-henna">{error}</p>}
    </div>
  );
}
