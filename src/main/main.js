// StoryLab — processus principal Electron
//
// Tout est servi par un schéma privé app://declic/ :
//   app://declic/studio/…                  interface du studio (src/renderer)
//   app://declic/scenarios/<id>/media/<f>  images et sons des histoires (dossier de données)
//   app://declic/…                         le vrai téléphone Déclic (phone/), pour tester
// Studio et téléphone partagent ainsi la même origine : le studio dépose le
// brouillon dans le stockage local, le téléphone le lit et se met à jour en direct.
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Menu, nativeTheme, session } = require('electron');
const fs = require('fs');
const path = require('path');

const isMac = process.platform === 'darwin';
const isDev = process.argv.includes('--dev');
const ORIGIN = 'app://declic';

// Par sécurité : le nom de l'appli se retrouve dans l'identifiant du navigateur
// (User-Agent), et les en-têtes HTTP n'acceptent que l'ASCII (un accent bloquerait tout).
app.userAgentFallback = app.userAgentFallback.replace(/[^\x20-\x7e]/g, '');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
]);

// ── Emplacements ────────────────────────────────────────────────────────────
const rendererDir = path.join(__dirname, '../renderer');
const phoneDir = path.join(__dirname, '../../phone');
const dataDir = () => path.join(app.getPath('userData'), 'data');
const dataFile = () => path.join(dataDir(), 'declic-studio.json');
const mediaDir = () => path.join(dataDir(), 'media');
const safeName = (n) => String(n).replace(/[^a-zA-Z0-9_.-]/g, '').replace(/^\.+/, '');

function ensureDirs() { fs.mkdirSync(mediaDir(), { recursive: true }); }

// Écriture atomique : fichier temporaire puis renommage (+ une copie de secours)
function writeAtomic(file, content) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, content);
  if (fs.existsSync(file)) {
    try { fs.copyFileSync(file, `${file}.bak`); } catch (_) { /* sans gravité */ }
  }
  fs.renameSync(tmp, file);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.mp4': 'video/mp4', '.ico': 'image/x-icon',
};

/** Fichier servi par app:// (avec prise en charge des plages, pour l'avance rapide des sons). */
function serveFile(file, req) {
  const buf = fs.readFileSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, buf.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), buf.length - 1) : buf.length - 1;
    return new Response(buf.subarray(start, end + 1), { status: 206, headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1) } });
  }
  return new Response(buf, { headers: { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' } });
}

const inside = (dir, file) => { const rel = path.relative(dir, file); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); };
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch (_) { return false; } };

function resolveAppUrl(url) {
  const p = decodeURIComponent(new URL(url).pathname);
  if (p === '/studio' || p === '/studio/') return path.join(rendererDir, 'index.html');
  if (p.startsWith('/studio/')) {
    const f = path.join(rendererDir, p.slice(8));
    return inside(rendererDir, f) ? f : null;
  }
  const media = p.match(/^\/scenarios\/[^/]+\/media\/([^/]+)$/);
  if (media) return path.join(mediaDir(), safeName(media[1]));
  const f = path.join(phoneDir, p);
  if (inside(phoneDir, f) && isFile(f)) return f;
  return path.join(phoneDir, 'index.html'); // liens profonds du téléphone (/s/<id>)
}

// ── Fenêtre ─────────────────────────────────────────────────────────────────
let win;
let pendingOpen = null; // fichier .declic ouvert par double-clic avant que l'interface soit prête

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 720,
    title: 'StoryLab',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0d1117' : '#f0f2f6',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL(`${ORIGIN}/studio/index.html`);
  if (isDev) win.webContents.openDevTools({ mode: 'detach' });

  // Les liens externes (aide, mail) s'ouvrent dans le navigateur ou la messagerie
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto):/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) { e.preventDefault(); if (/^(https?|mailto):/.test(url)) shell.openExternal(url); }
  });
  // Le téléphone (dans un cadre) ne doit jamais quitter l'application.
  win.webContents.on('will-frame-navigate', (e) => {
    if (!e.url.startsWith(ORIGIN) && !e.url.startsWith('about:')) e.preventDefault();
  });
}

function send(channel, payload) { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); }

