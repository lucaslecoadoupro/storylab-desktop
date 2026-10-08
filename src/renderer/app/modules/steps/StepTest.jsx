import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../icons.jsx';
import { HelpTip, Switch } from '../../ui.jsx';
import { useStore, useToast } from '../../store.jsx';
import { checkStory } from '../../story/checks.js';
import { phoneUrl, pushDraft, setProgress } from '../../story/exchange.js';
import { sceneNumber, summary, TYPE_INFO } from '../../story/model.js';
import { cut } from '../../utils.js';

/**
 * Étape 5 — le vrai téléphone Déclic, avec l'histoire en cours.
 * Chaque modification faite ailleurs dans le studio s'y applique en direct.
 */
export function StepTest({ uid, from, onFix }) {
  const { data, mutate } = useStore();
  const toast = useToast();
  const story = data.stories.find((x) => x.uid === uid);
  const check = useMemo(() => checkStory(story), [story]);
  const [fast, setFast] = useState(false);
  const [run, setRun] = useState(0); // change → le téléphone recharge
  const [ready, setReady] = useState(false);
  const [startAt, setStartAt] = useState(from || '');
  const first = useRef(true);

  // Lancement (et relance) : brouillon + progression déposés, puis chargement du téléphone.
  useEffect(() => {
    let alive = true;
    setReady(false);
    (async () => {
      const r = await pushDraft(story);
      if (r.light) toast('Images et sons trop lourds pour l’aperçu du navigateur : test sans les médias.', 'info', 5000);
      const ok = setProgress(story, startAt || null);
      if (!ok) toast('Cette scène n’est reliée à aucun chemin : le test démarre au début.', 'info', 5000);
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  // Modifications en direct (le téléphone écoute le stockage local).
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => pushDraft(story), 350);
    return () => clearTimeout(t);
  }, [story]);

  useEffect(() => {
    if (!story.meta.tested) mutate((d) => { const st = d.stories.find((x) => x.uid === uid); if (st) st.meta.tested = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = (at = '') => { setStartAt(at); setRun((n) => n + 1); };
  const s = story.scenario;

  return (
    <div className="test-layout-studio">
      <div className="test-toolbar" data-tour="test-toolbar">
        <button className="btn btn-primary" onClick={() => restart('')}><Icon name="refresh" />Recommencer depuis le début</button>
        <label className="row test-from">
          <span className="muted small">Commencer à la scène</span>
          <select className="select" value={startAt} onChange={(e) => restart(e.target.value)}>
            <option value="">— début de l’histoire —</option>
            {s.scenes.map((sc) => <option key={sc.id} value={sc.id}>n° {sceneNumber(sc.id)} · {TYPE_INFO[sc.type].label} — {cut(summary(sc, s), 40)}</option>)}
          </select>
        </label>
        <Switch checked={fast} onChange={(v) => { setFast(v); setRun((n) => n + 1); }} label="Accéléré" hint="Les messages arrivent plus vite." />
        <span className="spacer" />
        <HelpTip side="left" text="Le téléphone est exactement celui des élèves. À gauche, l’arbre montre où vous en êtes dans l’histoire. Vos modifications s’appliquent en direct, sans perdre la partie. À vérifier : le rythme, la clarté des choix, et que chaque chemin mène à une fin." />
        {check.errors > 0 && <button className="btn btn-danger-soft" onClick={onFix}><Icon name="alert" />{check.errors} erreur{check.errors > 1 ? 's' : ''} à corriger</button>}
      </div>
      <div className="test-body">
        <div className="test-phone">
          {ready ? <iframe key={run} title="Téléphone Déclic de test" src={phoneUrl(story, { fast })} allow="autoplay" /> : <div className="test-loading">Préparation du téléphone…</div>}
        </div>
      </div>
    </div>
  );
}
