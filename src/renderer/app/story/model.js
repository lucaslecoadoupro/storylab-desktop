/**
 * Outils pour manipuler un scénario StoryLab sans jamais écrire de JSON :
 * libellés lisibles, création et suppression de scènes, liens, plan de l'histoire.
 * Le format est celui du moteur (shared/types.ts), validé par shared/validate.ts.
 */
import { slug } from '../utils.js';

export const TYPE_INFO = {
  message: {
    label: 'Message', icon: 'message', color: '#2f80ed', group: 'phone',
    help: 'Un message arrive dans une messagerie (Messages ou Papote), ou c’est l’élève qui écrit.',
    when: 'Pour faire parler les personnages : une conversation privée ou un groupe de classe.',
  },
  publication: {
    label: 'Publication', icon: 'image', color: '#d6336c', group: 'phone',
    help: 'Une publication apparaît dans le fil de Pixa (photo + commentaires) ou un « check-in » dans Clan.',
    when: 'Pour montrer ce qui circule sur les réseaux : une photo, des commentaires, des « J’aime ».',
  },
  story: {
    label: 'Story', icon: 'story', color: '#e8590c', group: 'phone',
    help: 'Une story plein écran en plusieurs écrans (Pixa, Flash).',
    when: 'Pour un contenu éphémère : une série de photos ou de phrases qui défilent.',
  },
  notification: {
    label: 'Notification', icon: 'bell', color: '#f08c00', group: 'phone',
    help: 'Une simple bannière en haut de l’écran (et une pastille sur l’appli).',
    when: 'Pour annoncer quelque chose ou attirer l’élève vers une appli.',
  },
  media: {
    label: 'Photo reçue', icon: 'photo', color: '#0ca678', group: 'phone',
    help: 'Une photo s’ajoute à la galerie Photos du téléphone.',
    when: 'Pour qu’une image soit retrouvée dans la galerie.',
  },
  call: {
    label: 'Appel', icon: 'phoneCall', color: '#2b8a3e', group: 'phone',
    help: 'Un appel reçu (décrocher / refuser) ou une conversation téléphonique sous-titrée.',
    when: 'Pour un moment fort : un parent qui appelle, le 3018, un ami en panique.',
  },
  narration: {
    label: 'Récit', icon: 'book', color: '#495057', group: 'outside',
    help: 'Ce qui se passe hors du téléphone : « Le lendemain, au collège… ».',
    when: 'Pour planter le décor, faire passer le temps ou raconter une scène dans la vraie vie.',
  },
  choice: {
    label: 'Choix du héros', icon: 'thought', color: '#7048e8', group: 'outside',
    help: 'Une décision « dans la tête » de l’élève, hors de toute appli.',
    when: 'Quand l’élève doit décider quoi faire (en parler, ignorer, signaler…).',
  },
  end: {
    label: 'Fin', icon: 'flag', color: '#c92a2a', group: 'end',
    help: 'Une fin de l’histoire, avec un texte de conclusion et des questions pour le débat.',
    when: 'Chaque chemin doit se terminer par une fin. Prévoyez-en au moins deux.',
  },
};

export const TYPE_ORDER = ['message', 'publication', 'story', 'notification', 'media', 'call', 'narration', 'choice', 'end'];