function buildMenu() {
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [{ role: 'about', label: 'À propos de StoryLab' }, { type: 'separator' }, { role: 'hide', label: 'Masquer StoryLab' }, { role: 'hideOthers', label: 'Masquer les autres' }, { role: 'unhide', label: 'Tout afficher' }, { type: 'separator' }, { role: 'quit', label: 'Quitter StoryLab' }] }] : []),
    { label: 'Fichier', submenu: [
      { label: 'Nouvelle histoire…', accelerator: 'CmdOrCtrl+N', click: () => send('menu', 'new') },
      { label: 'Ouvrir un fichier .declic…', accelerator: 'CmdOrCtrl+O', click: () => send('menu', 'open') },
      { type: 'separator' },
      { label: 'Ouvrir le dossier des données', click: () => { ensureDirs(); shell.openPath(dataDir()); } },
      { type: 'separator' },
      isMac ? { role: 'close', label: 'Fermer la fenêtre' } : { role: 'quit', label: 'Quitter' },
    ] },
    { label: 'Édition', submenu: [
      { role: 'undo', label: 'Annuler' }, { role: 'redo', label: 'Rétablir' }, { type: 'separator' },
      { role: 'cut', label: 'Couper' }, { role: 'copy', label: 'Copier' }, { role: 'paste', label: 'Coller' }, { role: 'selectAll', label: 'Tout sélectionner' },
    ] },
    { label: 'Affichage', submenu: [
      { role: 'resetZoom', label: 'Taille réelle' }, { role: 'zoomIn', label: 'Agrandir' }, { role: 'zoomOut', label: 'Réduire' },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Plein écran' },
      ...(isDev ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : []),
    ] },
    { label: 'Aide', submenu: [
      { label: 'Revoir la visite guidée', click: () => send('menu', 'tour') },
      { label: 'Guide de l’auteur', click: () => send('menu', 'guide') },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC : données ───────────────────────────────────────────────────────────
ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform }));

ipcMain.handle('data:load', () => {
  ensureDirs();
  for (const f of [dataFile(), `${dataFile()}.bak`]) {
    try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { /* fichier abîmé : on tente la copie de secours */ }
  }
  return null;
});

ipcMain.handle('data:save', (_e, data) => {
  try { ensureDirs(); writeAtomic(dataFile(), JSON.stringify(data)); return { ok: true }; } catch (err) { return { ok: false, error: String(err) }; }
});

ipcMain.handle('data:open-folder', () => { ensureDirs(); shell.openPath(dataDir()); });

// ── IPC : images et sons des histoires ──────────────────────────────────────
ipcMain.handle('media:put', (_e, name, dataUrl) => {
  try {
    ensureDirs();
    const b64 = String(dataUrl).split(',')[1] || '';
    fs.writeFileSync(path.join(mediaDir(), safeName(name)), Buffer.from(b64, 'base64'));
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
});

ipcMain.handle('media:get', (_e, name, mime) => {
  try { return `data:${mime};base64,${fs.readFileSync(path.join(mediaDir(), safeName(name))).toString('base64')}`; } catch (_) { return null; }
});

ipcMain.handle('media:has', (_e, name) => isFile(path.join(mediaDir(), safeName(name))));

// ── IPC : fichiers .declic ──────────────────────────────────────────────────
ipcMain.handle('file:save', async (e, { defaultName, content }) => {
  const safe = String(defaultName || 'histoire').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120);
  const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender), {
    title: 'Enregistrer l’histoire',
    defaultPath: path.join(app.getPath('documents'), `${safe}.declic`),
    filters: [{ name: 'Histoire Déclic', extensions: ['declic'] }],
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(filePath, content);
    return { ok: true, path: filePath, name: path.basename(filePath) };
  } catch (err) { return { ok: false, error: String(err) }; }
});

ipcMain.handle('file:open', async (e) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), {
    title: 'Ouvrir une histoire',
    properties: ['openFile'],
    filters: [{ name: 'Histoire Déclic', extensions: ['declic', 'json'] }],
  });
  if (canceled || !filePaths[0]) return null;
  try { return { name: path.basename(filePaths[0]), text: fs.readFileSync(filePaths[0], 'utf8') }; } catch (err) { return { error: String(err) }; }
});

ipcMain.handle('file:reveal', (_e, p) => { if (p) shell.showItemInFolder(p); });
ipcMain.handle('file:pending', () => { const p = pendingOpen; pendingOpen = null; return p; });
ipcMain.handle('shell:mail', (_e, url) => { if (/^mailto:/.test(url)) shell.openExternal(url); });

function openDeclicFile(file) {
  if (!file || !/\.declic$/i.test(file)) return;
  try {
    const payload = { name: path.basename(file), text: fs.readFileSync(file, 'utf8') };
    if (win && !win.webContents.isLoading()) send('file:opened', payload); else pendingOpen = payload;
  } catch (_) { /* fichier illisible : on ignore */ }
}

// ── Démarrage ───────────────────────────────────────────────────────────────
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
app.on('second-instance', (_e, argv) => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  openDeclicFile(argv.find((a) => /\.declic$/i.test(a)));
});
app.on('open-file', (e, file) => { e.preventDefault(); openDeclicFile(file); }); // macOS

app.whenReady().then(() => {
  ensureDirs();
  protocol.handle('app', (req) => {
    const file = resolveAppUrl(req.url);
    if (!file || !isFile(file)) return new Response('Introuvable', { status: 404 });
    try { return serveFile(file, req); } catch (_) { return new Response('Illisible', { status: 500 }); }
  });
  // Micro : uniquement pour enregistrer un son, et seulement depuis l'application.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    cb(permission === 'media' && String(details?.requestingUrl || '').startsWith(ORIGIN) && !(details?.mediaTypes || []).includes('video'));
  });
  buildMenu();
  createWindow();
  openDeclicFile(process.argv.find((a) => /\.declic$/i.test(a)));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (!isMac) app.quit(); });
