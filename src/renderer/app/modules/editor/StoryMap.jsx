import React, { useMemo } from 'react';
import { Icon } from '../../icons.jsx';
import { Modal } from '../../ui.jsx';
import { byId, reachable, sceneNumber, summary, TYPE_INFO } from '../../story/model.js';
import { cut } from '../../utils.js';
import { choiceColor } from './next.jsx';

const W = 176;
const H = 58;
const GX = 74;
const GY = 18;
const LETTERS = 'ABCDEFGH';

/** Disposition en colonnes : chaque scène est placée après toutes celles qui y mènent. */
function layout(s) {
  const level = new Map();
  const order = [];
  const seen = new Set();
  const onStack = new Set();
  const back = new Set(); // liens qui reviennent en arrière (boucles)
  const dfs = (id) => {
    if (!byId(s, id)) return;
    if (onStack.has(id)) return;
    if (seen.has(id)) return;
    seen.add(id); onStack.add(id); order.push(id);
    const sc = byId(s, id);
    const targets = sc.choices?.length ? sc.choices.map((c) => c.next) : [sc.next];
    for (const t of targets.filter(Boolean)) { if (onStack.has(t)) back.add(`${id}>${t}`); else dfs(t); }
    onStack.delete(id);
  };
  if (s.start) dfs(s.start);
  s.scenes.forEach((sc) => { if (!seen.has(sc.id)) dfs(sc.id); });
  // Plus long chemin (sans les retours en arrière).
  for (const id of order) if (!level.has(id)) level.set(id, 0);
  for (let pass = 0; pass < order.length; pass++) {
    let moved = false;
    for (const id of order) {
      const sc = byId(s, id);
      const targets = sc.choices?.length ? sc.choices.map((c) => c.next) : [sc.next];
      for (const t of targets.filter(Boolean)) {
        if (back.has(`${id}>${t}`) || !level.has(t)) continue;
        if (level.get(t) < level.get(id) + 1) { level.set(t, level.get(id) + 1); moved = true; }
      }
    }
    if (!moved) break;
  }
  const cols = [];
  for (const id of order) { const l = level.get(id); (cols[l] ||= []).push(id); }
  const maxRows = Math.max(1, ...cols.map((c) => c?.length || 0));
  const pos = new Map();
  cols.forEach((col, x) => {
    const offset = ((maxRows - col.length) * (H + GY)) / 2;
    col.forEach((id, y) => pos.set(id, { x: 24 + x * (W + GX), y: 24 + offset + y * (H + GY) }));
  });
  return { pos, width: 48 + cols.length * (W + GX) - GX, height: 48 + maxRows * (H + GY) - GY };
}

export function StoryMap({ s, selected, onPick, onClose }) {
  const { pos, width, height } = useMemo(() => layout(s), [s]);
  const reach = useMemo(() => reachable(s), [s]);
  const edges = [];
  for (const sc of s.scenes) {
    const a = pos.get(sc.id);
    if (!a) continue;
    const list = sc.choices?.length ? sc.choices.map((c, i) => ({ to: c.next, i })) : sc.next ? [{ to: sc.next, i: null }] : [];
    for (const e of list) {
      const b = e.to && pos.get(e.to);
      if (!b) continue;
      const x1 = a.x + W; const y1 = a.y + H / 2; const x2 = b.x; const y2 = b.y + H / 2;
      const backward = x2 <= x1;
      const d = backward
        ? `M${x1},${y1} C${x1 + 60},${y1 + 90} ${x2 - 60},${y2 + 90} ${x2},${y2}`
        : `M${x1},${y1} C${x1 + GX / 2},${y1} ${x2 - GX / 2},${y2} ${x2},${y2}`;
      edges.push({ key: `${sc.id}-${e.i}-${e.to}`, d, choice: e.i, mid: { x: (x1 + x2) / 2, y: backward ? Math.max(y1, y2) + 68 : (y1 + y2) / 2 } });
    }
  }
  return (
    <Modal title="Vue d’ensemble de l’histoire" sub="Toutes les scènes et leurs liens, de gauche à droite. Cliquez sur une scène pour l’ouvrir." icon="route" size="xwide" onClose={onClose} bodyStyle={{ padding: 0 }}>
      <div className="map-legend">
        {Object.entries(TYPE_INFO).map(([t, i]) => <span key={t}><i style={{ background: i.color }} />{i.label}</span>)}
        <span><svg width="26" height="8"><path d="M0 4h26" stroke="var(--text3)" strokeWidth="2" strokeDasharray="5 3" /></svg>choix de l’élève</span>
      </div>
      <div className="map-scroll scroll">
        <svg width={width} height={height + 60} className="map-svg">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--text3)" /></marker>
          </defs>
          {edges.map((e) => (
            <g key={e.key}>
              <path d={e.d} fill="none" stroke={e.choice != null ? choiceColor(e.choice) : 'var(--border2)'} strokeWidth="2" strokeDasharray={e.choice != null ? '6 4' : ''} markerEnd="url(#arr)" />
              {e.choice != null && <g transform={`translate(${e.mid.x - 9},${e.mid.y - 9})`}><circle cx="9" cy="9" r="9" fill={choiceColor(e.choice)} /><text x="9" y="13" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{LETTERS[e.choice]}</text></g>}
            </g>
          ))}
          {s.scenes.map((sc) => {
            const p = pos.get(sc.id);
            if (!p) return null;
            const info = TYPE_INFO[sc.type];
            const on = sc.id === selected;
            return (
              <g key={sc.id} transform={`translate(${p.x},${p.y})`} className={`map-node ${on ? 'on' : ''} ${reach.has(sc.id) ? '' : 'loose'}`} onClick={() => onPick(sc.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onPick(sc.id); }}>
                <rect width={W} height={H} rx="10" fill="var(--surface)" stroke={on ? 'var(--accent)' : 'var(--border2)'} strokeWidth={on ? 2.5 : 1} />
                <rect width="6" height={H} rx="3" fill={info.color} />
                <text x="16" y="21" fontSize="10.5" fontWeight="700" fill={info.color}>n° {sceneNumber(sc.id)} · {info.label}{s.start === sc.id ? ' · départ' : ''}</text>
                <text x="16" y="40" fontSize="11.5" fill="var(--text)">{cut(summary(sc, s).replace(/✏️\s*/g, ''), 27)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="map-foot"><Icon name="info" />Les scènes grisées ne sont reliées à aucun chemin.</div>
    </Modal>
  );
}
