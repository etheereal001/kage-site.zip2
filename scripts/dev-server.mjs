/* Yerel geliştirme sunucusu — bağımlılık gerektirmez (Node 22+).
   public/ klasörünü yayınlar, /api isteklerini functions/api/[[path]].js'e yönlendirir
   ve veriyi .data/kage.db (SQLite) dosyasında tutar.
     npm run dev   →  http://localhost:8788   (yönetici parolası: kage-dev) */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createD1 } from './d1-sqlite.mjs';
import { onRequest } from '../functions/api/[[path]].js';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const PORT = Number(process.env.PORT || 8788);
const env = {
  DB: createD1(fileURLToPath(new URL('../.data/kage.db', import.meta.url))),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'kage-dev',
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'yerel-gelistirme-anahtari-degistir'
};
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api')){
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = ['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
      const r = await onRequest({ request: new Request(url, { method: req.method, headers: req.headers, body }), env });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (p.endsWith('/') || p === '') p = join(p, 'index.html');
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(e.code === 'ENOENT' ? 'Bulunamadı' : 'Hata');
  }
}).listen(PORT, () => console.log(`KAGE yerelde çalışıyor → http://localhost:${PORT}  (yönetici parolası: ${process.env.ADMIN_PASSWORD ? '(ortam değişkeninden)' : 'kage-dev'})`));
