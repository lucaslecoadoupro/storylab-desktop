/**
 * Format des scénarios StoryLab (fichier public/scenarios/<id>/scenario.json).
 * Ce fichier ne contient que des types : il est partagé par le moteur,
 * les applis et le script de validation.
 */

export interface Scenario {
  id: string;
  title: string;
  /** Première scène jouée. */
  start: string;
  /** Durée de la séance en minutes (chrono en haut de l'écran). 45 par défaut. */
  duration?: number;
  /**
   * Identifiant d'une version plus douce de l'histoire, proposée par le bouton
   * « Je ne me sens pas bien ». Sans ce champ, le bouton propose pause et aide.
   */
  rescue?: string;
  /** Consigne de départ affichée à la fin du guide (ex. « Pour commencer, ouvre Papote. »). */
  hint?: string;
  /** Personnages et groupes de discussion, référencés par leur identifiant. */
  contacts: Record<string, { name: string }>;
  /**
   * Gestes libres de l'élève dans les messageries (hors choix de l'histoire).
   * Tous autorisés par défaut.
   */
  interactions?: { reactions?: boolean; forward?: boolean };
  scenes: Scene[];
}

/** Réaction emoji posée sur un message (`from` : contact ou `me`). */
export interface Reaction {
  from: string;
  emoji: string;
}

/** Conversation désignée par son appli et son identifiant (contact ou groupe). */
export interface ThreadRef {
  app: string;
  thread: string;
}

/** Pause (ms) entre le rallumage du téléphone éteint par un choix et la suite de l'histoire. */
export const SCREEN_OFF_COOLDOWN = 15000;

/** Emojis proposés par l'appui long sur un message. */
export const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export interface Content {
  /** `audio` : message vocal (lecteur avec onde et durée ; `text` = transcription). */
  type: 'text' | 'image' | 'audio';
  text?: string;
  /** Image ou son : chemin relatif au dossier du scénario (media/photo.webp) ou absolu. */
  src?: string;
  /** Message vocal : durée en secondes (affichée avant la lecture). */
  duration?: number;
  /** Texte alternatif, obligatoire pour une image utile. Sert aussi d'aperçu si src est absent. */
  alt?: string;
}

export interface Choice {
  label: string;
  next: string;
  /**
   * Messagerie : texte envoyé par le héros. Par défaut, le libellé — sauf si le
   * choix est une réaction ou un transfert. `false` pour ne rien envoyer.
   */
  say?: string | false;
  /** Le héros réagit au message avec cet emoji. */
  react?: string;
  /** Le héros transfère le contenu de la scène (message, photo, publication…) vers une autre conversation. */
  forward?: ThreadRef;
  /** Le héros fait une capture d'écran : elle s'ajoute à l'appli Photos. */
  capture?: boolean;
  /**
   * Effet sur le nombre de « J'aime » d'une publication (Pixa) : `add` est ajouté
   * (ou retiré s'il est négatif). `post` : identifiant de la scène de publication
   * visée ; par défaut, la publication de la scène elle-même.
   */
  likes?: { add: number; post?: string };
  /**
   * Le héros éteint son téléphone : écran noir jusqu'à ce que l'élève le rallume
   * (clic), puis l'histoire reprend après un temps de pause (`SCREEN_OFF_COOLDOWN`).
   */
  screenOff?: boolean;
  /**
   * Après ce choix, le téléphone ouvre cette appli (et, pour une messagerie, cette
   * conversation). Sans ce champ, il bascule tout seul quand la suite se passe
   * ailleurs (voir `switchTarget`) ; `false` empêche toute bascule.
   */
  open?: { app: string; thread?: string } | false;
}

interface SceneBase {
  id: string;
  /** Appli concernée (identifiant du catalogue : messages, papote, pixa, flash…). */
  app?: string;
  /** Délai en millisecondes avant l'apparition de la scène. */
  delay?: number;
  /**
   * `open` : la scène attend que l'élève ouvre l'appli concernée
   * (et, pour un message, la conversation concernée).
   */
  trigger?: 'auto' | 'open';
  /** Afficher une bannière si l'appli n'est pas ouverte (vrai par défaut). */
  notify?: boolean;
  /** Suite automatique… */
  next?: string;
  /** …ou décision de l'élève. */
  choices?: Choice[];
}

