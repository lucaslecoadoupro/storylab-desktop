import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useStory } from '../../store.jsx';
import { checkStory, problemsByScene } from '../../story/checks.js';
import { blankScene, byId, contactId, insertAfter, insertAtStart, insertInBranch, newId } from '../../story/model.js';
import { TypePicker, PromptModal } from './pickers.jsx';

/**
 * Contexte de l'éditeur d'histoire : histoire en cours, scène sélectionnée,
 * vérification, et actions communes (créer une scène, un personnage…).
 */
const EditorCtx = createContext(null);
export const useEditor = () => useContext(EditorCtx);

export function EditorProvider({ storyUid, selected, onSelect, backTo = null, clearBack = () => {}, children }) {
  const st = useStory(storyUid);
  const { story, editScenario, edit } = st;
  const check = useMemo(() => checkStory(story), [story]);
  const byScene = useMemo(() => problemsByScene(check), [check]);
  const [typeAsk, setTypeAsk] = useState(null);
  const [promptAsk, setPromptAsk] = useState(null);

  /** Demande un type de scène à l'enseignant (fenêtre des types). */
  const pickType = useCallback((opts = {}) => new Promise((resolve) => setTypeAsk({ ...opts, resolve })), []);
  const ask = useCallback((opts) => new Promise((resolve) => setPromptAsk({ ...opts, resolve })), []);

  /**
   * Crée une scène et la place :
   *  { after: id }                → juste après cette scène
   *  { branch: [id, choiceIdx] }  → au début de ce chemin
   *  { start: true }              → avant la première scène
   *  { loose: true, from }        → sans lien (la suite d'un choix la référencera)
   * Renvoie l'identifiant créé (ou null si annulé).
   */
  const createScene = useCallback(async (where, forcedType) => {
    const type = forcedType || await pickType({ where });
    if (!type) return null;
    let created = null;
    editScenario((s) => {
      const id = newId(s);
      const ctx = where.after || where.branch?.[0] || where.from || null;
      const scene = blankScene(type, id, s, ctx);
      if (where.after) insertAfter(s, where.after, scene);
      else if (where.branch) insertInBranch(s, where.branch[0], where.branch[1], scene);
      else if (where.start) insertAtStart(s, scene);
      else {
        // Scène reliée par l'appelant (suite d'un choix, suite automatique).
        if (where.from && where.choice != null) byId(s, where.from).choices[where.choice].next = id;
        else if (where.from) byId(s, where.from).next = id;
        const idx = s.scenes.findIndex((x) => x.id === where.from);
        s.scenes.splice(idx >= 0 ? idx + 1 : s.scenes.length, 0, scene);
      }
      created = id;
    });
    // La nouvelle scène s'ouvre aussitôt dans le formulaire.
    if (created && where.select !== false) setTimeout(() => onSelect(created, { back: !where.after && !where.branch && !where.start }), 0);
    return created;
  }, [editScenario, pickType, onSelect]);

  /** Crée un personnage (demande son nom) et renvoie son identifiant. */
  const createContact = useCallback(async (opts = {}) => {
    const name = await ask({ title: 'Nouveau personnage', label: 'Son nom, tel qu’il s’affichera dans le téléphone', placeholder: 'Ex. Inès, Maman, Les 4e B…', icon: 'user', ...opts });
    if (!name?.trim()) return null;
    let id = null;
    edit((stry) => {
      id = contactId(stry.scenario, name.trim());
      stry.scenario.contacts[id] = { name: name.trim() };
      stry.meta.characters = { ...(stry.meta.characters || {}), [id]: { kind: opts.kind || (/^(les |groupe)/i.test(name.trim()) ? 'group' : 'person'), role: '' } };
    });
    return id;
  }, [ask, edit]);

  const value = useMemo(() => ({
    ...st, s: story.scenario, check, byScene, selected, select: onSelect, pickType, createScene, createContact, ask, backTo, clearBack,
  }), [st, story, check, byScene, selected, onSelect, pickType, createScene, createContact, ask, backTo, clearBack]);

  return (
    <EditorCtx.Provider value={value}>
      {children}
      {typeAsk && <TypePicker where={typeAsk.where} onPick={(t) => { typeAsk.resolve(t); setTypeAsk(null); }} onClose={() => { typeAsk.resolve(null); setTypeAsk(null); }} />}
      {promptAsk && <PromptModal {...promptAsk} onDone={(v) => { promptAsk.resolve(v); setPromptAsk(null); }} />}
    </EditorCtx.Provider>
  );
}
