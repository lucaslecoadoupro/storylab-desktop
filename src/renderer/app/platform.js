// ── Couche plateforme ───────────────────────────────────────────────────────
// En version Desktop (Electron), tout passe par window.declicStudio (preload) :
// données dans un fichier JSON, images et sons en fichiers dans le dossier de
// l'application, servis au téléphone par le protocole app://.
// En version navigateur (npm run serve), repli sur localStorage + IndexedDB.

const api = typeof window !== 'undefined' ? window.declicStudio : null;
export const isDesktop = !!api;
export const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent);

const LS_KEY = 'declic-studio:data-v1';

export async function loadData() {
  if (api) return api.loadData();
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export async function saveData(data) {
  if (api) return api.saveData(data);
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
}

export async function appInfo() {
  if (api) return api.getInfo();
  return { version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0', platform: 'web' };
}

export function openDataFolder() { api?.openDataFolder(); }

// ── Médias (images, sons) ───────────────────────────────────────────────────
// Un média est rangé sous un nom tiré de son contenu (« a1b2c3d4.webp ») et
// référencé dans le scénario par « media/a1b2c3d4.webp », comme dans un
// scénario publié. À l'envoi, il est réintégré dans le fichier .declic.

export const MIME = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', webm: 'audio/webm', ogg: 'audio/ogg', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' };
export const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav' };
export const mimeOf = (name) => MIME[String(name).split('.').pop()] || 'application/octet-stream';
export const isMediaRef = (src) => typeof src === 'string' && /^media\/[\w.-]+$/.test(src);
export const mediaName = (src) => src.slice('media/'.length);

function hash(text) {
  let h1 = 2166136261; let h2 = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2, 33) ^ c;
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

let idbPromise = null;
function idb() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((res, rej) => {
    try {
      const req = indexedDB.open('declic-studio-media', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('media');
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    } catch (e) { rej(e); }
  });
  return idbPromise;
}
const mem = new Map();
const urlCache = new Map();

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?)[;,]/)?.[1] || 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export const media = {
  /** Range un média (adresse data:) et renvoie sa référence « media/<nom> ». */
  async put(dataUrl) {
    const mime = dataUrl.match(/^data:([^;,]+)/)?.[1] || '';
    const ext = EXT[mime] || mime.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin';
    const name = `${hash(dataUrl)}.${ext}`;
    if (api) {
      const r = await api.mediaPut(name, dataUrl);
      if (r?.ok === false) throw new Error('Impossible d’enregistrer le fichier sur l’ordinateur.');
    } else {
      try {
        const db = await idb();
        await new Promise((res, rej) => { const tx = db.transaction('media', 'readwrite'); tx.objectStore('media').put(dataUrl, name); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      } catch { mem.set(name, dataUrl); }
    }
    return `media/${name}`;
  },
  async getDataUrl(src) {
    if (!isMediaRef(src)) return src?.startsWith('data:') ? src : null;
    const name = mediaName(src);
    if (api) return api.mediaGet(name, mimeOf(name));
    try {
      const db = await idb();
      const v = await new Promise((res, rej) => { const r = db.transaction('media').objectStore('media').get(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      if (v) return v;
    } catch { /* repli mémoire */ }
    return mem.get(name) || null;
  },
  /** Adresse affichable dans <img>/<audio>. */
  async url(src) {
    if (!src) return null;
    if (/^(data|blob|https?):/.test(src) || src.startsWith('/')) return src;
    if (!isMediaRef(src)) return null;
    if (api) return `/scenarios/studio/${src}`;
    if (urlCache.has(src)) return urlCache.get(src);
    const d = await this.getDataUrl(src);
    if (!d) return null;
    const u = URL.createObjectURL(dataUrlToBlob(d));
    urlCache.set(src, u);
    return u;
  },
  /** Le téléphone de test lit-il les médias directement (version de bureau) ? */
  servedToPhone: isDesktop,
};

// ── Fichiers .declic ────────────────────────────────────────────────────────
export async function saveDeclicFile(defaultName, content) {
  if (api) return api.saveFile({ defaultName, content });
  const { downloadText } = await import('./utils.js');
  downloadText(`${defaultName}.declic`, content);
  return { ok: true, name: `${defaultName}.declic` };
}

export function openDeclicFile() {
  if (api) return api.openFile();
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.declic,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? { name: f.name, text: await f.text() } : null);
    };
    input.click();
  });
}

export function revealFile(p) { api?.revealFile(p); }
export function openMail(url) { if (api) api.openMail(url); else window.open(url); }
export const onMenu = (cb) => api?.onMenu(cb) || (() => {});
export const onFileOpened = (cb) => api?.onFileOpened(cb) || (() => {});
export const pendingFile = () => api?.pendingFile() || Promise.resolve(null);