/** Applis du téléphone dans lesquelles une scène peut se dérouler. */
export const STORY_APPS = [
  { id: 'messages', name: 'Messages', for: ['message', 'notification'], icon: 'message', bg: 'linear-gradient(#6CF28A, #1EC243)', desc: 'SMS classiques' },
  { id: 'papote', name: 'Papote', for: ['message', 'notification', 'call'], image: '/assets/icons/papote.webp', bg: '#00CC33', desc: 'Messagerie avec groupes, vocaux et appels' },
  { id: 'pixa', name: 'Pixa', for: ['publication', 'story', 'notification'], image: '/assets/icons/pixa.webp', bg: 'linear-gradient(45deg, #FDC468, #F0526A 50%, #9B3AD8)', desc: 'Réseau de photos : fil, J’aime, commentaires, stories' },
  { id: 'flash', name: 'Flash', for: ['story', 'notification'], image: '/assets/icons/flash.webp', bg: '#FFE600', desc: 'Stories éphémères et carte des amis' },
  { id: 'clan', name: 'Clan', for: ['publication', 'notification'], image: '/assets/icons/clan.webp', bg: '#10262A', desc: 'Check-ins entre amis : « Emma est au parc avec Inès »' },
  { id: 'phone', name: 'Téléphone', for: ['call'], icon: 'phoneCall', bg: 'linear-gradient(#6CF28A, #1EC243)', desc: 'Appels classiques' },
  { id: 'classe', name: 'Classe', for: ['notification'], icon: 'graduation', bg: 'linear-gradient(#2BC4A8, #11897A)', desc: 'Espace numérique du collège' },
  { id: 'mail', name: 'Mail', for: ['notification'], icon: 'mail', bg: 'linear-gradient(#56B7FF, #1476F2)', desc: 'Messagerie électronique' },
  { id: 'photos', name: 'Photos', for: ['notification'], icon: 'photo', bg: '#F2A20C', desc: 'Galerie de photos' },
];
export const appInfo = (id) => STORY_APPS.find((a) => a.id === id) || { id, name: id || '—', icon: 'smartphone', bg: '#64748b' };
export const appsFor = (type) => STORY_APPS.filter((a) => a.for.includes(type));
export const MESSAGING_APPS = STORY_APPS.filter((a) => a.for.includes('message'));

export const sceneNumber = (id) => (/^s[\w-]+$/.test(id) ? id.slice(1) : id);

/** Nom affiché d'un personnage (« me » = l'élève). */
export function whoName(s, id) {
  if (!id) return '';
  if (id === 'me') return 'L’élève (héros)';
  if (id === 'system') return 'Information';
  return s.contacts?.[id]?.name || id;
}

const textOf = (c) => (c ? (c.type === 'audio' ? `🎤 ${c.text || 'Message vocal'}` : c.text || (c.alt ? `📷 ${c.alt}` : c.type === 'image' ? '📷 Photo' : '')) : '');

/** Résumé court d'une scène pour le plan et les listes. */
export function summary(sc, s) {
  const who = (id) => (id === 'me' ? 'Moi' : whoName(s, id));
  switch (sc.type) {
    case 'message': return `${who(sc.sender)} : ${textOf(sc.content) || '…'}`;
    case 'publication': return `${who(sc.author)} publie : ${textOf(sc.content) || '…'}`;
    case 'story': return `Story de ${who(sc.author)}`;
    case 'notification': return [sc.title, sc.text].filter(Boolean).join(' — ') || 'Notification';
    case 'media': return textOf(sc.content) || 'Photo';
    case 'call': return `Appel ${sc.direction === 'outgoing' ? 'vers' : 'de'} ${who(sc.caller) || '…'}`;
    case 'choice': return sc.prompt || 'Que fais-tu ?';
    case 'narration': return sc.title || sc.text || 'Récit';
    case 'end': return sc.title || 'Fin';
    default: return '';
  }
}

/** Scènes vers lesquelles une scène renvoie. */
export const targetsOf = (sc) => [sc.next, ...(sc.choices ?? []).map((c) => c.next)].filter(Boolean);

export const byId = (s, id) => s.scenes.find((sc) => sc.id === id);

export function newId(s) {
  let n = s.scenes.length + 1;
  while (s.scenes.some((sc) => sc.id === `s${n}`)) n++;
  return `s${n}`;
}

/** Scènes qui mènent à `id` (par la suite automatique ou un choix). */
export function incoming(s, id) {
  const out = [];
  for (const sc of s.scenes) {
    if (sc.next === id) out.push({ from: sc.id, choice: null });
    sc.choices?.forEach((c, i) => { if (c.next === id) out.push({ from: sc.id, choice: i }); });
  }
  if (s.start === id) out.push({ from: null, choice: null });
  return out;
}

/** Dernière scène « dans le téléphone » avant `id`, pour reprendre l'appli et la conversation. */
function contextBefore(s, id) {
  let cur = id;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const sc = byId(s, cur);
    if (sc && (sc.type === 'message' || sc.type === 'publication' || sc.type === 'story' || sc.type === 'call')) return sc;
    const inc = incoming(s, cur).find((x) => x.from);
    cur = inc?.from;
  }
  return null;
}

