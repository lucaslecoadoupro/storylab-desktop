/**
 * Vérification d'une histoire, en mots simples.
 * 1. Le validateur du moteur (exactement le même que le téléphone et le panneau
 *    de l'équipe) : ses erreurs bloquent l'envoi.
 * 2. Des conseils d'écriture et de pédagogie : ils n'empêchent rien.
 */
import { validateScenario } from '../shared/validate.ts';
import { sceneOfProblem } from '../shared/describe.ts';
import KNOWN_APPS from '../shared/apps.json';
import { byId, clean, reachable, sceneNumber, TYPE_INFO, whoName } from './model.js';
import { isTodo } from './templates.js';

const PLAIN = [
  [/ni "next" ni "choices" \(impasse\)\.?/, 'ne mène nulle part : indiquez ce qui se passe ensuite.'],
  [/renvoie vers une scène inexistante "([^"]*)"\.?/, 'renvoie vers une scène qui n’existe plus : choisissez une autre suite.'],
  [/le choix (\d+) n’a pas de libellé\./, 'le choix $1 n’a pas de texte.'],
  [/le choix (\d+) ne mène à aucune scène \(suite à choisir\)\./, 'le choix $1 ne mène à aucune scène : choisissez sa suite.'],
  [/un message du héros doit préciser "thread"\./, 'un message de l’élève doit préciser la conversation où il l’écrit.'],
  [/une fin doit avoir un "title"\./, 'une fin doit avoir un titre.'],
  [/une narration doit avoir "text" ou "lines"\./, 'le récit est vide.'],
  [/"frames" vide\./, 'la story n’a aucun écran.'],
  [/champ "app" obligatoire\./, 'choisissez l’appli où se passe la scène.'],
  [/champ "content" manquant\./, 'le contenu est vide.'],
  [/un choix doit proposer "choices"\./, 'il faut au moins un choix.'],
  [/image sans texte alternatif "alt"\./, 'la photo n’a pas de description (utile aux élèves malvoyants, et affichée tant qu’il n’y a pas d’image).'],
  [/contact "([^"]+)" non déclaré dans "contacts"\./, 'personnage inconnu « $1 » : créez-le dans l’étape Personnages.'],
  [/une fin ne devrait pas avoir de suite\./, 'une fin ne devrait pas avoir de suite.'],
  [/jamais atteinte\./, 'n’est reliée à aucun chemin : l’élève ne la verra jamais.'],
  [/message vocal sans enregistrement ni transcription\./, 'message vocal vide : enregistrez un son ou écrivez la transcription.'],
  [/message vocal sans enregistrement \(la transcription sera lue par le téléphone\)\./, 'message vocal sans enregistrement : le téléphone lira la transcription avec une voix de synthèse.'],
];

function plain(message) {
  for (const [re, rep] of PLAIN) if (re.test(message)) return message.replace(re, rep);
  return message;
}

/** « Scène s12 : … » → { sceneId: 's12', text: 'Scène n° 12 (Message) : …' } */
function toProblem(level, message, s) {
  if (message === 'Aucune fin atteignable.') return { level, sceneId: null, text: 'Aucun chemin n’arrive à une fin : chaque chemin doit se terminer par une scène « Fin ».' };
  if (/^Champ "title" manquant/.test(message)) return { level, sceneId: null, text: 'L’histoire n’a pas de titre.' };
  if (/^Scène de départ introuvable/.test(message)) return { level, sceneId: null, text: 'L’histoire n’a pas de scène de départ.' };
  const id = sceneOfProblem(message);
  if (!id) return { level, sceneId: null, text: plain(message) };
  const rest = message.slice(`Scène ${id}`.length).replace(/^ : /, '');
  return { level, sceneId: id, text: plain(rest).replace(/^./, (c) => c.toUpperCase()) };
}

export const KNOWN = KNOWN_APPS;

