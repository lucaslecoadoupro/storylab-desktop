import React, { useEffect, useMemo, useRef } from 'react';
import { Icon } from '../../icons.jsx';
import { appInfo, byId, outline, sceneNumber, summary, TYPE_INFO, whoName } from '../../story/model.js';
import { isTodo } from '../../story/templates.js';
import { useEditor } from './context.jsx';
import { AppIcon } from './pickers.jsx';
import { choiceColor } from './next.jsx';

const LETTERS = 'ABCDEFGH';

/** Bouton « + » entre deux scènes. */
function Insert({ where, label = 'Insérer une scène ici' }) {
  const { createScene } = useEditor();
  return (
    <div className="ol-insert">
      <button type="button" onClick={() => createScene(where)} title={label} aria-label={label}><Icon name="plus" /></button>
    </div>
  );
}

function SceneCard({ id }) {
  const { s, selected, select, byScene } = useEditor();
  const sc = byId(s, id);
  const ref = useRef(null);
  const on = selected === id;
  useEffect(() => { if (on) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [on]);
  const info = TYPE_INFO[sc.type];
  const probs = byScene.get(id) || [];
  const level = probs.some((p) => p.level === 'error') ? 'error' : probs.some((p) => p.level === 'warning') ? 'warning' : null;
  const text = summary(sc, s);
  return (
    <button ref={ref} type="button" className={`ol-card ${on ? 'on' : ''}`} onClick={() => select(id)} style={{ '--t': info.color }} data-scene={id}>
      <span className="ol-icon"><Icon name={info.icon} /></span>
      <span className="ol-main">
        <span className="ol-kicker">
          n° {sceneNumber(id)} · {info.label}
          {sc.app && <span className="ol-app"><AppIcon id={sc.app} size={14} />{appInfo(sc.app).name}</span>}
          {s.start === id && <span className="ol-start">Départ</span>}
        </span>
        <span className={`ol-text ${isTodo(text.replace(/^[^:]*: /, '')) || isTodo(text) ? 'todo' : ''}`}>{text || '…'}</span>
      </span>
      {level && <span className={`ol-dot ${level}`} title={probs.map((p) => p.text).join('\n')} />}
    </button>
  );
}

function Dead({ block }) {
  const { createScene, editScenario, s } = useEditor();
  const ends = s.scenes.filter((x) => x.type === 'end');
  const where = { from: block.from, choice: block.choice };
  return (
    <div className="ol-dead">
      <div className="ol-dead-title"><Icon name="alert" />{block.from ? 'Ce chemin s’arrête sans fin' : 'L’histoire est vide'}</div>
      <div className="ol-dead-actions">
        <button type="button" className="btn btn-sm" onClick={() => createScene(where)}><Icon name="plus" />Écrire la suite</button>
        <button type="button" className="btn btn-sm" onClick={() => createScene(where, 'end')}><Icon name="flag" />Terminer ici par une fin</button>
        {ends.length > 0 && block.from && (
          <select className="select input-sm" value="" onChange={(e) => { const t = e.target.value; if (!t) return; editScenario((x) => { const sc = byId(x, block.from); if (block.choice != null) sc.choices[block.choice].next = t; else sc.next = t; }); }} aria-label="Rejoindre une fin existante">
            <option value="">↪ Rejoindre une fin…</option>
            {ends.map((e) => <option key={e.id} value={e.id}>{e.title || `Fin n° ${sceneNumber(e.id)}`}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function Join({ to }) {
  const { s, select } = useEditor();
  const sc = byId(s, to);
  return (
    <button type="button" className="ol-join" onClick={() => select(to)}>
      <Icon name="route" />Rejoint la scène <b>n° {sceneNumber(to)}</b>{sc && <span> — {TYPE_INFO[sc.type].label}</span>}
    </button>
  );
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    const prev = blocks[i - 1];
    if (b.kind === 'scene') {
      return (
        <React.Fragment key={b.id}>
          {prev?.kind === 'scene' && <Insert where={{ after: prev.id }} />}
          <SceneCard id={b.id} />
        </React.Fragment>
      );
    }
    if (b.kind === 'branches') return <Branches key={`b${b.from}`} block={b} />;
    if (b.kind === 'join') return <React.Fragment key={`j${i}`}>{prev?.kind === 'scene' && <Insert where={{ after: prev.id }} />}<Join to={b.to} /></React.Fragment>;
    if (b.kind === 'dead') return <Dead key={`d${i}`} block={b} />;
    return null;
  });
}

function Branches({ block }) {
  const { s, select } = useEditor();
  const sc = byId(s, block.from);
  const promptOf = sc.type === 'choice' ? 'L’élève décide' : sc.type === 'call' && !sc.lines?.length ? 'L’élève décroche ou refuse' : 'L’élève choisit';
  return (
    <div className="ol-branches">
      <div className="ol-split"><Icon name="branch" />{promptOf}</div>
      {block.items.map((it) => (
        <div key={it.choice} className="ol-lane" style={{ '--c': choiceColor(it.choice) }}>
          <button type="button" className="ol-lane-hd" onClick={() => select(block.from)}>
            <span className="ol-letter">{LETTERS[it.choice]}</span>
            <span className={`ol-lane-label ${isTodo(it.label) ? 'todo' : ''}`}>{it.label || <i>choix sans texte</i>}</span>
          </button>
          <div className="ol-lane-body">
            {it.blocks[0]?.kind === 'scene' && <Insert where={{ branch: [block.from, it.choice] }} label="Insérer une scène au début de ce chemin" />}
            <Blocks blocks={it.blocks} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Plan de l'histoire : toutes les scènes dans l'ordre de lecture, avec les chemins. */
export function Outline() {
  const { s } = useEditor();
  const plan = useMemo(() => outline(s), [s]);
  return (
    <div className="outline" data-tour="outline">
      <div className="ol-begin"><Icon name="smartphone" />L’élève prend le téléphone</div>
      {plan.main[0]?.kind === 'scene' && <Insert where={{ start: true }} label="Insérer une scène avant la première" />}
      <Blocks blocks={plan.main} />
      {plan.loose.length > 0 && (
        <div className="ol-loose">
          <div className="ol-loose-title"><Icon name="link" />Scènes non reliées <span>l’élève ne les verra pas tant qu’aucun choix n’y mène</span></div>
          {plan.loose.map((blocks, i) => <div key={i} className="ol-loose-group"><Blocks blocks={blocks} /></div>)}
        </div>
      )}
    </div>
  );
}

export { whoName };