/** Scène vide d'un type donné, pré-remplie d'après ce qui précède (`after`). */
export function blankScene(type, id, s, after) {
  const ctx = after ? contextBefore(s, after) : null;
  const firstContact = Object.keys(s.contacts || {})[0] || 'me';
  const lastApp = ctx?.app;
  const thread = ctx?.type === 'message' ? ctx.thread || (ctx.sender !== 'me' ? ctx.sender : undefined) : undefined;
  switch (type) {
    case 'message': {
      const app = MESSAGING_APPS.some((a) => a.id === lastApp) ? lastApp : 'papote';
      const t = thread || (firstContact !== 'me' ? firstContact : undefined);
      return { id, type, app, sender: t && s.contacts?.[t] ? t : firstContact, ...(t ? { thread: t } : {}), content: { type: 'text', text: '' } };
    }
    case 'publication': return { id, type, app: lastApp === 'clan' ? 'clan' : 'pixa', author: firstContact, content: { type: 'image', alt: '' }, likes: 12 };
    case 'story': return { id, type, app: lastApp === 'flash' ? 'flash' : 'pixa', author: firstContact, frames: [{ type: 'text', text: '' }] };
    case 'notification': return { id, type, app: lastApp && appsFor('notification').some((a) => a.id === lastApp) ? lastApp : 'papote', title: '', text: '' };
    case 'media': return { id, type, content: { type: 'image', alt: '' } };
    case 'call': return { id, type, app: 'phone', caller: firstContact !== 'me' ? firstContact : '', choices: [{ label: 'Décrocher', next: '' }, { label: 'Refuser', next: '' }] };
    case 'choice': return { id, type, prompt: 'Que fais-tu ?', choices: [{ label: '', next: '' }, { label: '', next: '' }] };
    case 'narration': return { id, type, title: '', text: '' };
    case 'end': return { id, type, title: '', text: '', discuss: [] };
    default: return { id, type };
  }
}

/** Change le type d'une scène en gardant son identifiant, sa suite et ses choix. */
export function changeType(s, id, type) {
  const old = byId(s, id);
  const fresh = blankScene(type, id, s, id);
  if (type !== 'end') {
    if (old.choices?.length && type !== 'notification') { fresh.choices = old.choices; delete fresh.next; } else if (old.next || old.choices?.[0]?.next) { fresh.next = old.next || old.choices[0].next; delete fresh.choices; }
    if (type === 'choice' && !fresh.choices) fresh.choices = [{ label: '', next: fresh.next || '' }, { label: '', next: '' }];
    if (type === 'choice') delete fresh.next;
  }
  s.scenes = s.scenes.map((sc) => (sc.id === id ? fresh : sc));
}

/** Insère `scene` juste après la scène `afterId` (qui doit avoir une suite simple). */
export function insertAfter(s, afterId, scene) {
  const after = byId(s, afterId);
  if (scene.type !== 'end' && !scene.choices?.length) scene.next = after?.next || undefined;
  else if (scene.choices?.length && after?.next) scene.choices[0].next = scene.choices[0].next || after.next;
  if (after) { after.next = scene.id; delete after.choices; }
  const idx = s.scenes.findIndex((sc) => sc.id === afterId);
  s.scenes.splice(idx + 1, 0, scene);
}

/** Insère `scene` au début de la branche n° `choiceIdx` de la scène `sceneId`. */
export function insertInBranch(s, sceneId, choiceIdx, scene) {
  const sc = byId(s, sceneId);
  const ch = sc.choices[choiceIdx];
  if (scene.type !== 'end' && !scene.choices?.length) scene.next = ch.next || undefined;
  else if (scene.choices?.length && ch.next) scene.choices[0].next = ch.next;
  ch.next = scene.id;
  const idx = s.scenes.findIndex((x) => x.id === sceneId);
  s.scenes.splice(idx + 1, 0, scene);
}

/** Insère une scène avant la scène de départ. */
export function insertAtStart(s, scene) {
  if (scene.type !== 'end' && !scene.choices?.length) scene.next = s.start;
  else if (scene.choices?.length) scene.choices[0].next = s.start;
  s.start = scene.id;
  s.scenes.unshift(scene);
}

