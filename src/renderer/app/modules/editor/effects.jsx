/**
 * Effets du téléphone (même format que le moteur, shared/types.ts) :
 * à l'apparition d'une scène ou quand l'élève fait un choix, et compte à
 * rebours d'une décision.
 */
import React from 'react';
import { Field, Seg } from '../../ui.jsx';
import { STORY_APPS } from '../../story/model.js';
import { PersonSelect } from './pickers.jsx';

export const FREEZE_TEXT = 'Pendant que tu hésitais, 12 personnes ont vu la publication.';

export const EFFECT_INFO = {
  capture: { label: '📸 Capture d’écran', help: 'Flash et vignette « Capture d’écran » ; la capture s’ajoute à l’appli Photos.' },
  hack: { label: '🕵️ Le téléphone se fait pirater', help: 'L’écran glitche, des lignes défilent, puis une alerte « Activité suspecte ». L’histoire attend que l’élève l’ait lue.' },
  storm: { label: '🌪 Tempête de notifications', help: 'Des notifications s’empilent de plus en plus vite, puis se regroupent. La pastille de l’appli grimpe.' },
  ghost: { label: '👻 Message fantôme', help: 'Le message est supprimé sous les yeux de l’élève ; quelques secondes après, il revient en capture d’écran envoyée par quelqu’un d’autre.' },
  crack: { label: '💥 L’écran se fissure', help: 'Pour une conséquence grave : une fissure traverse l’écran quelques secondes. Le téléphone reste utilisable.' },
  freeze: { label: '🧊 Le téléphone se fige', help: 'Quand l’élève choisit, plus rien ne répond pendant 2 s, l’écran devient gris et affiche une phrase, puis le choix s’applique.' },
};

/** Effets proposés : à l'apparition d'une scène, ou pour un choix (la capture d'un choix a déjà son interrupteur). */
export function effectsFor(where, scene) {
  if (where === 'choice') return ['hack', 'storm', 'crack', 'freeze'];
  const out = ['capture', 'hack', 'storm', 'crack'];
  if (scene.type === 'message' && scene.sender !== 'me' && scene.sender !== 'system') out.splice(3, 0, 'ghost');
  return out;
}

/** Choix d'un effet et de ses réglages. `value` : l'effet, `onChange(effet | undefined)`. */
export function EffectEditor({ value, onChange, where, scene, s }) {
  const options = effectsFor(where, scene);
  const sender = scene.type === 'message' ? scene.sender : undefined;
  const pick = (type) => {
    if (!type) return onChange(undefined);
    if (type === 'ghost') return onChange({ type, by: Object.keys(s.contacts || {}).find((id) => id !== sender) || '' });
    if (type === 'storm') return onChange({ type, app: 'pixa', count: 12 });
    if (type === 'hack') return onChange({ type, app: STORY_APPS.some((a) => a.id === scene.app) ? scene.app : 'papote' });
    if (type === 'freeze') return onChange({ type, text: FREEZE_TEXT });
    return onChange({ type });
  };
  const set = (patch) => value && onChange({ ...value, ...patch });

  return (
    <div className="stack" style={{ gap: '.6rem' }}>
      <Field label={where === 'scene' ? 'Effet à l’apparition de la scène' : 'Effet quand l’élève fait ce choix'}>
        <select className="select" value={value?.type || ''} onChange={(e) => pick(e.target.value)}>
          <option value="">Aucun effet</option>
          {options.map((t) => <option key={t} value={t}>{EFFECT_INFO[t].label}</option>)}
          {value && !options.includes(value.type) && <option value={value.type}>{EFFECT_INFO[value.type]?.label || value.type} (pas possible ici)</option>}
        </select>
      </Field>
      {value && <p className="tiny-note">{EFFECT_INFO[value.type]?.help}</p>}

      {value?.type === 'ghost' && (
        <Field label="Qui renvoie la capture d’écran ?" help="Dans un groupe, la capture revient dans le groupe ; sinon dans la conversation avec cette personne.">
          <PersonSelect value={value.by} filter={(id) => id !== sender} onChange={(by) => set({ by })} />
        </Field>
      )}
      {(value?.type === 'hack' || value?.type === 'storm') && (
        <Field label={value.type === 'hack' ? 'Compte piraté' : 'Appli des notifications'}>
          <select className="select" value={value.app || (value.type === 'storm' ? 'pixa' : 'papote')} onChange={(e) => set({ app: e.target.value })}>
            {STORY_APPS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}
      {value?.type === 'hack' && (
        <Field label="Texte de l’alerte (facultatif)" hint="Vide : « Quelqu’un s’est connecté à ton compte … depuis un appareil inconnu… ».">
          <textarea className="input" rows={2} value={value.text || ''} onChange={(e) => set({ text: e.target.value || undefined })} />
        </Field>
      )}
      {value?.type === 'storm' && (
        <>
          <Field label="Nombre de notifications (3 à 40)" style={{ maxWidth: 260 }}>
            <input type="number" className="input input-num" min={3} max={40} value={value.count ?? 12} onChange={(e) => set({ count: Math.max(3, Math.min(40, Math.round(Number(e.target.value)) || 12)) })} />
          </Field>
          <Field label="Textes des notifications (facultatif)" hint="Une ligne par notification ; {n} est remplacé par un nom. Vide : commentaires, partages, mentions…">
            <textarea className="input" rows={3} value={value.text || ''} placeholder={'{n} a partagé ta photo\n{n} : « c’est toi ?? »'} onChange={(e) => set({ text: e.target.value || undefined })} />
          </Field>
        </>
      )}
      {value?.type === 'freeze' && (
        <Field label="Phrase affichée sur l’écran gris">
          <textarea className="input" rows={2} value={value.text || ''} placeholder={FREEZE_TEXT} onChange={(e) => set({ text: e.target.value })} />
        </Field>
      )}
    </div>
  );
}

/** Compte à rebours d'une décision : à zéro, l'histoire fait le choix prévu. */
export function CountdownEditor({ value, onChange, labels }) {
  const on = !!value;
  return (
    <div className="stack" style={{ gap: '.6rem' }}>
      <Seg value={on ? 'on' : 'off'} onChange={(v) => onChange(v === 'on' ? { seconds: 15 } : undefined)}
        options={[{ value: 'off', label: 'Pas de limite de temps' }, { value: 'on', label: '⏱ Compte à rebours' }]} />
      {on && (
        <div className="row-wrap" style={{ gap: '.6rem', alignItems: 'flex-end' }}>
          <Field label="Secondes pour décider" style={{ maxWidth: 200 }}>
            <input type="number" className="input input-num" min={3} max={300} value={value.seconds} onChange={(e) => onChange({ ...value, seconds: Math.max(3, Math.min(300, Math.round(Number(e.target.value)) || 15)) })} />
          </Field>
          <Field label="À zéro, l’histoire choisit…" style={{ flex: 1, minWidth: 220 }}>
            <select className="select" value={value.choice ?? ''} onChange={(e) => onChange({ ...value, ...(e.target.value === '' ? { choice: undefined } : { choice: Number(e.target.value) }) })}>
              <option value="">le dernier choix</option>
              {labels.map((l, i) => <option key={i} value={i}>{`${'ABCDEFGH'[i]}. ${(l || 'Choix sans texte').replace(/^✏️\s*/, '')}`}</option>)}
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}
