import React, { useEffect, useMemo } from 'react';
import { Icon } from '../icons.jsx';
import { Empty, PageHeader } from '../ui.jsx';
import { useStore, useStory } from '../store.jsx';
import { useNav, useTour } from '../nav.jsx';
import { checkStory } from '../story/checks.js';
import { STEPS, stepDone, stepIndex } from '../story/steps.js';
import { StepProject } from './steps/StepProject.jsx';
import { StepCharacters } from './steps/StepCharacters.jsx';
import { StepScenes } from './steps/StepScenes.jsx';
import { StepEnds } from './steps/StepEnds.jsx';
import { StepTest } from './steps/StepTest.jsx';
import { StepSend } from './steps/StepSend.jsx';

/** Barre des six étapes, dans l'en-tête. */
function Stepper({ story, current, check, onStep }) {
  return (
    <nav className="stepper" aria-label="Étapes de l’histoire" data-tour="stepper">
      {STEPS.map((st, i) => {
        const done = stepDone(story, st.id, check);
        const on = st.id === current;
        return (
          <button key={st.id} className={`step ${on ? 'on' : ''} ${done ? 'done' : ''}`} onClick={() => onStep(st.id)} aria-current={on ? 'step' : undefined} data-step={st.id}>
            <span className="step-n">{done && !on ? <Icon name="check" /> : i + 1}</span>
            <span className="step-txt"><b>{st.label}</b><small>{st.sub}</small></span>
          </button>
        );
      })}
    </nav>
  );
}

export function StoryPage({ uid, step = 'projet', scene, from }) {
  const nav = useNav();
  const tour = useTour();
  const { data, mutate } = useStore();
  const st = useStory(uid);
  const { story, undo, redo, can } = st;
  const check = useMemo(() => (story ? checkStory(story) : null), [story]);

  // Mémorise l'étape en cours (pour « Reprendre »).
  useEffect(() => {
    if (story && story.step !== step) mutate((d) => { const x = d.stories.find((y) => y.uid === uid); if (x) x.step = step; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, uid]);

  // Première visite d'une étape : petite visite guidée de l'écran.
  useEffect(() => {
    const id = { scenes: 'editor', tester: 'test', envoyer: 'send' }[step];
    if (id && !data.settings.tours[id] && !tour.active) {
      const t = setTimeout(() => tour.start(id), 600);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!story) return <div className="page-content"><Empty icon="alert" title="Histoire introuvable" sub="Elle a peut-être été supprimée."><button className="btn btn-primary" onClick={() => nav({ page: 'stories' })}>Mes histoires</button></Empty></div>;

  const go = (s, extra = {}) => nav({ page: 'story', uid, step: s, ...extra });
  const idx = stepIndex(step);
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];
  const full = step === 'scenes' || step === 'tester';

  let body;
  switch (step) {
    case 'personnages': body = <StepCharacters uid={uid} />; break;
    case 'scenes': body = <StepScenes uid={uid} scene={scene} onScene={(id) => go('scenes', { scene: id })} onTestFrom={(id) => go('tester', { from: id })} />; break;
    case 'fins': body = <StepEnds uid={uid} onOpenScene={(id) => go('scenes', { scene: id })} />; break;
    case 'tester': body = <StepTest key={from || 'start'} uid={uid} from={from} onFix={() => go('envoyer')} />; break;
    case 'envoyer': body = <StepSend uid={uid} onOpenScene={(id) => go('scenes', { scene: id })} onStep={(s) => go(s)} />; break;
    default: body = <StepProject uid={uid} />;
  }

  return (
    <>
      <PageHeader compact onBack={() => nav({ page: 'stories' })} backLabel="Mes histoires"
        badge={`Étape ${idx + 1} sur ${STEPS.length} · ${STEPS[idx].long}`} badgeIcon={STEPS[idx].icon}
        title={story.scenario.title || 'Histoire sans titre'}
        actions={<>
          <button className="btn btn-ghost btn-icon" onClick={undo} disabled={!can.undo} title="Annuler (Ctrl+Z)" aria-label="Annuler"><Icon name="undo" /></button>
          <button className="btn btn-ghost btn-icon" onClick={redo} disabled={!can.redo} title="Rétablir (Ctrl+Y)" aria-label="Rétablir"><Icon name="redo" /></button>
          {step !== 'tester' && <button className="btn btn-ghost" onClick={() => go('tester')} data-tour="test-btn"><Icon name="play" />Tester</button>}
          {step !== 'envoyer' && <button className={`btn ${check.ok ? 'btn-white' : 'btn-ghost'}`} onClick={() => go('envoyer')}><Icon name="send" />Envoyer</button>}
        </>}>
        <Stepper story={story} current={step} check={check} onStep={(s) => go(s)} />
      </PageHeader>
      <div className={full ? 'page-full' : 'page-content'}>
        {body}
        {!full && (
          <div className="step-nav">
            {prev ? <button className="btn" onClick={() => go(prev.id)}><Icon name="arrowLeft" />{prev.long}</button> : <span />}
            {next && <button className="btn btn-primary" onClick={() => go(next.id)}>Étape suivante : {next.long}<Icon name="arrowRight" /></button>}
          </div>
        )}
      </div>
    </>
  );
}