/** Ajoute un choix à une scène (la suite automatique devient le premier choix). */
export function addChoice(s, sceneId) {
  const sc = byId(s, sceneId);
  if (!sc.choices?.length) {
    sc.choices = [{ label: '', next: sc.next || '' }, { label: '', next: '' }];
    delete sc.next;
  } else {
    sc.choices.push({ label: '', next: '' });
  }
}

/** Retire un choix ; s'il n'en reste qu'un, il redevient la suite automatique (sauf choix du héros et appel). */
export function removeChoice(s, sceneId, i) {
  const sc = byId(s, sceneId);
  sc.choices.splice(i, 1);
  if (sc.choices.length === 1 && !['choice', 'call'].includes(sc.type) && !sc.choices[0].label) {
    sc.next = sc.choices[0].next || undefined;
    delete sc.choices;
  } else if (!sc.choices.length) {
    delete sc.choices;
  }
}

/**
 * Supprime une scène. Si elle avait une suite simple, les scènes qui y menaient
 * sont reliées directement à cette suite (on ne casse pas l'histoire).
 */
export function deleteScene(s, id) {
  const sc = byId(s, id);
  if (!sc) return;
  const bridge = sc.next || (sc.choices?.length === 1 ? sc.choices[0].next : '') || '';
  for (const o of s.scenes) {
    if (o.next === id) o.next = bridge || undefined;
    o.choices?.forEach((c) => {
      if (c.next === id) c.next = bridge;
      if (c.likes?.post === id) delete c.likes;
    });
  }
  s.scenes = s.scenes.filter((x) => x.id !== id);
  if (s.start === id) s.start = bridge || s.scenes[0]?.id || '';
}

/** Copie d'une scène insérée juste après elle. */
export function duplicateScene(s, id) {
  const sc = byId(s, id);
  const copy = JSON.parse(JSON.stringify(sc));
  copy.id = newId(s);
  if (!sc.choices?.length && sc.type !== 'end') { copy.next = sc.next; sc.next = copy.id; }
  const idx = s.scenes.findIndex((x) => x.id === id);
  s.scenes.splice(idx + 1, 0, copy);
  return copy.id;
}

// ── Plan de l'histoire ──────────────────────────────────────────────────────

/** Scènes atteignables depuis le départ. */
export function reachable(s) {
  const seen = new Set();
  const stack = s.start ? [s.start] : [];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    const sc = byId(s, id);
    if (!sc) continue;
    seen.add(id);
    targetsOf(sc).forEach((t) => stack.push(t));
  }
  return seen;
}

/**
 * Plan lisible : une liste de blocs dans l'ordre de lecture.
 *  { kind: 'scene', id }                                 une scène
 *  { kind: 'branches', from, items: [{ choice, label, blocks }] }  des chemins après un choix
 *  { kind: 'join', to }                                   le chemin rejoint une scène déjà affichée
 *  { kind: 'dead', from }                                 le chemin s'arrête sans fin
 */
export function outline(s) {
  const placed = new Set();
  const build = (startId) => {
    const blocks = [];
    let cur = startId;
    let prev = null;
    while (cur) {
      if (placed.has(cur)) { blocks.push({ kind: 'join', to: cur }); return blocks; }
      const sc = byId(s, cur);
      if (!sc) { blocks.push({ kind: 'dead', from: prev, missing: cur }); return blocks; }
      placed.add(cur);
      blocks.push({ kind: 'scene', id: cur });
      if (sc.choices?.length) {
        blocks.push({
          kind: 'branches', from: cur,
          items: sc.choices.map((c, i) => ({ choice: i, label: c.label, blocks: c.next ? build(c.next) : [{ kind: 'dead', from: cur, choice: i }] })),
        });
        return blocks;
      }
      if (sc.type === 'end') return blocks;
      if (!sc.next) { blocks.push({ kind: 'dead', from: cur }); return blocks; }
      prev = cur;
      cur = sc.next;
    }
    return blocks;
  };
  const main = build(s.start);
  const orphans = s.scenes.filter((sc) => !placed.has(sc.id)).map((sc) => sc.id);
  // Les scènes non reliées sont affichées à part, chacune avec sa suite.
  const loose = [];
  for (const id of orphans) if (!placed.has(id)) loose.push(build(id));
  return { main, loose };
}

