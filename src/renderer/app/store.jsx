import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData } from './platform.js';
import { deep, debounce, uid } from './utils.js';

export const DATA_VERSION = 1;

export function emptyData() {
  return {
    version: DATA_VERSION,
    profile: { prenom: '', nom: '', etablissement: '', discipline: '', email: '' },
    stories: [],
    settings: {
      theme: 'light',
      welcomed: false, // écran de bienvenue vu
      tours: {}, // visites guidées terminées : { home: true, editor: true… }
      dismissedTips: {},
    },
  };
}

function migrate(d) {
  const base = emptyData();
  if (!d || typeof d !== 'object') return base;
  return {
    ...base, ...d,
    profile: { ...base.profile, ...(d.profile || {}) },
    settings: { ...base.settings, ...(d.settings || {}), tours: { ...(d.settings?.tours || {}) }, dismissedTips: { ...(d.settings?.dismissedTips || {}) } },
    stories: Array.isArray(d.stories) ? d.stories : [],
  };
}

const StoreCtx = createContext(null);
const ToastCtx = createContext(null);

const HISTORY_MAX = 60;

export function StoreProvider({ children }) {
  const [data, setData] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const dataRef = useRef(null);
  // Annuler / rétablir, par histoire : instantanés de l'histoire avant chaque modification.
  const history = useRef(new Map());
  const [historyTick, setHistoryTick] = useState(0);

  const persist = useMemo(() => debounce(async (d) => {
    const r = await saveData(d);
    setSaveState(r?.ok === false ? 'error' : 'saved');
  }, 450), []);

  useEffect(() => {
    loadData().then((d) => { const m = migrate(d); dataRef.current = m; setData(m); });
  }, []);

  useEffect(() => {
    const flush = () => dataRef.current && persist.flush(dataRef.current);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [persist]);

  const commit = useCallback((n) => {
    dataRef.current = n;
    setSaveState('saving');
    persist(n);
    return n;
  }, [persist]);

  // mutate(fn) : fn reçoit un brouillon (copie profonde) à modifier directement
  const mutate = useCallback((fn) => {
    setData((d) => { const n = deep(d); fn(n); return commit(n); });
  }, [commit]);

  /**
   * Modifie une histoire en gardant de quoi annuler. `key` regroupe les frappes
   * successives dans un même champ en une seule étape d'annulation.
   */
  const editStory = useCallback((storyUid, fn, key) => {
    setData((d) => {
      const i = d.stories.findIndex((s) => s.uid === storyUid);
      if (i < 0) return d;
      const before = d.stories[i];
      const n = deep(d);
      const story = n.stories[i];
      fn(story);
      story.updatedAt = new Date().toISOString();
      if (story.status === 'sent') story.status = 'changed';
      const h = history.current.get(storyUid) || { past: [], future: [], lastKey: null, lastAt: 0 };
      const now = Date.now();
      if (!(key && h.lastKey === key && now - h.lastAt < 1500)) {
        h.past.push(before);
        if (h.past.length > HISTORY_MAX) h.past.shift();
      }
      h.future = [];
      h.lastKey = key || null;
      h.lastAt = now;
      history.current.set(storyUid, h);
      setHistoryTick((t) => t + 1);
      return commit(n);
    });
  }, [commit]);

  const travel = useCallback((storyUid, dir) => {
    setData((d) => {
      const h = history.current.get(storyUid);
      const i = d.stories.findIndex((s) => s.uid === storyUid);
      if (!h || i < 0) return d;
      const from = dir < 0 ? h.past : h.future;
      const to = dir < 0 ? h.future : h.past;
      if (!from.length) return d;
      const snapshot = from.pop();
      to.push(d.stories[i]);
      h.lastKey = null;
      const n = { ...d, stories: d.stories.map((s, j) => (j === i ? snapshot : s)) };
      setHistoryTick((t) => t + 1);
      return commit(n);
    });
  }, [commit]);

  const canTravel = useCallback((storyUid) => {
    const h = history.current.get(storyUid);
    return { undo: !!h?.past.length, redo: !!h?.future.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyTick]);

  const replaceAll = useCallback((d) => { const m = migrate(d); dataRef.current = m; setData(m); persist.flush(m); }, [persist]);

  const value = useMemo(() => ({ data, mutate, editStory, travel, canTravel, replaceAll, saveState }), [data, mutate, editStory, travel, canTravel, replaceAll, saveState]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

/** Une histoire et ses outils de modification. */
export function useStory(storyUid) {
  const { data, editStory, travel, canTravel } = useStore();
  const story = data.stories.find((s) => s.uid === storyUid) || null;
  const edit = useCallback((fn, key) => editStory(storyUid, fn, key), [editStory, storyUid]);
  /** Modifie seulement le scénario : fn(scenario). */
  const editScenario = useCallback((fn, key) => editStory(storyUid, (st) => fn(st.scenario), key), [editStory, storyUid]);
  const undo = useCallback(() => travel(storyUid, -1), [travel, storyUid]);
  const redo = useCallback(() => travel(storyUid, 1), [travel, storyUid]);
  return { story, edit, editScenario, undo, redo, can: canTravel(storyUid) };
}

export function newStoryRecord(scenario, meta = {}) {
  const now = new Date().toISOString();
  return {
    uid: uid('h'),
    createdAt: now,
    updatedAt: now,
    status: 'draft', // draft → sent (fichier envoyé) → changed (modifiée depuis l'envoi)
    sentAt: null,
    step: 'projet',
    meta: { niveau: '', theme: '', objectifs: '', resume: '', deroule: '', debrief: '', message: '', characters: {}, ...meta },
    scenario,
  };
}

// ── Toasts ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'success', ms = 3400) => {
    const id = uid('t');
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {t.type === 'error' ? <path d="M12 8v5M12 16.5v.01M12 3 2 20h20z" /> : t.type === 'info' ? <path d="M12 11v5M12 8v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
