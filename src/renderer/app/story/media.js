/**
 * Images et sons ajoutés par l'enseignant : compression, enregistrement au micro.
 * Les fichiers restent légers (consigne du cahier des charges : médias courts et
 * optimisés, pour le Wi-Fi des établissements).
 */
import { media } from '../platform.js';
import { blobToDataURL, readFileAsDataURL } from '../utils.js';

export const IMAGE_MAX_SIDE = 1080;
export const AUDIO_MAX_BYTES = 1.5 * 1024 * 1024;
export const RECORD_MAX_SECONDS = 90;

function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Cette image est illisible.')); im.src = src; });
}

/** Image choisie → WebP d'au plus 1080 px de côté → référence « media/… ». */
export async function importImage(file) {
  if (!/^image\//.test(file.type) && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) throw new Error('Choisissez une image (JPG, PNG, WebP).');
  const url = URL.createObjectURL(file);
  try {
    const im = await loadImage(url);
    const k = Math.min(1, IMAGE_MAX_SIDE / Math.max(im.naturalWidth, im.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(im.naturalWidth * k);
    cv.height = Math.round(im.naturalHeight * k);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    let dataUrl = cv.toDataURL('image/webp', 0.82);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = cv.toDataURL('image/jpeg', 0.85);
    return { src: await media.put(dataUrl), width: cv.width, height: cv.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Durée d'un son, en secondes (arrondie). */
export function audioDuration(src) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) { resolve(Math.max(1, Math.round(a.duration))); return; }
      // Enregistrements WebM : la durée n'est connue qu'après un saut à la fin.
      a.currentTime = 1e7;
      a.ontimeupdate = () => { a.ontimeupdate = null; resolve(Number.isFinite(a.duration) ? Math.max(1, Math.round(a.duration)) : undefined); };
    };
    a.onerror = () => resolve(undefined);
    a.src = src;
  });
}

/** Son importé (MP3, M4A, WAV, OGG, WebM) d'au plus 1,5 Mo. */
export async function importAudio(file) {
  if (!/^audio\//.test(file.type) && !/\.(mp3|m4a|wav|ogg|webm|aac)$/i.test(file.name)) throw new Error('Choisissez un fichier son (MP3, M4A, WAV…).');
  if (file.size > AUDIO_MAX_BYTES) throw new Error('Ce son est trop lourd (1,5 Mo maximum, soit environ 1 min 30). Raccourcissez-le ou enregistrez-le directement ici.');
  const dataUrl = await readFileAsDataURL(file);
  const duration = await audioDuration(dataUrl);
  return { src: await media.put(dataUrl), duration };
}

/** Enregistrement au micro. start() → stop() renvoie { src, duration }. */
export async function startRecording(onTick) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Le micro n’est pas disponible sur cet ordinateur.');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error('Accès au micro refusé. Autorisez StoryLab à utiliser le micro dans les réglages de votre ordinateur.');
  }
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const t0 = Date.now();
  let timer = null;
  const done = new Promise((resolve) => { rec.onstop = resolve; });
  const stop = async () => {
    if (rec.state !== 'inactive') rec.stop();
    clearInterval(timer);
    await done;
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] });
    const seconds = Math.max(1, Math.round((Date.now() - t0) / 1000));
    const dataUrl = (await blobToDataURL(blob)).replace(/^data:([^;,]+);[^,]*?base64,/, 'data:$1;base64,');
    return { src: await media.put(dataUrl), duration: seconds };
  };
  timer = setInterval(() => {
    const s = Math.round((Date.now() - t0) / 1000);
    // Durée maximale atteinte : l'interface arrête l'enregistrement (et récupère le son).
    onTick?.(s, s >= RECORD_MAX_SECONDS);
  }, 250);
  rec.start(250);
  return { stop, cancel: () => { clearInterval(timer); if (rec.state !== 'inactive') rec.stop(); stream.getTracks().forEach((t) => t.stop()); } };
}

export const fmtSeconds = (s) => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`;
