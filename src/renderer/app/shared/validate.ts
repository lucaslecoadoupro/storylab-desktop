/**
 * Validation d'un scénario. Sans dépendance : utilisée par le moteur
 * dans le navigateur et par `npm run validate` sous Node.
 */
import type { PhoneEffect, Scenario, Scene } from './types.ts';

const EFFECTS = ['capture', 'hack', 'storm', 'ghost', 'crack', 'freeze'];

const TYPES = ['message', 'publication', 'story', 'notification', 'media', 'call', 'choice', 'narration', 'end'];
const NEEDS_APP = ['message', 'publication', 'story', 'notification'];
/** Applis qui ont des conversations (même liste que MESSAGING_APPS du moteur). */
const MESSAGING = ['messages', 'papote'];
const CALL_APPS = ['phone', ...MESSAGING];
/** Applis avec un fil de publications. */
const FEEDS = ['pixa', 'clan'];

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateScenario(data: unknown, knownApps?: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const s = data as Partial<Scenario>;

  if (!s || typeof s !== 'object') return { errors: ['Le fichier ne contient pas d’objet JSON.'], warnings };
  if (!s.id) errors.push('Champ "id" manquant.');
  if (!s.title) errors.push('Champ "title" manquant.');
  if (!Array.isArray(s.scenes) || s.scenes.length === 0) {
    errors.push('Aucune scène dans "scenes".');
    return { errors, warnings };
  }

  const contacts = s.contacts ?? {};
  const byId = new Map<string, Scene>();
  for (const scene of s.scenes) {
    if (!scene?.id) { errors.push('Une scène n’a pas d’"id".'); continue; }
    if (byId.has(scene.id)) errors.push(`Identifiant en double : ${scene.id}`);
    byId.set(scene.id, scene);
  }
  if (!s.start || !byId.has(s.start)) errors.push(`Scène de départ introuvable : ${s.start}`);

  const person = (id: string | undefined, where: string) => {
    if (id && id !== 'me' && id !== 'system' && !contacts[id]) warnings.push(`${where} : contact "${id}" non déclaré dans "contacts".`);
  };
  const effect = (e: PhoneEffect, where: string) => {
    if (!e || !EFFECTS.includes(e.type)) { errors.push(`${where} : effet du téléphone inconnu "${e?.type}".`); return; }
    if (e.app && knownApps && !knownApps.includes(e.app)) errors.push(`${where} : effet sur une appli inconnue "${e.app}".`);
    if (e.type === 'ghost') {
      if (!e.by) errors.push(`${where} : message fantôme sans personnage qui renvoie la capture ("by").`);
      else person(e.by, where);
    }
    if (e.type === 'storm' && e.count !== undefined && (!Number.isInteger(e.count) || e.count < 3 || e.count > 40)) errors.push(`${where} : tempête de notifications entre 3 et 40 notifications.`);
  };

  for (const scene of byId.values()) {
    const at = `Scène ${scene.id}`;
    if (!TYPES.includes(scene.type)) { errors.push(`${at} : type inconnu "${scene.type}".`); continue; }
    if (NEEDS_APP.includes(scene.type) && !scene.app) errors.push(`${at} : champ "app" obligatoire.`);
    if (scene.app && knownApps && !knownApps.includes(scene.app)) errors.push(`${at} : appli inconnue "${scene.app}".`);

    if (scene.trigger === 'open' && !scene.app) errors.push(`${at} : "trigger": "open" demande une "app".`);

    const targets = [scene.next, ...(scene.choices ?? []).map((c) => c.next)].filter(Boolean) as string[];
    for (const t of targets) if (!byId.has(t)) errors.push(`${at} : renvoie vers une scène inexistante "${t}".`);
    if (scene.type !== 'end' && targets.length === 0) errors.push(`${at} : ni "next" ni "choices" (impasse).`);
    if (scene.type === 'end' && targets.length) warnings.push(`${at} : une fin ne devrait pas avoir de suite.`);
    scene.choices?.forEach((c, i) => {
      const n = `${at} : le choix ${i + 1}`;
      if (!c.label) errors.push(`${n} n’a pas de libellé.`);
      // Sans ce contrôle, un choix sans suite passait la validation puis bloquait l'histoire.
      if (!c.next) errors.push(`${n} ne mène à aucune scène (suite à choisir).`);
      if (c.forward) {
        if (!MESSAGING.includes(c.forward.app)) errors.push(`${n} transfère vers une appli sans conversations "${c.forward.app}".`);
        if (!c.forward.thread) errors.push(`${n} transfère sans préciser la conversation.`);
        else person(c.forward.thread, n);
        if (!['message', 'publication', 'story', 'media'].includes(scene.type)) warnings.push(`${n} : rien à transférer dans une scène « ${scene.type} ».`);
      }
      if (c.open && knownApps && !knownApps.includes(c.open.app)) errors.push(`${n} ouvre une appli inconnue "${c.open.app}".`);
      if (c.likes) {
        if (typeof c.likes.add !== 'number' || !Number.isFinite(c.likes.add)) errors.push(`${n} : effet « J’aime » sans nombre valide ("likes.add").`);
        const post = c.likes.post ? byId.get(c.likes.post) : scene;
        if (c.likes.post && !post) errors.push(`${n} : effet « J’aime » sur une scène inexistante "${c.likes.post}".`);
        else if (post && post.type !== 'publication') errors.push(`${n} : effet « J’aime » sans publication visée (préciser "likes.post").`);
      }
      if (c.react && scene.type !== 'message') warnings.push(`${n} : une réaction ne s’affiche que sur un message.`);
      if (c.effect) {
        effect(c.effect, n);
        if (c.effect.type === 'ghost') errors.push(`${n} : le message fantôme se règle sur une scène « message », pas sur un choix.`);
      }
    });

    if (scene.effect) {
      effect(scene.effect, at);
      if (scene.effect.type === 'ghost' && scene.type !== 'message') errors.push(`${at} : le message fantôme ne marche que sur une scène « message ».`);
      if (scene.effect.type === 'ghost' && scene.type === 'message' && scene.sender === 'me') errors.push(`${at} : le message fantôme doit être envoyé par un personnage, pas par le héros.`);
      if (scene.effect.type === 'freeze') errors.push(`${at} : le téléphone qui se fige se règle sur un choix (au moment où l’élève choisit).`);
    }
    if (scene.countdown) {
      const choices = scene.choices ?? [];
      const sec = scene.countdown.seconds;
      if (!choices.length) errors.push(`${at} : un compte à rebours demande des choix.`);
      if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 3) errors.push(`${at} : compte à rebours trop court ou invalide (3 secondes au moins).`);
      const i = scene.countdown.choice;
      if (i !== undefined && (!Number.isInteger(i) || i < 0 || i >= choices.length)) errors.push(`${at} : le compte à rebours vise un choix qui n’existe pas (n° ${Number(i) + 1}).`);
    }
    if (scene.type === 'end' && scene.minRead !== undefined && (!Number.isInteger(scene.minRead) || scene.minRead < 1)) {
      errors.push(`${at} : « pas avant X messages lus » doit être un nombre entier positif.`);
    }

    switch (scene.type) {
      case 'message':
        person(scene.sender, at);
        // Ailleurs, le message n'est jamais affiché et l'histoire reste bloquée.
        if (scene.app && !MESSAGING.includes(scene.app)) errors.push(`${at} : un message doit arriver dans Messages ou Papote, pas dans "${scene.app}" (sinon l'histoire se bloque).`);
        if (!scene.content) errors.push(`${at} : champ "content" manquant.`);
        if (scene.sender === 'me' && !scene.thread) errors.push(`${at} : un message du héros doit préciser "thread".`);
        scene.reactions?.forEach((r) => { person(r.from, at); if (!r.emoji) errors.push(`${at} : réaction sans emoji.`); });
        break;
      case 'publication':
        person(scene.author, at);
        scene.with?.forEach((w) => person(w, at));
        if (scene.app && !FEEDS.includes(scene.app)) errors.push(`${at} : une publication s'affiche dans Pixa ou Clan, pas dans "${scene.app}".`);
        break;
      case 'story': person(scene.author, at); if (!scene.frames?.length) errors.push(`${at} : "frames" vide.`); break;
      case 'call':
        person(scene.caller, at);
        if (scene.app && !CALL_APPS.includes(scene.app)) errors.push(`${at} : un appel passe par Téléphone ou une messagerie, pas "${scene.app}".`);
        break;
      case 'notification':
        if (scene.choices?.length) errors.push(`${at} : une notification ne peut pas proposer de choix (le téléphone ne les affiche pas) : mets-les dans un récit juste après.`);
        break;
      case 'choice': if (!scene.choices?.length) errors.push(`${at} : un choix doit proposer "choices".`); break;
      case 'narration': if (!scene.text && !scene.lines?.length) errors.push(`${at} : une narration doit avoir "text" ou "lines".`); break;
      case 'end': if (!scene.title) errors.push(`${at} : une fin doit avoir un "title".`); break;
    }
    if ('content' in scene && scene.content?.type === 'audio') {
      if (!scene.content.src && !scene.content.text) errors.push(`${at} : message vocal sans enregistrement ni transcription.`);
      else if (!scene.content.src) warnings.push(`${at} : message vocal sans enregistrement (la transcription sera lue par le téléphone).`);
    }
    if ('content' in scene && scene.content?.type === 'image' && !scene.content.alt) {
      warnings.push(`${at} : image sans texte alternatif "alt".`);
    }
  }

  // Scènes jamais atteintes depuis le départ.
  const seen = new Set<string>();
  const stack = s.start ? [s.start] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    const sc = byId.get(id)!;
    if (sc.next) stack.push(sc.next);
    sc.choices?.forEach((c) => stack.push(c.next));
  }
  for (const id of byId.keys()) if (!seen.has(id)) warnings.push(`Scène ${id} jamais atteinte.`);
  if (![...seen].some((id) => byId.get(id)?.type === 'end')) errors.push('Aucune fin atteignable.');

  return { errors, warnings };
}
