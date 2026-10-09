import React from 'react';
import { Field } from '../../ui.jsx';

/**
 * Option d'une fin : elle n'apparaît pas tant que l'élève n'a pas lu au moins
 * X messages de l'histoire (ou tous ceux reçus, s'il y en a moins).
 */
export function MinReadField({ value, onChange }) {
  const on = !!value;
  return (
    <Field as="div" label="Ne pas afficher cette fin trop tôt" hint="La fin attend que l’élève ait lu au moins ce nombre de messages (ou tous ceux reçus s’il y en a moins). Utile pour qu’il ne rate pas la fin d’une conversation.">
      <div className="row" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
        <label className="row" style={{ gap: '.35rem', fontSize: '.86rem' }}>
          <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked ? value || 5 : undefined)} />
          Pas avant
        </label>
        <input className="input" type="number" min={1} max={200} disabled={!on} style={{ width: 80 }} value={on ? value : ''} aria-label="Nombre de messages lus"
          onChange={(e) => { const v = Math.round(Number(e.target.value)); onChange(Number.isFinite(v) && v > 0 ? Math.min(200, v) : undefined); }} />
        <span style={{ fontSize: '.86rem' }}>messages lus</span>
      </div>
    </Field>
  );
}
