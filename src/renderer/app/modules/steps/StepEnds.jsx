import React, { useMemo, useState } from 'react';
import { Icon } from '../../icons.jsx';
import { AutoText, Callout, Empty, Field, useConfirm } from '../../ui.jsx';
import { useStory } from '../../store.jsx';
import { addEnd, byId, endAnchors, outline, reachable, removeEnd, sceneNumber, summary } from '../../story/model.js';
import { MinReadField } from '../editor/MinReadField.jsx';
import { TodoText } from '../editor/media.jsx';
import { plural } from '../../utils.js';

/** Combien de parcours différents mènent à chaque fin. */
function pathsToEnds(s) {
  const counts = new Map();
  const walk = (id, depth, seen) => {
    if (depth > 120 || seen.has(id)) return;
    const sc = byId(s, id);
    if (!sc) return;
    if (sc.type === 'end') { counts.set(id, (counts.get(id) || 0) + 1); return; }
    const next = new Set(seen).add(id);
    const targets = sc.choices?.length ? sc.choices.map((c) => c.next) : [sc.next];
    targets.filter(Boolean).forEach((t) => walk(t, depth + 1, next));
  };
  if (s.start) walk(s.start, 0, new Set());
  return counts;
}

/** Chemins qui s'arrêtent sans fin. */
function deadEnds(s) {
  const out = [];
  const visit = (blocks) => blocks.forEach((b) => {
    if (b.kind === 'dead' && b.from) out.push(b);
    if (b.kind === 'branches') b.items.forEach((it) => visit(it.blocks));
  });
  visit(outline(s).main);
  return out;
}

