/**
 * Points de départ d'une nouvelle histoire : squelettes à compléter et
 * histoire d'exemple. Les textes à remplacer commencent par « ✏️ » : le studio
 * les repère et les signale tant qu'ils ne sont pas réécrits.
 */
import { slug } from '../utils.js';

export const TODO = '✏️ ';
export const isTodo = (t) => typeof t === 'string' && t.startsWith('✏️');

export const LEVELS = ['6e', '5e', '4e', '3e', 'Cycle 3', 'Cycle 4', 'Lycée', 'Tous niveaux'];

export const THEMES = [
  { id: 'harcelement', label: 'Harcèlement et cyberharcèlement', icon: 'users2' },
  { id: 'image', label: 'Droit à l’image et vie privée', icon: 'photo' },
  { id: 'info', label: 'Information et fausses nouvelles (EMI)', icon: 'search' },
  { id: 'ecrans', label: 'Usage des écrans et réseaux', icon: 'smartphone' },
  { id: 'relations', label: 'Relations, consentement (EVARS)', icon: 'heart' },
  { id: 'citoyennete', label: 'Citoyenneté et vivre-ensemble', icon: 'flag' },
  { id: 'orientation', label: 'Orientation et avenir', icon: 'compass' },
  { id: 'sante', label: 'Santé et bien-être', icon: 'smile' },
  { id: 'autre', label: 'Autre thème', icon: 'sparkles' },
];

const base = (title, scenes, contacts = {}, extra = {}) => ({
  id: slug(title),
  title,
  start: scenes[0].id,
  duration: 45,
  hint: 'Pour commencer, ouvre Papote.',
  contacts,
  scenes,
  ...extra,
});

export const SKELETONS = [
  {
    id: 'deux-fins',
    title: 'Une décision, deux fins',
    sub: 'Idéal pour une première histoire (15 à 20 min de jeu).',
    icon: 'branch',
    shape: [1, 1, 2, 2],
    build: (title) => base(title, [
      { id: 's1', type: 'narration', title: `${TODO}Mardi, 17 h 30`, text: `${TODO}Présentez la situation : où est l’élève, à quel moment, ce qui vient de se passer.`, next: 's2' },
      { id: 's2', type: 'message', app: 'papote', sender: 'ami', content: { type: 'text', text: `${TODO}Le premier message que reçoit l’élève.` }, next: 's3' },
      { id: 's3', type: 'choice', prompt: 'Que fais-tu ?', choices: [{ label: `${TODO}Première réaction possible`, next: 's4' }, { label: `${TODO}Autre réaction possible`, next: 's6' }] },
      { id: 's4', type: 'message', app: 'papote', sender: 'ami', content: { type: 'text', text: `${TODO}Ce qui arrive après la première réaction.` }, next: 's5' },
      { id: 's5', type: 'end', title: `${TODO}Titre de la première fin`, text: `${TODO}Ce que l’élève peut retenir de ce chemin.`, discuss: [`${TODO}Une question pour le débat en classe`] },
      { id: 's6', type: 'message', app: 'papote', sender: 'ami', content: { type: 'text', text: `${TODO}Ce qui arrive après l’autre réaction.` }, next: 's7' },
      { id: 's7', type: 'end', title: `${TODO}Titre de la deuxième fin`, text: `${TODO}Ce que l’élève peut retenir de ce chemin.`, discuss: [`${TODO}Une question pour le débat en classe`] },
    ], { ami: { name: 'Camille' } }),
  },
  {
    id: 'trois-fins',
    title: 'Deux décisions, trois fins',
    sub: 'La forme classique d’une séance Déclic (25 à 35 min).',
    icon: 'route',
    shape: [1, 1, 2, 3],
    build: (title) => base(title, [
      { id: 's1', type: 'narration', title: `${TODO}Vendredi soir`, text: `${TODO}Présentez la situation de départ.`, next: 's2' },
      { id: 's2', type: 'message', app: 'papote', sender: 'amie', thread: 'groupe', content: { type: 'text', text: `${TODO}Un message dans le groupe de la classe.` }, next: 's3' },
      { id: 's3', type: 'message', app: 'papote', sender: 'ami', thread: 'groupe', content: { type: 'text', text: `${TODO}Un deuxième message qui fait monter la tension.` }, choices: [{ label: `${TODO}Réponse 1 (envoyée dans le groupe)`, next: 's4' }, { label: `${TODO}Ne rien répondre`, say: false, next: 's8' }] },
      { id: 's4', type: 'notification', app: 'pixa', title: 'Pixa', text: `${TODO}Une nouvelle publication…`, next: 's5' },
      { id: 's5', type: 'publication', app: 'pixa', author: 'ami', content: { type: 'image', alt: `${TODO}Décrivez la photo publiée`, text: `${TODO}La légende de la publication` }, likes: 24, comments: [{ author: 'amie', text: `${TODO}Un commentaire` }], choices: [{ label: `${TODO}Aimer la publication`, likes: { add: 1 }, next: 's6' }, { label: `${TODO}Signaler la publication`, next: 's7' }] },
      { id: 's6', type: 'end', title: `${TODO}Première fin`, text: `${TODO}Conclusion de ce chemin.`, discuss: [`${TODO}Question pour le débat`] },
      { id: 's7', type: 'end', title: `${TODO}Deuxième fin`, text: `${TODO}Conclusion de ce chemin.`, discuss: [`${TODO}Question pour le débat`] },
      { id: 's8', type: 'narration', title: `${TODO}Le lendemain, au collège`, text: `${TODO}Ce qui se passe quand on ne dit rien.`, next: 's9' },
      { id: 's9', type: 'end', title: `${TODO}Troisième fin`, text: `${TODO}Conclusion de ce chemin.`, discuss: [`${TODO}Question pour le débat`] },
    ], { groupe: { name: 'Les 4e B' }, ami: { name: 'Yanis' }, amie: { name: 'Lou' } }),
  },
  {
    id: 'blanche',
    title: 'Page blanche',
    sub: 'Juste un début et une fin : vous construisez tout.',
    icon: 'fileText',
    shape: [1, 1],
    build: (title) => base(title, [
      { id: 's1', type: 'narration', title: `${TODO}Début`, text: `${TODO}Présentez la situation à l’élève.`, next: 's2' },
      { id: 's2', type: 'end', title: `${TODO}Fin`, text: '', discuss: [] },
    ]),
  },
];

