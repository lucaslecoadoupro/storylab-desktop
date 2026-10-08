/**
 * Échanges avec l'extérieur :
 * - fichier .declic envoyé à l'équipe (scénario + médias intégrés + fiche) ;
 * - réouverture d'un fichier .declic dans le studio ;
 * - brouillon déposé pour le téléphone de test.
 */
import { isMediaRef, media } from '../platform.js';
import { clean, pathTo } from './model.js';
import { newStoryRecord } from '../store.jsx';
import { slug } from '../utils.js';
import { APP_VERSION } from '../config.js';
import { THEMES } from './templates.js';

const FORMAT = 'declic-studio';

/** Applique fn à chaque adresse de média du scénario (contenus, écrans de story, sons). */
async function mapMedia(s, fn) {
  const out = JSON.parse(JSON.stringify(s));
  for (const sc of out.scenes) {
    if (sc.content?.src) sc.content.src = await fn(sc.content.src);
    if (sc.frames) for (const f of sc.frames) if (f.src) f.src = await fn(f.src);
    if (sc.audio) sc.audio = await fn(sc.audio);
  }
  return out;
}

/** Médias intégrés (data:) : pour un fichier autonome, ou pour le téléphone de test du navigateur. */
export const inlineMedia = (s) => mapMedia(s, async (src) => (isMediaRef(src) ? (await media.getDataUrl(src)) || undefined : src));

/** Contenu du fichier .declic. */
export async function buildDeclicFile(story, profile) {
  const scenario = await inlineMedia(clean({ ...story.scenario, id: slug(story.scenario.title) }));
  const m = story.meta;
  return JSON.stringify({
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    app: { name: 'StoryLab', version: APP_VERSION },
    author: { prenom: profile.prenom, nom: profile.nom, etablissement: profile.etablissement, discipline: profile.discipline, email: profile.email },
    pedagogy: { niveau: m.niveau, theme: THEMES.find((t) => t.id === m.theme)?.label || m.theme, objectifs: m.objectifs, resume: m.resume, deroule: m.deroule, debrief: m.debrief },
    message: m.message || '',
    studio: { meta: m, step: story.step },
    scenario,
  }, null, 1);
}

export function fileNameFor(story) {
  return `Déclic - ${String(story.scenario.title || 'histoire').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)}`;
}

/** Fichier .declic (ou scénario .json) → nouvelle histoire du studio, médias rangés. */
export async function readDeclicFile(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Ce fichier est abîmé ou n’est pas une histoire Déclic.'); }
  const scenario = data?.format === FORMAT ? data.scenario : data;
  if (!scenario || !Array.isArray(scenario.scenes) || !scenario.scenes.length) throw new Error('Ce fichier ne contient pas d’histoire Déclic.');
  const stored = await mapMedia(scenario, async (src) => (typeof src === 'string' && src.startsWith('data:') ? media.put(src) : src));
  stored.contacts = stored.contacts || {};
  const meta = data?.format === FORMAT ? { ...(data.studio?.meta || {}), message: data.studio?.meta?.message ?? data.message ?? '' } : {};
  const rec = newStoryRecord(stored, meta);
  rec.step = 'scenes';
  return rec;
}

// ── Téléphone de test ───────────────────────────────────────────────────────
// Même origine que le téléphone : le brouillon est lu par le moteur (?draft) et
// chaque modification s'y applique en direct (événement « storage »).

export const previewId = (story) => `studio-${story.uid.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}`;
const DRAFT_KEY = (id) => `storylab-admin:draft:${id}`;
const PROGRESS_KEY = (id) => `storylab:story:${id}`;

export async function pushDraft(story) {
  const id = previewId(story);
  let s = clean({ ...story.scenario, id });
  // Version navigateur : le téléphone ne peut pas lire les médias du studio, on les intègre.
  if (!media.servedToPhone) s = await inlineMedia(s);
  try {
    localStorage.setItem(DRAFT_KEY(id), JSON.stringify(s));
    return { ok: true, id };
  } catch {
    // Trop lourd pour le stockage du navigateur : on teste sans les médias.
    const light = clean({ ...story.scenario, id });
    try { localStorage.setItem(DRAFT_KEY(id), JSON.stringify(light)); } catch { /* rien */ }
    return { ok: true, id, light: true };
  }
}

/** Prépare la partie : depuis le début, ou directement à une scène. */
export function setProgress(story, fromSceneId) {
  const id = previewId(story);
  const progress = fromSceneId ? pathTo(story.scenario, fromSceneId) : { history: [], choices: {} };
  try {
    localStorage.setItem(PROGRESS_KEY(id), JSON.stringify(progress || { history: [], choices: {} }));
    // Chrono de séance et gestes libres (réactions, transferts) de la partie précédente.
    localStorage.removeItem('storylab:session');
    localStorage.removeItem('storylab:extras');
  } catch { /* rien */ }
  return !!progress;
}

export function phoneUrl(story, { fast } = {}) {
  return `/s/${previewId(story)}?draft${fast ? '&rapide' : ''}`;
}
