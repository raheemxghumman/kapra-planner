import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

/** Paths that belong to the server, never to the React app. */
const SERVER_PATHS = ['/api', '/socket.io'];

/**
 * Serves the built React app from the same server (one container, one address). Files with a
 * content hash in their name (Vite's /assets) are cached for a year; every other GET that is
 * not an API call returns index.html, so React Router can handle links such as /app/bookings.
 */
export function serveWebApp(app: NestExpressApplication, webDist: string): void {
  const index = join(webDist, 'index.html');
  if (!webDist || !existsSync(index)) return;

  app.useStaticAssets(webDist, {
    index: false,
    setHeaders: (res, path) => {
      res.setHeader(
        'Cache-Control',
        path.includes(`${join('assets', '')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
      );
    },
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isServerPath = SERVER_PATHS.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    );
    if (req.method !== 'GET' || isServerPath) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
  Logger.log(`Serving the website from ${webDist}`, 'WebHosting');
}

/**
 * Content Security Policy for the website: our own scripts only; images from any HTTPS host
 * (brand shop CDNs, Cloudinary, map tiles); Google Fonts; inline styles (animations set them).
 */
export const CONTENT_SECURITY_POLICY = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: ["'self'", 'https:', 'wss:'],
    workerSrc: ["'self'", 'blob:'],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'", 'https://checkout.stripe.com'],
  },
};