/**
 * Chemin depuis le départ jusqu'à `target` : de quoi lancer le téléphone de test
 * directement à cette scène (progression du moteur : scènes jouées + choix faits).
 */
export function pathTo(s, target) {
  if (!s.start || target === s.start) return { history: [], choices: {} };
  const prev = new Map([[s.start, null]]);
  const queue = [s.start];
  while (queue.length) {
    const id = queue.shift();
    if (id === target) break;
    const sc = byId(s, id);
    if (!sc) continue;
    const edges = sc.choices?.length ? sc.choices.map((c, i) => [c.next, i]) : sc.next ? [[sc.next, null]] : [];
    if (sc.type === 'narration' && !sc.choices?.length && sc.next) edges.splice(0, 1, [sc.next, 0]); // « Continuer » = choix implicite
    for (const [t, i] of edges) if (t && !prev.has(t)) { prev.set(t, { id, choice: i }); queue.push(t); }
  }
  if (!prev.has(target)) return null;
  const history = [];
  const choices = {};
  let cur = target;
  while (prev.get(cur)) {
    const { id, choice } = prev.get(cur);
    history.unshift(id);
    if (choice != null) choices[id] = choice;
    cur = id;
  }
  return { history, choices };
}

/** Quelques chiffres sur l'histoire. */
export function stats(s) {
  const reach = reachable(s);
  const scenes = s.scenes.filter((sc) => reach.has(sc.id));
  const decisions = scenes.filter((sc) => (sc.choices?.length || 0) >= 2).length;
  const ends = scenes.filter((sc) => sc.type === 'end').length;
  // Parcours différents jusqu'à une fin, et leur longueur moyenne (plafonnés, au cas où l'histoire boucle).
  let paths = 0;
  let steps = 0;
  const walk = (id, depth, seen) => {
    if (paths >= 500 || depth > 150 || seen.has(id)) return;
    const sc = byId(s, id);
    if (!sc) return;
    if (sc.type === 'end') { paths++; steps += depth + 1; return; }
    const next = new Set(seen).add(id);
    targetsOf(sc).forEach((t) => walk(t, depth + 1, next));
  };
  if (s.start) walk(s.start, 0, new Set());
  // Durée d'une partie : environ 20 secondes par scène (apparition, lecture, choix).
  const minutes = paths ? Math.max(1, Math.round(((steps / paths) * 20) / 60)) : 0;
  return { scenes: scenes.length, total: s.scenes.length, decisions, ends, paths, minutes };
}

/** Nouveau personnage : identifiant tiré du nom, unique. */
export function contactId(s, name) {
  const base = slug(name).slice(0, 24) || 'perso';
  let id = base;
  let n = 2;
  while (s.contacts?.[id] || id === 'me' || id === 'system') id = `${base}-${n++}`;
  return id;
}

/** Où un personnage apparaît-il ? (pour éviter de supprimer un personnage utilisé) */
export function usesOf(s, contact) {
  const n = [];
  for (const sc of s.scenes) {
    const hit = [sc.sender, sc.thread, sc.author, sc.caller, ...(sc.with || []), ...(sc.comments || []).map((c) => c.author), ...(sc.lines || []).map((l) => l.speaker), ...(sc.reactions || []).map((r) => r.from), ...(sc.choices || []).map((c) => c.forward?.thread)].includes(contact);
    if (hit) n.push(sc.id);
  }
  return n;
}

/** Nettoie le scénario (champs vides) avant de l'envoyer au téléphone ou à l'équipe. */
export function clean(s) {
  const strip = (o) => {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete o[k];
    }
    return o;
  };
  const scenes = s.scenes.map((sc) => {
    const c = strip(JSON.parse(JSON.stringify(sc)));
    if (c.content) strip(c.content);
    if (c.choices) c.choices = c.choices.map((ch) => strip(ch));
    if (c.lines) c.lines = c.lines.filter((l) => l.text?.trim());
    if (c.comments) c.comments = c.comments.filter((x) => x.text?.trim());
    if (c.discuss) c.discuss = c.discuss.filter((q) => q.trim());
    return strip(c);
  });
  const out = strip({ ...JSON.parse(JSON.stringify(s)), scenes });
  if (!out.contacts) out.contacts = {};
  return out;
}
