import React, { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { Modal } from '../../ui.jsx';
import { appInfo, appsFor, sceneNumber, summary, TYPE_INFO, TYPE_ORDER, whoName } from '../../story/model.js';
import { cut } from '../../utils.js';
import { useEditor } from './context.jsx';

// ── Icône d'appli du téléphone ──────────────────────────────────────────────
export function AppIcon({ id, size = 28 }) {
  const a = appInfo(id);
  return (
    <span className="app-icon" style={{ width: size, height: size, background: a.bg, borderRadius: size * 0.26 }} aria-hidden="true">
      {a.image ? <img src={a.image} alt="" /> : <Icon name={a.icon || 'smartphone'} />}
    </span>
  );
}

/** Choix de l'appli où se passe la scène : grosses tuiles avec icône et description. */
export function AppPicker({ type, value, onChange }) {
  const apps = appsFor(type);
  return (
    <div className="app-picker" role="radiogroup" data-tour="app-picker">
      {apps.map((a) => (
        <button key={a.id} type="button" role="radio" aria-checked={value === a.id} className={`app-tile ${value === a.id ? 'on' : ''}`} onClick={() => onChange(a.id)} title={a.desc}>
          <AppIcon id={a.id} size={34} />
          <span className="app-tile-name">{a.name}</span>
          <span className="app-tile-desc">{a.desc}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Choix d'un personnage : ceux de l'histoire, l'élève, « information »,
 * ou création d'un nouveau personnage.
 */
export function PersonSelect({ value, onChange, allowMe = false, allowSystem = false, allowNone = false, placeholder = '— Choisir —', filter, meLabel = 'L’élève (le héros)', id }) {
  const { s, createContact } = useEditor();
  const contacts = Object.entries(s.contacts || {}).filter(([cid]) => !filter || filter(cid));
  const known = !value || value === 'me' || value === 'system' || s.contacts?.[value];
  const change = async (v) => {
    if (v === '__new') { const nid = await createContact(); if (nid) onChange(nid); return; }
    onChange(v);
  };
  return (
    <select id={id} className={`select ${!value && !allowNone ? 'empty' : ''}`} value={value || ''} onChange={(e) => change(e.target.value)}>
      <option value="">{placeholder}</option>
      {allowMe && <option value="me">🙋 {meLabel}</option>}
      {allowSystem && <option value="system">ℹ️ Information (message du système)</option>}
      {contacts.map(([cid, c]) => <option key={cid} value={cid}>{c.name}</option>)}
      {!known && <option value={value}>{value} (personnage inconnu)</option>}
      <option value="__new">➕ Nouveau personnage…</option>
    </select>
  );
}

/** Suite d'une scène ou d'un choix : une scène existante, ou une nouvelle. */
export function TargetSelect({ value, onChange, onCreate, exclude, placeholder = '— Choisir la suite —' }) {
  const { s } = useEditor();
  const change = (v) => {
    if (v === '__new') onCreate?.();
    else if (v === '__end') onCreate?.('end');
    else onChange(v);
  };
  const exists = !value || s.scenes.some((sc) => sc.id === value);
  return (
    <select className={`select target-select ${!value ? 'empty' : ''}`} value={value || ''} onChange={(e) => change(e.target.value)}>
      <option value="">{placeholder}</option>
      <optgroup label="Créer">
        <option value="__new">➕ Une nouvelle scène…</option>
        <option value="__end">🏁 Une nouvelle fin</option>
      </optgroup>
      <optgroup label="Aller à une scène existante">
        {s.scenes.filter((sc) => sc.id !== exclude).map((sc) => (
          <option key={sc.id} value={sc.id}>n° {sceneNumber(sc.id)} · {TYPE_INFO[sc.type]?.label} — {cut(summary(sc, s), 46)}</option>
        ))}
      </optgroup>
      {!exists && <option value={value}>Scène supprimée</option>}
    </select>
  );
}

// ── Choix du type de scène ──────────────────────────────────────────────────
const GROUPS = [
  { id: 'phone', title: 'Dans le téléphone', sub: 'Ce que l’élève voit apparaître sur son écran' },
  { id: 'outside', title: 'Hors du téléphone', sub: 'Pour raconter et faire décider' },
  { id: 'end', title: 'Terminer un chemin', sub: '' },
];

export function TypePicker({ onPick, onClose }) {
  const [hover, setHover] = useState(null);
  return (
    <Modal title="Quelle scène ajouter ?" sub="Choisissez ce que l’élève va vivre ensuite. Vous pourrez changer de type plus tard." icon="plus" size="wide" onClose={onClose}>
      <div className="type-picker">
        {GROUPS.map((g) => (
          <div key={g.id} className="tp-group">
            <div className="tp-group-title">{g.title}{g.sub && <span> — {g.sub}</span>}</div>
            <div className="tp-grid">
              {TYPE_ORDER.filter((t) => TYPE_INFO[t].group === g.id).map((t) => {
                const info = TYPE_INFO[t];
                return (
                  <button key={t} className="tp-card" onClick={() => onPick(t)} onMouseEnter={() => setHover(t)} onFocus={() => setHover(t)} data-type={t}>
                    <span className="tp-icon" style={{ background: info.color }}><Icon name={info.icon} /></span>
                    <span className="tp-name">{info.label}</span>
                    <span className="tp-help">{info.help}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="tp-when">
          <Icon name="bulb" />
          <span>{hover ? <><b>{TYPE_INFO[hover].label} :</b> {TYPE_INFO[hover].when}</> : 'Survolez un type pour savoir quand l’utiliser.'}</span>
        </div>
      </div>
    </Modal>
  );
}

// ── Petite fenêtre « saisir un nom » ────────────────────────────────────────
export function PromptModal({ title, label, placeholder, icon = 'edit', initial = '', confirmLabel = 'Créer', onDone }) {
  const [v, setV] = useState(initial);
  return (
    <Modal title={title} icon={icon} onClose={() => onDone(null)}
      footer={<>
        <button className="btn" onClick={() => onDone(null)}>Annuler</button>
        <button className="btn btn-primary" disabled={!v.trim()} onClick={() => onDone(v)}>{confirmLabel}</button>
      </>}>
      <label className="field">
        <span className="field-label">{label}</span>
        <input className="input" autoFocus value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) onDone(v); }} />
      </label>
    </Modal>
  );
}

// ── Emojis ──────────────────────────────────────────────────────────────────
export const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🙄', '😱', '🙏'];
export function EmojiRow({ value, onChange }) {
  return (
    <div className="emoji-row">
      {EMOJIS.map((e) => <button key={e} type="button" className={`emoji-btn ${value === e ? 'on' : ''}`} onClick={() => onChange(value === e ? undefined : e)} aria-pressed={value === e}>{e}</button>)}
    </div>
  );
}

export { whoName };
