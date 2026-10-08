/** Les six étapes d'une histoire, et ce qui fait qu'une étape est « faite ». */
import { reachable } from './model.js';
import { isTodo } from './templates.js';

export const STEPS = [
  { id: 'projet', label: 'Intention', long: 'Intention pédagogique', icon: 'target', sub: 'Pour qui, pour quoi' },
  { id: 'personnages', label: 'Personnages', long: 'Les personnages', icon: 'users', sub: 'Qui écrit, qui appelle' },
  { id: 'scenes', label: 'Scènes', long: 'Les scènes', icon: 'route', sub: 'Ce que vit l’élève' },
  { id: 'fins', label: 'Fins & débat', long: 'Fins et débat', icon: 'flag', sub: 'Conclure et discuter' },
  { id: 'tester', label: 'Tester', long: 'Tester dans le téléphone', icon: 'play', sub: 'Jouer comme un élève' },
  { id: 'envoyer', label: 'Envoyer', long: 'Vérifier et envoyer', icon: 'send', sub: 'À l’équipe Déclic' },
];

export const stepIndex = (id) => Math.max(0, STEPS.findIndex((x) => x.id === id));

export function stepDone(story, id, check) {
  const s = story.scenario;
  const reach = reachable(s);
  switch (id) {
    case 'projet': return !!(s.title?.trim() && story.meta.niveau && story.meta.objectifs?.trim());
    case 'personnages': return Object.keys(s.contacts || {}).length > 0;
    case 'scenes': return !!check && check.errors === 0 && !check.problems.some((p) => p.todo);
    case 'fins': {
      const ends = s.scenes.filter((sc) => sc.type === 'end' && reach.has(sc.id));
      return ends.length >= 1 && ends.every((e) => e.title?.trim() && !isTodo(e.title) && e.discuss?.some((q) => q.trim() && !isTodo(q)));
    }
    case 'tester': return !!story.meta.tested;
    case 'envoyer': return story.status === 'sent';
    default: return false;
  }
}

/** Avancement global, en pourcentage (pour les cartes d'histoire). */
export function progressOf(story, check) {
  const done = STEPS.filter((st) => stepDone(story, st.id, check)).length;
  return Math.round((done / STEPS.length) * 100);
}
