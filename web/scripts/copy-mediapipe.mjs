// Copies MediaPipe's WebAssembly runtime into public/mediapipe so the site serves it itself
// (see src/components/live-tryon/pose-tracker.ts). Runs before `dev` and `build`.
import { cpSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve('@mediapipe/tasks-vision'));
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'mediapipe');

mkdirSync(target, { recursive: true });
cpSync(join(packageDir, 'wasm'), target, { recursive: true });
console.log(`MediaPipe runtime copied to ${target}`);