/** Nombre de fins proposé pour une structure « sur mesure ». */
export const ENDS_MIN = 2;
export const ENDS_MAX = 10;
const ORDINALS = ['Première', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième', 'Huitième', 'Neuvième', 'Dixième'];

/** Répartit n fins en au plus 3 chemins (A/B/C) aussi équilibrés que possible. */
function split(n) {
  const k = Math.min(3, n);
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

/** Schéma (scènes par étage) d'une structure à n fins, pour la vignette. */
export function shapeFor(n) {
  const rows = [1, 1];
  let frontier = [n];
  while (frontier.some((x) => x > 1)) {
    frontier = frontier.flatMap((x) => (x > 1 ? split(x) : [x]));
    rows.push(frontier.length);
  }
  return rows;
}

/**
 * Structure à remplir avec exactement `n` fins : un début, puis des décisions
 * successives (au plus trois chemins par décision) jusqu'à obtenir n fins.
 */
export function buildWithEnds(title, n) {
  n = Math.max(ENDS_MIN, Math.min(ENDS_MAX, Math.round(n) || ENDS_MIN));
  const scenes = [];
  let count = 0;
  let endCount = 0;
  const id = () => `s${++count}`;
  scenes.push({ id: id(), type: 'narration', title: `${TODO}Début`, text: `${TODO}Présentez la situation de départ : où est l’élève, à quel moment, ce qui vient de se passer.` });
  const first = { id: id(), type: 'message', app: 'papote', sender: 'ami', content: { type: 'text', text: `${TODO}Le premier message que reçoit l’élève.` } };
  scenes[0].next = first.id;
  scenes.push(first);
  let decisions = 0;
  // Construit la suite d'une scène qui doit mener à `ends` fins.
  const grow = (from, ends) => {
    if (ends === 1) {
      const end = { id: id(), type: 'end', title: `${TODO}${ORDINALS[endCount] ?? `N° ${endCount + 1} :`} fin`, text: `${TODO}Ce que l’élève peut retenir de ce chemin.`, discuss: [`${TODO}Une question pour le débat en classe`] };
      endCount++;
      from.next = end.id;
      scenes.push(end);
      return;
    }
    decisions++;
    const choice = { id: id(), type: 'choice', prompt: decisions === 1 ? 'Que fais-tu ?' : `${TODO}Nouvelle décision : que fais-tu ?`, choices: [] };
    from.next = choice.id;
    scenes.push(choice);
    split(ends).forEach((sub, i) => {
      const step = { id: id(), type: 'message', app: 'papote', sender: 'ami', content: { type: 'text', text: `${TODO}Ce qui arrive après la réaction ${'ABC'[i]}.` } };
      choice.choices.push({ label: `${TODO}Réaction ${'ABC'[i]}`, next: step.id });
      scenes.push(step);
      grow(step, sub);
    });
  };
  grow(first, n);
  return base(title, scenes, { ami: { name: 'Camille' } });
}

export const EXAMPLE_META = {
  niveau: '5e',
  theme: 'image',
  objectifs: 'Comprendre qu’une photo publiée sans accord peut blesser ; identifier les réactions possibles d’un témoin (réagir, en parler, signaler) et leurs conséquences.',
  resume: 'Léo a pris en photo Sami à la cantine et veut la publier sur Pixa. L’élève, témoin dans le groupe de classe, doit choisir comment réagir.',
  deroule: '5 min : présentation (« vous allez utiliser le téléphone d’un élève de 5e »).\n20 min : jeu en binômes.\n15 min : débat à partir des questions de fin.\n5 min : trace écrite (droit à l’image, 3018).',
  debrief: 'Faire comparer les fins obtenues par les binômes. Insister sur le rôle des témoins et sur le droit à l’image (art. 9 du Code civil). Rappeler le 3018.',
  characters: {
    leo: { kind: 'person', role: 'Élève de la classe, aime faire rire les autres' },
    ines: { kind: 'person', role: 'Amie de l’élève' },
    nour: { kind: 'person', role: 'Élève de la classe' },
    sami: { kind: 'person', role: 'Élève pris en photo à son insu' },
    'groupe-5eb': { kind: 'group', role: 'Groupe Papote de la classe' },
  },
};

/** Histoire d'exemple complète, à explorer ou à modifier. */
export function exampleStory() {
  return {
    id: 'la-photo-de-trop',
    title: 'La photo de trop (exemple)',
    start: 's1',
    duration: 45,
    hint: 'Pour commencer, ouvre Papote.',
    contacts: { leo: { name: 'Léo' }, ines: { name: 'Inès' }, nour: { name: 'Nour' }, sami: { name: 'Sami' }, 'groupe-5eb': { name: 'Les 5e B 🍕' } },
    scenes: [
      { id: 's1', type: 'narration', title: 'Vendredi, 18 h 05', text: 'Tu rentres du collège. Ce midi, à la cantine, Léo a pris des photos de tout le monde en train de manger. Ton téléphone vibre.', next: 's2' },
      { id: 's2', type: 'message', app: 'papote', sender: 'leo', thread: 'groupe-5eb', content: { type: 'image', alt: 'Photo floue de Sami, la bouche pleine, à la cantine', text: 'MDR regardez la tête de Sami 😂😂' }, next: 's3' },
      { id: 's3', type: 'message', app: 'papote', sender: 'ines', thread: 'groupe-5eb', content: { type: 'text', text: 'ptdr il va pas aimer' }, reactions: [{ from: 'leo', emoji: '😂' }], next: 's4' },
      {
        id: 's4', type: 'message', app: 'papote', sender: 'leo', thread: 'groupe-5eb', content: { type: 'text', text: 'je la mets sur Pixa ce soir, ça va faire un carton' },
        choices: [
          { label: 'Réagir avec 😂', react: '😂', next: 's5' },
          { label: 'Supprime, c’est pas cool pour lui', next: 's8' },
          { label: 'Ne rien dire', say: false, next: 's12' },
        ],
      },
      { id: 's5', type: 'notification', app: 'pixa', title: 'Pixa', text: 'Léo a publié une nouvelle photo', next: 's6' },
      {
        id: 's6', type: 'publication', app: 'pixa', author: 'leo', content: { type: 'image', alt: 'La photo de Sami à la cantine', text: 'Le roi de la cantine 👑😂' }, likes: 34,
        comments: [{ author: 'ines', text: '😂😂😂' }, { author: 'nour', text: 'abusé le pauvre' }],
        choices: [
          { label: 'Aimer la publication', likes: { add: 1 }, next: 's7' },
          { label: 'Signaler la publication', next: 's10' },
        ],
      },
      { id: 's7', type: 'message', app: 'papote', sender: 'sami', content: { type: 'text', text: 't’as liké la photo ? sérieux ?' }, next: 's15' },
      { id: 's8', type: 'message', app: 'papote', sender: 'leo', thread: 'groupe-5eb', content: { type: 'text', text: 'oh ça va c’est pour rire 🙄' }, next: 's9' },
      {
        id: 's9', type: 'choice', prompt: 'Léo n’a pas l’air de vouloir supprimer. Que fais-tu ?',
        choices: [
          { label: 'J’écris en privé à Sami', next: 's13' },
          { label: 'Je laisse tomber', next: 's5' },
        ],
      },
      { id: 's10', type: 'narration', title: 'Quelques minutes plus tard', text: 'Pixa te remercie pour ton signalement. Une heure après, la publication a disparu. Léo écrit dans le groupe : « qui a signalé ?? »', next: 's16' },
      { id: 's12', type: 'narration', title: 'Lundi, au collège', text: 'Sami ne lève pas les yeux de son plateau. Plusieurs élèves l’appellent « le roi de la cantine ». La photo a fait le tour de la classe.', next: 's17' },
      { id: 's13', type: 'message', app: 'papote', sender: 'me', thread: 'sami', content: { type: 'text', text: 'Léo voulait poster une photo de toi, je lui ai dit que c’était pas ok' }, next: 's14' },
      { id: 's14', type: 'message', app: 'papote', sender: 'sami', content: { type: 'text', text: 'merci… j’avais vu, j’osais rien dire' }, next: 's16' },
      { id: 's15', type: 'end', title: 'Le rire de trop', text: 'Un « J’aime », ça paraît peu. Mais pour Sami, chaque réaction montre que tout le monde rit de lui.\n\nPublier ou partager la photo de quelqu’un sans son accord porte atteinte à son droit à l’image.', discuss: ['Pourquoi un simple « J’aime » peut-il blesser ?', 'Qu’aurait pu faire l’élève à la place ?'] },
      { id: 's16', type: 'end', title: 'Tu as agi', text: 'Tu n’as pas laissé faire. Signaler, en parler, soutenir la personne visée : ce sont des gestes simples qui changent beaucoup.\n\nEn cas de harcèlement en ligne, on peut appeler le 3018 (gratuit, anonyme).', discuss: ['Était-ce facile d’agir ? Pourquoi ?', 'À qui peut-on en parler au collège ?'] },
      { id: 's17', type: 'end', title: 'Le silence', text: 'Ne rien dire, c’est souvent laisser la situation continuer. Les témoins ont un vrai pouvoir.', discuss: ['Pourquoi est-il si difficile de réagir dans un groupe ?', 'Que ressent Sami le lundi matin ?'] },
    ],
  };
}

/** Personnages proposés en un clic. */
export const CHARACTER_SUGGESTIONS = [
  { name: 'Maman', kind: 'person', role: 'Parent' },
  { name: 'Papa', kind: 'person', role: 'Parent' },
  { name: 'Les 4e B', kind: 'group', role: 'Groupe de la classe' },
  { name: 'Mme Martin (CPE)', kind: 'person', role: 'Adulte de confiance au collège' },
  { name: '3018', kind: 'service', role: 'Numéro national contre le harcèlement en ligne' },
  { name: 'Inconnu', kind: 'person', role: 'Compte inconnu' },
];
