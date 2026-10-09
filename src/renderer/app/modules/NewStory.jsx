import React, { useState } from 'react';
import { Icon } from '../icons.jsx';
import { Field, Modal } from '../ui.jsx';
import { newStoryRecord, useStore } from '../store.jsx';
import { useNav } from '../nav.jsx';
import { buildWithEnds, ENDS_MAX, ENDS_MIN, EXAMPLE_META, exampleStory, LEVELS, shapeFor, SKELETONS, THEMES } from '../story/templates.js';

/** Petit schéma d'un squelette : nombre de scènes par « étage ». */
function Shape({ shape }) {
  const w = 120; const h = 56;
  const rows = shape.length;
  const pts = shape.map((n, r) => Array.from({ length: n }, (_, i) => ({ x: ((i + 1) * w) / (n + 1), y: 8 + (r * (h - 16)) / Math.max(1, rows - 1) })));
  return (
    <svg width={w} height={h} className="shape" aria-hidden="true">
      {pts.slice(1).map((row, r) => row.map((p, i) => {
        const parents = pts[r];
        const q = parents[Math.min(parents.length - 1, Math.floor((i * parents.length) / row.length))];
        return <line key={`${r}-${i}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke="currentColor" strokeWidth="1.6" opacity=".45" />;
      }))}
      {pts.flat().map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="currentColor" />)}
    </svg>
  );
}

export function NewStoryModal({ onClose }) {
  const { mutate } = useStore();
  const nav = useNav();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [niveau, setNiveau] = useState('');
  const [theme, setTheme] = useState('');
  const [skeleton, setSkeleton] = useState('deux-fins');
  const [ends, setEnds] = useState(4);

  const create = () => {
    const sk = SKELETONS.find((x) => x.id === skeleton);
    const name = title.trim() || 'Nouvelle histoire';
    const scenario = skeleton === 'sur-mesure' ? buildWithEnds(name, ends) : sk.build(name);
    const characters = {};
    for (const id of Object.keys(scenario.contacts)) characters[id] = { kind: id === 'groupe' ? 'group' : 'person', role: id === 'groupe' ? 'Groupe de la classe' : '' };
    const rec = newStoryRecord(scenario, { niveau, theme, characters });
    mutate((d) => { d.stories.unshift(rec); });
    onClose();
    nav({ page: 'story', uid: rec.uid, step: 'projet' });
  };

  return (
    <Modal title="Nouvelle histoire" sub={step === 0 ? 'Étape 1 sur 2 · Votre idée' : 'Étape 2 sur 2 · Point de départ'} icon="sparkles" size="wide" onClose={onClose}
      footer={step === 0 ? <>
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" disabled={!title.trim()} onClick={() => setStep(1)}>Continuer<Icon name="arrowRight" /></button>
      </> : <>
        <button className="btn" onClick={() => setStep(0)}><Icon name="arrowLeft" />Retour</button>
        <button className="btn btn-primary" onClick={create}><Icon name="check" />Créer l’histoire</button>
      </>}>
      {step === 0 ? (
        <div className="stack">
          <Field label="Titre de l’histoire" required hint="Vous pourrez le changer plus tard. Les élèves ne le voient pas.">
            <input className="input input-lg" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) setStep(1); }} placeholder="Ex. La rumeur du vendredi" />
          </Field>
          <Field label="Pour quel niveau ?" as="div">
            <div className="chips">{LEVELS.map((l) => <button key={l} type="button" className={`chip ${niveau === l ? 'on' : ''}`} onClick={() => setNiveau(niveau === l ? '' : l)}>{niveau === l && <Icon name="check" />}{l}</button>)}</div>
          </Field>
          <Field label="Sur quel thème ?" as="div">
            <div className="theme-grid">{THEMES.map((t) => <button key={t.id} type="button" className={`theme-card ${theme === t.id ? 'on' : ''}`} onClick={() => setTheme(theme === t.id ? '' : t.id)}><Icon name={t.icon} /><span>{t.label}</span></button>)}</div>
          </Field>
        </div>
      ) : (
        <div className="stack">
          <p className="muted" style={{ fontSize: '.86rem' }}>Partez d’une structure prête à remplir : les textes marqués ✏️ sont à réécrire. Vous pourrez tout modifier, ajouter des scènes et des chemins.</p>
          <div className="skeletons">
            {SKELETONS.map((sk) => (
              <button key={sk.id} type="button" className={`skeleton ${skeleton === sk.id ? 'on' : ''}`} onClick={() => setSkeleton(sk.id)}>
                <Shape shape={sk.shape} />
                <span className="sk-title">{sk.title}</span>
                <span className="sk-sub">{sk.sub}</span>
                {skeleton === sk.id && <span className="sk-check"><Icon name="check" /></span>}
              </button>
            ))}
            <div role="button" tabIndex={0} className={`skeleton ${skeleton === 'sur-mesure' ? 'on' : ''}`} onClick={() => setSkeleton('sur-mesure')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSkeleton('sur-mesure'); }}>
              <Shape shape={shapeFor(ends)} />
              <span className="sk-title">Sur mesure : {ends} fins</span>
              <span className="sk-sub">Choisissez le nombre de fins : les décisions sont créées pour vous.</span>
              <span className="row ends-stepper" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="btn btn-sm btn-icon" aria-label="Une fin de moins" disabled={ends <= ENDS_MIN} onClick={() => { setEnds(Math.max(ENDS_MIN, ends - 1)); setSkeleton('sur-mesure'); }}>−</button>
                <input className="input" type="number" min={ENDS_MIN} max={ENDS_MAX} value={ends} aria-label="Nombre de fins" style={{ width: 64, textAlign: 'center' }}
                  onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setEnds(Math.max(ENDS_MIN, Math.min(ENDS_MAX, Math.round(v)))); setSkeleton('sur-mesure'); }} />
                <button type="button" className="btn btn-sm btn-icon" aria-label="Une fin de plus" disabled={ends >= ENDS_MAX} onClick={() => { setEnds(Math.min(ENDS_MAX, ends + 1)); setSkeleton('sur-mesure'); }}>+</button>
              </span>
              {skeleton === 'sur-mesure' && <span className="sk-check"><Icon name="check" /></span>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Ajoute l'histoire d'exemple (ou rouvre celle qui existe) et l'ouvre. */
export function useOpenExample() {
  const { data, mutate } = useStore();
  const nav = useNav();
  return (step = 'scenes', scene) => {
    const existing = data.stories.find((s) => s.example);
    if (existing) { nav({ page: 'story', uid: existing.uid, step, scene }); return existing.uid; }
    const rec = newStoryRecord(exampleStory(), JSON.parse(JSON.stringify(EXAMPLE_META)));
    rec.example = true;
    rec.step = step;
    mutate((d) => { d.stories.push(rec); });
    nav({ page: 'story', uid: rec.uid, step, scene });
    return rec.uid;
  };
}