export interface MessageScene extends SceneBase {
  type: 'message';
  app: string;
  /** Identifiant du contact, ou `me` pour le héros, ou `system`. */
  sender: string;
  /** Conversation (par défaut : l'expéditeur, ou le seul interlocuteur si sender = me). */
  thread?: string;
  content: Content;
  /** Réactions des autres personnages, affichées avec une petite animation. */
  reactions?: Reaction[];
  /** Photo enregistrée automatiquement dans l'appli Photos. */
  save?: boolean;
}

export interface PublicationScene extends SceneBase {
  type: 'publication';
  app: string;
  author: string;
  place?: string;
  content: Content;
  likes?: number;
  comments?: { author: string; text: string }[];
  /** Clan : amis présents avec l'auteur (« avec Emma et Zoé »). */
  with?: string[];
}

export interface StoryScene extends SceneBase {
  type: 'story';
  app: string;
  author: string;
  frames: Content[];
}

export interface NotificationScene extends SceneBase {
  type: 'notification';
  app: string;
  title: string;
  text: string;
}

export interface MediaScene extends SceneBase {
  type: 'media';
  app?: string;
  content: Content;
}

export interface CallScene extends SceneBase {
  type: 'call';
  /** Enregistrement de l'appel (joué à la place de la lecture des répliques). */
  audio?: string;
  /**
   * Appli de l'appel : `phone` (par défaut) ou une messagerie (`papote`).
   * L'appel s'inscrit dans son journal (Récents / onglet Appels) et, pour une
   * messagerie, dans la conversation avec l'interlocuteur.
   */
  app?: string;
  /** Interlocuteur (contact ou simple nom, ex. « 3018 »). */
  caller: string;
  /** `outgoing` : c'est le héros qui appelle (par défaut : appel reçu). */
  direction?: 'incoming' | 'outgoing';
  /** Sans répliques : écran d'appel entrant. Avec répliques : appel en cours, sous-titré. */
  lines?: { speaker: string; text: string }[];
}

export interface ChoiceScene extends SceneBase {
  type: 'choice';
  prompt: string;
  choices: Choice[];
  /** Afficher d'abord une simple pastille « Faire un choix » (vrai par défaut). */
  minimized?: boolean;
}

export interface NarrationScene extends SceneBase {
  type: 'narration';
  /** Repère de temps ou de lieu : « 21 h 47 », « Le lendemain, au collège »… */
  title?: string;
  text?: string;
  /** Dialogue hors téléphone (ex. au bureau de la CPE). */
  lines?: { speaker: string; text: string }[];
  /** Enregistrement du récit : bouton « Écouter » pour ne pas avoir à lire. */
  audio?: string;
  /** Afficher d'abord une simple pastille (faux par défaut). */
  minimized?: boolean;
}

export interface EndScene extends SceneBase {
  type: 'end';
  title: string;
  /** Paragraphes séparés par une ligne vide. */
  text?: string;
  /** Questions pour le débat en classe. */
  discuss?: string[];
  /** Version audio du texte de fin (bouton « Écouter »). Sans elle, le téléphone lit le texte. */
  audio?: string;
}

export type Scene =
  | MessageScene
  | PublicationScene
  | StoryScene
  | NotificationScene
  | MediaScene
  | CallScene
  | ChoiceScene
  | NarrationScene
  | EndScene;

export type SceneType = Scene['type'];

/**
 * Choix effectifs d'une scène. Une narration sans choix attend un clic
 * sur « Continuer » : c'est un choix unique implicite.
 */
export function choicesOf(scene: Scene): Choice[] | undefined {
  if (scene.choices?.length) return scene.choices;
  if (scene.type === 'narration' && scene.next) return [{ label: 'Continuer', next: scene.next }];
  return undefined;
}

/** Progression d'une partie : suffit à reconstruire tout l'état du téléphone. */
export interface Progress {
  history: string[];
  /** Choix faits : identifiant de scène → index du choix. */
  choices: Record<string, number>;
}
