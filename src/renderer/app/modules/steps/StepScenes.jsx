import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '../../icons.jsx';
import { Callout } from '../../ui.jsx';
import { useStore } from '../../store.jsx';
import { byId, stats, TYPE_INFO } from '../../story/model.js';
import { plural } from '../../utils.js';
import { EditorProvider, useEditor } from '../editor/context.jsx';
import { Outline } from '../editor/Outline.jsx';
import { SceneForm } from '../editor/SceneForm.jsx';
import { MiniPhone } from '../editor/MiniPhone.jsx';
import { StoryMap } from '../editor/StoryMap.jsx';

const TYPE_TIPS = {
  message: 'Écrivez comme les élèves écrivent : phrases courtes, abréviations, emojis. Plusieurs petits messages valent mieux qu’un long.',
  publication: 'Les commentaires font vivre une publication : ils montrent comment le groupe réagit (rires, malaise, soutien).',
  story: 'Trois écrans suffisent souvent. Les choix éventuels s’affichent sur le dernier écran.',
  notification: 'Une notification attire l’élève vers une appli. Elle ne propose pas de choix : ajoutez-les dans la scène suivante.',
  media: 'La photo s’ajoute à la galerie : l’élève pourra la retrouver… ou la transférer.',
  call: 'Un appel entrant crée un moment de tension. Le 1er choix = décrocher, le 2e = refuser.',
  narration: 'Écrivez à la 2e personne (« Tu… »). Un récit sert à changer de lieu ou de moment, ou à raconter ce qui se passe hors du téléphone.',
  choice: 'Formulez des choix réalistes, que des élèves feraient vraiment, y compris le « mauvais » choix.',
  end: 'Une fin sans morale assénée : décrivez les conséquences et posez une ou deux questions pour le débat.',
};

function Inner({ onTestFrom }) {
  const { s, selected, select, check, undo, redo, can } = useEditor();
  const { data, mutate } = useStore();
  const [map, setMap] = useState(false);
  const st = stats(s);
  const sc = selected ? byId(s, selected) : null;
  const tipKey = `type-${sc?.type}`;

  // Ctrl+Z / Ctrl+Y en dehors des champs de texte.
  useEffect(() => {
    const k = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey && can.undo) { e.preventDefault(); undo(); }
      if ((e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) && can.redo) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [undo, redo, can]);

  return (
    <div className="scenes-layout">
      <aside className="scenes-plan">
        <div className="plan-hd">
          <div>
            <div className="plan-title">Plan de l’histoire</div>
            <div className="plan-sub">{plural(st.scenes, 'scène')} · {plural(st.decisions, 'décision')} · {plural(st.ends, 'fin')}</div>
          </div>
          <button className="btn btn-sm" onClick={() => setMap(true)} data-tour="map-btn"><Icon name="route" />Vue d’ensemble</button>
        </div>
        <div className="plan-body scroll"><Outline /></div>
      </aside>

      <section className="scenes-form scroll" data-tour="scene-form">
        {sc ? <SceneFormWithBack key={sc.id} id={sc.id} onTestFrom={onTestFrom} /> : (
          <div className="empty"><div className="empty-icon"><Icon name="route" /></div><div className="empty-title">Choisissez une scène dans le plan</div><div className="empty-sub">ou cliquez sur un « + » pour en ajouter une.</div></div>
        )}
      </section>

      <aside className="scenes-side scroll">
        <MiniPhone id={selected} />
        {sc && !data.settings.dismissedTips[tipKey] && (
          <Callout icon={TYPE_INFO[sc.type].icon} title={`Conseil · ${TYPE_INFO[sc.type].label}`} onClose={() => mutate((d) => { d.settings.dismissedTips[tipKey] = true; })}>
            {TYPE_TIPS[sc.type]}
          </Callout>
        )}
        {(check.errors > 0 || check.warnings > 0) && (
          <div className="side-problems">
            <div className="side-problems-hd"><Icon name="alert" />À corriger dans l’histoire</div>
            {[...check.problems].sort((a, b) => (a.level === 'error' ? -1 : 1) - (b.level === 'error' ? -1 : 1)).slice(0, 6).map((p, i) => (
              <button key={i} className={`side-problem ${p.level}`} onClick={() => p.sceneId && select(p.sceneId)} disabled={!p.sceneId}>
                {p.sceneId && <b>n° {p.sceneId.replace(/^s/, '')}</b>} {p.text}
              </button>
            ))}
            {check.problems.length > 6 && <div className="tiny-note">… et {check.problems.length - 6} autres (étape « Envoyer »).</div>}
          </div>
        )}
      </aside>
      {map && <StoryMap s={s} selected={selected} onPick={(id) => { select(id); setMap(false); }} onClose={() => setMap(false)} />}
    </div>
  );
}

/** Formulaire avec un lien « Revenir » quand on vient de créer la suite d'une scène. */
function SceneFormWithBack({ id, onTestFrom }) {
  const { select, backTo, clearBack } = useEditor();
  return <SceneForm id={id} onTestFrom={onTestFrom} backTo={backTo && backTo !== id ? backTo : null} onBack={() => { select(backTo); clearBack(); }} />;
}

/** Étape 3 — le plan, le formulaire de la scène et son aperçu. */
export function StepScenes({ uid, scene, onScene, onTestFrom }) {
  const { data } = useStore();
  const story = data.stories.find((x) => x.uid === uid);
  const first = story.scenario.start || story.scenario.scenes[0]?.id;
  const selected = scene && story.scenario.scenes.some((x) => x.id === scene) ? scene : first;
  const [backTo, setBackTo] = useState(null);
  // { back: true } : on vient du formulaire (suite d'un choix, nouvelle scène) → lien « Revenir ».
  const select = useCallback((id, opts) => {
    if (!id) return;
    setBackTo(opts?.back ? selected : null);
    onScene(id);
  }, [onScene, selected]);
  return (
    <EditorProvider storyUid={uid} selected={selected} onSelect={select} backTo={backTo} clearBack={() => setBackTo(null)}>
      <Inner onTestFrom={onTestFrom} />
    </EditorProvider>
  );
}
