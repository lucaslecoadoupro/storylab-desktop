// Construit l'interface du studio (React → un seul fichier app.js + app.css).
// Le téléphone Déclic, lui, est déjà construit dans phone/ (voir scripts/phone.mjs).
import { build, context } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath gère les chemins Windows (D:\...) que .pathname casse en « /D:/... »
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);
const watch = process.argv.includes('--watch');
const pkg = JSON.parse(fs.readFileSync(r('package.json'), 'utf8'));

const opts = {
  entryPoints: [r('src/renderer/app/index.jsx')],
  bundle: true,
  outfile: r('src/renderer/dist/app.js'),
  format: 'iife',
  target: ['chrome110'],
  jsx: 'automatic',
  loader: { '.woff2': 'dataurl', '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"', __APP_VERSION__: JSON.stringify(pkg.version) },
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log('Surveillance des fichiers…');
} else {
  await build(opts);
}
