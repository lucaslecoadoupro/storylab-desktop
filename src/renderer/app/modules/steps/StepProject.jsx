import React from 'react';
import { Icon } from '../../icons.jsx';
import { AutoText, Callout, Field } from '../../ui.jsx';
import { useStory } from '../../store.jsx';
import { LEVELS, THEMES } from '../../story/templates.js';
import { STORY_APPS } from '../../story/model.js';

/** Étape 1 — l'intention pédagogique : pour qui, pour quoi, comment en classe. */
export function StepProject({ uid }) {
  const { story, edit } = useStory(uid);
  const m = story.meta;
  const s = story.scenario;
  const setMeta = (k, v) => edit((st) => { st.meta[k] = v; }, `meta-${k}`);
  const setScn = (k, v) => edit((st) => { st.scenario[k] = v; }, `scn-${k}`);

  return (
    <div className="step-grid">
      <div className="stack">
        <div className="card" data-tour="project-card">
          <div className="card-hd"><div className="card-title"><Icon name="target" />L’histoire</div><span className="card-sub">visible seulement par les enseignants</span></div>
          <div className="card-body stack">
            <Field label="Titre de l’histoire" required hint="Les élèves ne le voient pas : ils ont seulement le téléphone entre les mains.">
              <input className="input input-lg" value={s.title} onChange={(e) => setScn('title', e.target.value)} placeholder="Ex. La photo de trop" />
            </Field>
            <Field label="Niveau" required as="div">
              <div className="chips">
                {LEVELS.map((l) => <button key={l} type="button" className={`chip ${m.niveau === l ? 'on' : ''}`} onClick={() => setMeta('niveau', m.niveau === l ? '' : l)}>{m.niveau === l && <Icon name="check" />}{l}</button>)}
              </div>
            </Field>
            <Field label="Thème" as="div">
              <div className="theme-grid">
                {THEMES.map((t) => (
                  <button key={t.id} type="button" className={`theme-card ${m.theme === t.id ? 'on' : ''}`} onClick={() => setMeta('theme', m.theme === t.id ? '' : t.id)}>
                    <Icon name={t.icon} /><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Objectifs pédagogiques" required hint="Ce que les élèves doivent comprendre ou savoir faire à la fin de la séance.">
              <AutoText minRows={3} value={m.objectifs} onChange={(v) => setMeta('objectifs', v)} placeholder="Ex. Identifier les réactions possibles d’un témoin de cyberharcèlement et leurs conséquences ; connaître le 3018." />
            </Field>
            <Field label="Résumé de l’histoire" hint="Deux ou trois phrases : la situation de départ et le dilemme.">
              <AutoText minRows={3} value={m.resume} onChange={(v) => setMeta('resume', v)} placeholder="Ex. Une photo gênante d’un élève circule dans le groupe de classe. Le héros doit décider s’il la partage, s’il réagit ou s’il en parle." />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><Icon name="smartphone" />Ce que voit l’élève au début</div></div>
          <div className="card-body stack">
            <Field label="Consigne de départ" help="Affichée à la fin du petit guide qui ouvre le téléphone. Dites simplement par où commencer." hint="Elle apparaît à la fin du guide d’accueil du téléphone.">
              <input className="input" value={s.hint || ''} onChange={(e) => setScn('hint', e.target.value)} placeholder="Ex. Pour commencer, ouvre Papote." />
            </Field>
            <div className="chips">
              {STORY_APPS.filter((a) => ['papote', 'messages', 'pixa', 'flash', 'clan'].includes(a.id)).map((a) => (
                <button key={a.id} type="button" className="chip" onClick={() => setScn('hint', `Pour commencer, ouvre ${a.name}.`)}>« Ouvre {a.name} »</button>
              ))}
            </div>
            <Field label="Durée de la séance (minutes)" hint="Un petit chrono s’affiche en haut du téléphone." style={{ maxWidth: 260 }}>
              <input type="number" min="5" max="180" className="input" value={s.duration ?? 45} onChange={(e) => setScn('duration', Math.max(5, Math.min(180, parseInt(e.target.value, 10) || 45)))} />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><Icon name="graduation" />Fiche pédagogique</div><span className="card-sub">pour vos collègues : elle accompagne l’histoire</span></div>
          <div className="card-body stack">
            <Field label="Déroulé de la séance">
              <AutoText minRows={3} value={m.deroule} onChange={(v) => setMeta('deroule', v)} placeholder={'Ex.\n5 min : présentation\n20 min : jeu en binômes\n15 min : débat à partir des questions de fin'} />
            </Field>
            <Field label="Pistes pour le débrief" hint="Notions à faire émerger, ressources, points de vigilance.">
              <AutoText minRows={3} value={m.debrief} onChange={(v) => setMeta('debrief', v)} placeholder="Ex. Comparer les fins obtenues ; rappeler le 3018 ; la loi sur le droit à l’image." />
            </Field>
          </div>
        </div>
      </div>

      <aside className="stack side-tips">
        <Callout title="Une bonne histoire Déclic" icon="bulb">
          <ul className="tips-list">
            <li><b>Une situation proche des élèves</b> : un groupe de classe, une photo, une rumeur, une sortie.</li>
            <li><b>Un vrai dilemme</b> : pas de « bonne réponse » évidente, chaque choix a un prix.</li>
            <li><b>Des textes courts</b>, écrits comme de vrais messages.</li>
            <li><b>2 ou 3 décisions</b>, et <b>2 à 4 fins</b> différentes.</li>
            <li>Des fins <b>sans jugement</b>, qui ouvrent le débat.</li>
          </ul>
        </Callout>
        <Callout title="Les élèves ne laissent aucune trace" icon="lock" tone="success">
          Déclic ne demande ni nom ni compte : l’élève joue sur un téléphone fictif, rien n’est envoyé. N’utilisez pas de vrais noms d’élèves ni de photos reconnaissables.
        </Callout>
      </aside>
    </div>
  );
}
