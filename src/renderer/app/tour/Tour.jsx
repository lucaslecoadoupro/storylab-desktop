import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';
import { TourCtx } from '../nav.jsx';
import { useStore } from '../store.jsx';
import { TOURS } from './tours.js';

const PAD = 8;
const BUBBLE_W = 340;

/** Cherche l'élément visé (il peut apparaître après une navigation). */
function waitFor(selector, ms = 2500) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el && el.getBoundingClientRect().width > 0) resolve(el);
      else if (Date.now() - t0 > ms) resolve(null);
      else setTimeout(tick, 80);
    };
    tick();
  });
}

function placeBubble(rect, place, bh) {
  const vw = window.innerWidth; const vh = window.innerHeight;
  if (!rect) return { left: (vw - BUBBLE_W) / 2, top: Math.max(40, (vh - bh) / 2) };
  let left; let top; let fits = false;
  const order = [place, 'bottom', 'right', 'left', 'top'];
  for (const p of order) {
    if (p === 'bottom') { left = rect.left + rect.width / 2 - BUBBLE_W / 2; top = rect.bottom + PAD + 12; if (top + bh < vh - 10) { fits = true; break; } }
    if (p === 'top') { left = rect.left + rect.width / 2 - BUBBLE_W / 2; top = rect.top - PAD - 12 - bh; if (top > 10) { fits = true; break; } }
    if (p === 'right') { left = rect.right + PAD + 14; top = rect.top; if (left + BUBBLE_W < vw - 10) { fits = true; break; } }
    if (p === 'left') { left = rect.left - PAD - 14 - BUBBLE_W; top = rect.top; if (left > 10) { fits = true; break; } }
  }
  // Élément trop grand (une zone entière) : la bulle se pose dedans, en haut à droite.
  if (!fits) { left = rect.right - BUBBLE_W - 24; top = rect.top + 24; }
  return { left: Math.max(12, Math.min(vw - BUBBLE_W - 12, left)), top: Math.max(12, Math.min(vh - bh - 12, top)) };
}

/**
 * Visites guidées : un projecteur sur un élément, une bulle d'explication,
 * « Suivant / Précédent ». Chaque visite n'est proposée automatiquement qu'une fois.
 */
export function TourProvider({ children, ctx }) {
  const { mutate } = useStore();
  const [active, setActive] = useState(null); // { id, i }
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const bubble = useRef(null);
  const [bh, setBh] = useState(180);
  const elRef = useRef(null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const steps = active ? TOURS[active.id] : null;
  const step = steps?.[active.i];

  const finish = useCallback(() => {
    if (active) mutate((d) => { d.settings.tours[active.id] = true; if (active.id === 'main') d.settings.tours.editor = true; });
    setActive(null); setRect(null); elRef.current = null;
  }, [active, mutate]);

  const start = useCallback((id) => { if (TOURS[id]) setActive({ id, i: 0 }); }, []);
  const go = useCallback((d) => setActive((a) => (a ? { ...a, i: Math.max(0, Math.min(TOURS[a.id].length - 1, a.i + d)) } : a)), []);

  // Préparation de l'étape : navigation éventuelle, puis recherche de l'élément.
  useEffect(() => {
    if (!step) return undefined;
    let alive = true;
    setReady(false);
    (async () => {
      if (step.before) { step.before(ctxRef.current); await new Promise((r) => setTimeout(r, 250)); }
      const el = step.target ? await waitFor(step.target) : null;
      if (!alive) return;
      elRef.current = el;
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 60));
      }
      if (!alive) return;
      setRect(el ? el.getBoundingClientRect() : null);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [step]);

  // Suit l'élément (redimensionnement, défilement).
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => { if (elRef.current?.isConnected) setRect(elRef.current.getBoundingClientRect()); }, 250);
    const k = (e) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k);
    return () => { clearInterval(t); window.removeEventListener('keydown', k); };
  }, [active, finish, go]);

  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight); }, [step, ready]);

  const value = useMemo(() => ({ start, active: active?.id || null }), [start, active]);
  const last = steps && active.i === steps.length - 1;
  const pos = placeBubble(rect, step?.place || 'bottom', bh);

  return (
    <TourCtx.Provider value={value}>
      {children}
      {step && createPortal(
        <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
          <div className="tour-block" onClick={(e) => e.stopPropagation()} />
          {rect ? (
            <div className="tour-spot" style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />
          ) : <div className="tour-dim" />}
          <div ref={bubble} className={`tour-bubble ${ready ? 'in' : ''}`} style={{ left: pos.left, top: pos.top, width: BUBBLE_W }}>
            <div className="tour-count">{active.i + 1} / {steps.length}</div>
            <div className="tour-title" id="tour-title">{step.title}</div>
            <div className="tour-text">{step.text}</div>
            <div className="tour-nav">
              <button className="btn btn-quiet btn-sm" onClick={finish}>{last ? 'Fermer' : 'Passer la visite'}</button>
              <span className="spacer" />
              {active.i > 0 && <button className="btn btn-sm" onClick={() => go(-1)}><Icon name="arrowLeft" />Précédent</button>}
              {last ? <button className="btn btn-primary btn-sm" onClick={finish} autoFocus><Icon name="check" />Terminer</button>
                : <button className="btn btn-primary btn-sm" onClick={() => go(1)} autoFocus>Suivant<Icon name="arrowRight" /></button>}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </TourCtx.Provider>
  );
}
