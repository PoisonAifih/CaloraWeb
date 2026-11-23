import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Response } from 'express';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-exception.filter';

const ROOT = process.cwd();
const SPA_ROUTES = new Set(['/', '/dashboard', '/catering', '/training', '/nutrition', '/trends', '/profile']);
const ROOT_ASSETS = new Set(['index.html', 'admin.html']);
// Public path prefix when a reverse proxy serves the app under a sub-path, e.g. /calora.
const BASE_PATH = (process.env.CALORA_BASE_PATH || '').replace(/\/+$/, '');

function sendPage(res: Response, name: string) {
  const html = readFileSync(join(ROOT, name), 'utf8').replace('<base href="/">', `<base href="${BASE_PATH}/">`);
  res.type('html').send(html);
}

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
  app.useGlobalFilters(new HttpErrorFilter());
  app.use(cookieParser());
  const expressApp = app.getHttpAdapter().getInstance();
  // Behind Caddy/Tailscale every request arrives from a local proxy; use X-Forwarded-For for req.ip.
  expressApp.set('trust proxy', 'loopback, uniquelocal');
  expressApp.get('/admin', (_req, res) => sendPage(res, 'admin.html'));
  expressApp.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    if (SPA_ROUTES.has(req.path)) return sendPage(res, 'index.html');
    const relative = decodeURIComponent(req.path.replace(/^\/+/, ''));
    if (ROOT_ASSETS.has(relative)) return sendPage(res, relative);
    const allowed = relative.startsWith('css/') || relative.startsWith('js/') || relative.startsWith('assets/');
    const file = join(ROOT, relative);
    if (!allowed || relative.split('/').some(part => part.startsWith('.')) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.sendFile(file);
  });
  return app;
}