export function checkStory(story) {
  const s = clean(story.scenario);
  const { errors, warnings } = validateScenario(s, KNOWN_APPS);
  const problems = [
    ...errors.map((e) => toProblem('error', e, s)),
    ...warnings.map((w) => toProblem('warning', w, s)),
  ];
  const tips = [];
  const scenes = story.scenario.scenes;
  const reach = reachable(story.scenario);

  // Textes d'exemple pas encore réécrits.
  for (const sc of scenes) {
    const fields = [sc.title, sc.text, sc.prompt, sc.content?.text, sc.content?.alt, ...(sc.choices || []).map((c) => c.label), ...(sc.discuss || []), ...(sc.comments || []).map((c) => c.text), ...(sc.frames || []).map((f) => f.text || f.alt), ...(sc.lines || []).map((l) => l.text)];
    const n = fields.filter(isTodo).length;
    if (n) problems.push({ level: 'warning', sceneId: sc.id, text: `${n > 1 ? `${n} textes d’exemple` : 'Un texte d’exemple'} (✏️) à réécrire.`, todo: true });
  }

  // Appel entrant : 1er choix = décrocher, 2e = refuser.
  for (const sc of scenes) {
    if (sc.type === 'call' && !sc.lines?.length && (sc.choices?.length || 0) < 2 && reach.has(sc.id)) {
      tips.push({ level: 'tip', sceneId: sc.id, text: 'Un appel entrant propose normalement deux choix : « Décrocher » puis « Refuser ».' });
    }
    if (sc.type === 'message' && (sc.content?.text || '').length > 300) {
      tips.push({ level: 'tip', sceneId: sc.id, text: 'Message très long : sur un téléphone, mieux vaut plusieurs messages courts.' });
    }
    if (sc.type === 'end' && !sc.discuss?.filter((q) => q.trim() && !isTodo(q)).length && reach.has(sc.id)) {
      tips.push({ level: 'tip', sceneId: sc.id, text: 'Ajoutez une ou deux questions pour le débat en classe.' });
    }
    if (sc.content?.type === 'image' && !sc.content.src && sc.content.alt && reach.has(sc.id)) {
      tips.push({ level: 'info', sceneId: sc.id, text: 'Photo à fournir : en attendant, l’élève verra une vignette avec la description.' });
    }
  }

  const ends = scenes.filter((sc) => sc.type === 'end' && reach.has(sc.id)).length;
  const decisions = scenes.filter((sc) => reach.has(sc.id) && (sc.choices?.length || 0) >= 2).length;
  if (ends < 2) tips.push({ level: 'tip', sceneId: null, text: 'Une seule fin : prévoyez au moins deux fins pour que les choix de l’élève comptent vraiment.' });
  if (decisions < 1) tips.push({ level: 'tip', sceneId: null, text: 'Aucune décision pour l’élève : ajoutez au moins un choix qui crée deux chemins.' });
  if (!story.scenario.hint?.trim()) tips.push({ level: 'tip', sceneId: null, step: 'projet', text: 'Pas de consigne de départ : dites à l’élève quelle appli ouvrir pour commencer.' });
  if (!story.meta.objectifs?.trim()) tips.push({ level: 'tip', sceneId: null, step: 'projet', text: 'Les objectifs pédagogiques ne sont pas renseignés : ils aident l’équipe à relire et à publier.' });

  const errorsN = problems.filter((p) => p.level === 'error').length;
  const warningsN = problems.filter((p) => p.level === 'warning').length;
  return { problems, tips, errors: errorsN, warnings: warningsN, ok: errorsN === 0 };
}

/** Problèmes par scène (pastilles du plan). */
export function problemsByScene(check) {
  const m = new Map();
  for (const p of [...check.problems, ...check.tips]) {
    if (!p.sceneId) continue;
    const cur = m.get(p.sceneId) || [];
    cur.push(p);
    m.set(p.sceneId, cur);
  }
  return m;
}

/** « n° 12 · Message » */
export function sceneTag(s, id) {
  const sc = byId(s, id);
  return sc ? `n° ${sceneNumber(id)} · ${TYPE_INFO[sc.type]?.label || sc.type}` : `n° ${sceneNumber(id)}`;
}

export { whoName };
