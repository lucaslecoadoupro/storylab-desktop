/**
 * Messages d'erreur lisibles par l'équipe : le validateur parle d'identifiants
 * internes (« Scène s12 »), que personne ne voit dans l'éditeur. On les remplace
 * par le numéro de la scène, son type et le début de son texte.
 * Utilisé à l'identique par l'éditeur et par l'onglet « Tester ».
 */
import type { Scenario, Scene } from './types.ts';

const TYPE_LABEL: Record<Scene['type'], string> = {
  message: 'Message', publication: 'Publication', story: 'Story', notification: 'Notification',
  media: 'Photo reçue', call: 'Appel', choice: 'Choix du héros', narration: 'Récit', end: 'Fin',
};

/** Numéro affiché d'une scène : « s12 » → « 12 », « s3b » → « 3b ». */
export const sceneNumber = (id: string) => (/^s[\w-]+$/.test(id) ? id.slice(1) : id);

const cut = (t: string, n = 40) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

function gist(sc: Scene, s: Scenario): string {
  const who = (id?: string) => (!id ? '' : id === 'me' ? 'Héros' : id === 'system' ? 'Info' : s.contacts?.[id]?.name ?? id);
  const txt = (c?: { text?: string; alt?: string }) => c?.text || c?.alt || '';
  switch (sc.type) {
    case 'message': return `${who(sc.sender)} : ${txt(sc.content)}`;
    case 'publication': return `${who(sc.author)} : ${txt(sc.content)}`;
    case 'story': return `story de ${who(sc.author)}`;
    case 'notification': return sc.title || sc.text || '';
    case 'media': return txt(sc.content);
    case 'call': return `${sc.direction === 'outgoing' ? 'vers' : 'de'} ${who(sc.caller)}`;
    case 'choice': return sc.prompt || '';
    case 'narration': return sc.title || sc.text || '';
    case 'end': return sc.title || '';
    default: return '';
  }
}

/** « n° 12 · Message — Inès : tu viens ce soir ? » */
export function sceneLabel(s: Scenario, id: string): string {
  const sc = s.scenes?.find((x) => x?.id === id);
  if (!sc) return `n° ${sceneNumber(id)}`;
  const g = gist(sc, s).trim();
  return `n° ${sceneNumber(id)} · ${TYPE_LABEL[sc.type] ?? sc.type}${g ? ` — « ${cut(g)} »` : ''}`;
}

/** Identifiant de scène visé par un message du validateur (ou null). */
export const sceneOfProblem = (message: string) => message.match(/^Scène (\S+)/)?.[1] ?? null;

/** Réécrit un message du validateur avec le repère lisible de la scène. */
export function humanize(message: string, s: Scenario): string {
  const id = sceneOfProblem(message);
  if (!id) return message;
  const rest = message.slice(`Scène ${id}`.length);
  // Les renvois vers une autre scène (« …inexistante "s40" ») gardent un numéro lisible.
  const tidy = rest.replace(/scène inexistante "([^"]*)"/, (_, t: string) => (t ? `scène inexistante (n° ${sceneNumber(t)})` : 'scène vide'));
  return `Scène ${sceneLabel(s, id)}${tidy}`;
}