/** Étape 4 — les fins et le débat. */
export function StepEnds({ uid, onOpenScene }) {
  const { story, edit } = useStory(uid);
  const s = story.scenario;
  const reach = useMemo(() => reachable(s), [s]);
  const counts = useMemo(() => pathsToEnds(s), [s]);
  const dead = useMemo(() => deadEnds(s), [s]);
  const ends = s.scenes.filter((sc) => sc.type === 'end');
  const setEnd = (id, fn, key) => edit((st) => fn(byId(st.scenario, id)), key);
  const confirm = useConfirm();
  const anchors = useMemo(() => endAnchors(s).filter((sc) => reach.has(sc.id)), [s, reach]);
  // Par défaut : la dernière décision de l'histoire.
  const defaultAnchor = [...anchors].reverse().find((sc) => sc.choices?.length)?.id || anchors[anchors.length - 1]?.id || '';
  const [anchor, setAnchor] = useState('');
  const from = anchors.some((a) => a.id === anchor) ? anchor : defaultAnchor;
  const short = (t) => (t.length > 60 ? `${t.slice(0, 60)}…` : t);
  const add = () => { if (from) edit((st) => { addEnd(st.scenario, from); }); };
  const remove = async (e) => {
    const ok = await confirm({ title: 'Supprimer cette fin ?', danger: true, confirmLabel: 'Supprimer', message: `« ${e.title || 'Fin'} » sera retirée. Les choix qui y menaient disparaissent (ou restent à compléter s’il n’en resterait qu’un).` });
    if (ok) edit((st) => { removeEnd(st.scenario, e.id); });
  };

  return (
    <div className="step-grid">
      <div className="stack">
        {dead.length > 0 && (
          <Callout icon="alert" tone="warning" title={`${plural(dead.length, 'chemin')} sans fin`}>
            Certains chemins s’arrêtent sans écran de fin : l’élève resterait bloqué.
            <div className="row-wrap mt-1">{dead.map((d, i) => <button key={i} className="btn btn-sm" onClick={() => onOpenScene(d.from)}>Voir la scène n° {sceneNumber(d.from)}</button>)}</div>
          </Callout>
        )}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><Icon name="flag" />{plural(ends.length, 'fin')} dans l’histoire</div>
          </div>
          <div className="card-body">
            <div className="row-wrap" style={{ alignItems: 'flex-end', gap: '.6rem' }}>
              <Field label="Ajouter une fin qui part de…" hint="Un nouveau choix est ajouté à cette scène : il mène à la nouvelle fin." style={{ flex: 1, minWidth: 260 }}>
                <select className="select" value={from} onChange={(ev) => setAnchor(ev.target.value)}>
                  {anchors.map((sc) => <option key={sc.id} value={sc.id}>n° {sceneNumber(sc.id)} · {short(summary(sc, s))}{sc.choices?.length ? ` (${sc.choices.length} choix)` : ''}</option>)}
                </select>
              </Field>
              <button className="btn btn-primary" disabled={!from} onClick={add}><Icon name="plus" />Ajouter une fin</button>
            </div>
          </div>
        </div>
        {ends.length === 0 ? (
          <div className="card"><Empty icon="flag" title="Aucune fin pour l’instant" sub="Dans l’étape Scènes, terminez chaque chemin par une scène « Fin »." /></div>
        ) : ends.map((e, i) => (
          <div className={`card end-card ${reach.has(e.id) ? '' : 'loose'}`} key={e.id}>
            <div className="card-hd">
              <div className="card-title"><span className="end-n">{i + 1}</span>Fin n° {sceneNumber(e.id)}</div>
              <div className="row">
                <span className="pill">{reach.has(e.id) ? plural(counts.get(e.id) || 0, 'parcours y mène', 'parcours y mènent') : 'non reliée'}</span>
                <button className="btn btn-sm btn-quiet" onClick={() => onOpenScene(e.id)}><Icon name="route" />Voir dans le plan</button>
                {ends.length > 1 && <button className="btn btn-sm btn-quiet btn-icon" onClick={() => remove(e)} aria-label="Supprimer cette fin" title="Supprimer cette fin"><Icon name="trash" /></button>}
              </div>
            </div>
            <div className="card-body stack">
              <Field label="Titre" required><TodoText value={e.title} onChange={(v) => setEnd(e.id, (x) => { x.title = v; }, `et-${e.id}`)} placeholder="Ex. Le silence" /></Field>
              <Field label="Texte de fin" hint="Laissez une ligne vide entre deux paragraphes."><TodoText multiline minRows={3} value={e.text} onChange={(v) => setEnd(e.id, (x) => { x.text = v; }, `ex-${e.id}`)} placeholder="Ce que l’élève peut retenir de ce chemin." /></Field>
              <MinReadField value={e.minRead} onChange={(v) => setEnd(e.id, (x) => { if (v) x.minRead = v; else delete x.minRead; }, `emr-${e.id}`)} />
              <Field label="Questions pour le débat" as="div">
                <div className="lines">
                  {(e.discuss || []).map((q, j) => (
                    <div className="line-row" key={j}>
                      <span className="q-n">{j + 1}</span>
                      <TodoText value={q} onChange={(v) => setEnd(e.id, (x) => { x.discuss[j] = v; }, `eq-${e.id}-${j}`)} placeholder="Ex. Qu’aurais-tu fait à sa place ?" />
                      <button className="btn btn-quiet btn-icon btn-sm" onClick={() => setEnd(e.id, (x) => { x.discuss.splice(j, 1); })} aria-label="Supprimer la question"><Icon name="x" /></button>
                    </div>
                  ))}
                  <button className="btn btn-sm" onClick={() => setEnd(e.id, (x) => { x.discuss = [...(x.discuss || []), '']; })}><Icon name="plus" />Ajouter une question</button>
                </div>
              </Field>
            </div>
          </div>
        ))}
        <div className="card">
          <div className="card-hd"><div className="card-title"><Icon name="graduation" />Après la partie : le débrief</div></div>
          <div className="card-body">
            <Field label="Pistes pour le débrief (fiche pédagogique)">
              <AutoText minRows={3} value={story.meta.debrief} onChange={(v) => edit((st) => { st.meta.debrief = v; }, 'meta-debrief')} placeholder="Comparer les fins obtenues, faire émerger les notions, donner les ressources…" />
            </Field>
          </div>
        </div>
      </div>
      <aside className="stack side-tips">
        <Callout title="Des fins qui font réfléchir" icon="bulb">
          <ul className="tips-list">
            <li>Décrivez les <b>conséquences</b>, sans faire la morale.</li>
            <li>Une fin « difficile » est utile : elle nourrit le débat.</li>
            <li>Donnez une <b>ressource</b> quand c’est pertinent : 3018, infirmière, CPE, adulte de confiance.</li>
            <li>Les questions s’affichent sur l’écran de fin : elles lancent la discussion en classe.</li>
          </ul>
        </Callout>
        <Callout title="Comparer les fins en classe" icon="users2">
          En binômes, les élèves obtiennent des fins différentes : faites-les raconter leur parcours, c’est le cœur du débrief.
        </Callout>
      </aside>
    </div>
  );
}
