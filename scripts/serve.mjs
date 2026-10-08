// Version navigateur, pour développer sans Electron : même organisation des
// adresses que le protocole app:// de l'application de bureau.
//   /studio/…   → interface du studio (src/renderer)
//   /…          → téléphone Déclic (phone/), avec repli sur index.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5180);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

function resolve(p) {
  if (p === '/' || p === '/studio' || p === '/studio/') return path.join(root, 'src/renderer/index.html');
  if (p.startsWith('/studio/')) return path.join(root, 'src/renderer', p.slice(8));
  const f = path.join(root, 'phone', p);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(root, 'phone', 'index.html');
}

http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.includes('..')) { res.writeHead(400).end(); return; }
  const file = resolve(p);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('Introuvable'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}).listen(port, () => console.log(`StoryLab (navigateur) : http://localhost:${port}/studio/`));
