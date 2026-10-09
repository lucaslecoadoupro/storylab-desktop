import React from 'react';
import { Icon } from '../../icons.jsx';
import { Collapse, Field, HelpTip, Seg, Switch } from '../../ui.jsx';
import { addChoice, byId, MESSAGING_APPS, removeChoice, sceneNumber, STORY_APPS, TYPE_INFO } from '../../story/model.js';
import { useEditor } from './context.jsx';
import { EmojiRow, PersonSelect, TargetSelect } from './pickers.jsx';
import { TodoText } from './media.jsx';
import { EffectEditor } from './effects.jsx';

const LETTERS = 'ABCDEFGH';
export const choiceColor = (i) => ['#3b5bdb', '#d6336c', '#0ca678', '#f08c00', '#7048e8', '#0891b2'][i % 6];

/** Lien vers une scène (« Aller à n° 7 »). */
function GoTo({ id }) {
  const { s, select } = useEditor();
  const sc = byId(s, id);
  if (!sc) return null;
  return (
    <button type="button" className="goto" onClick={() => select(id, { back: true })} title="Ouvrir cette scène">
      <span className="goto-dot" style={{ background: TYPE_INFO[sc.type]?.color }} />n° {sceneNumber(id)}<Icon name="arrowRight" />
    </button>
  );
}

/** « Et ensuite ? » : suite automatique ou choix de l'élève. */
export function NextEditor({ scene }) {
  const { editScenario, createScene } = useEditor();
  const set = (fn, key) => editScenario((s) => fn(byId(s, scene.id)), key);

  if (scene.type === 'end') {
    return (
      <div className="next-box end">
        <Icon name="flag" />
        <div><b>L’histoire s’arrête ici pour l’élève.</b><br />Il verra un écran de fin avec votre texte et un bouton « Recommencer l’histoire ».</div>
      </div>
    );
  }

  if (scene.choices?.length) return <ChoicesEditor scene={scene} />;

  const canChoose = scene.type !== 'notification';
  return (
    <div className="next-box">
      <Field label={scene.type === 'narration' ? 'Après un clic sur « Continuer », l’histoire passe à…' : 'Ensuite, automatiquement…'}>
        <div className="row">
          <TargetSelect value={scene.next} exclude={scene.id} onChange={(v) => set((sc) => { sc.next = v || undefined; })} onCreate={(t) => createScene({ from: scene.id }, t)} />
          {scene.next && <GoTo id={scene.next} />}
        </div>
      </Field>
      {canChoose ? (
        <button type="button" className="btn btn-add-choice" data-tour="add-choice" onClick={() => editScenario((s) => addChoice(s, scene.id))}>
          <Icon name="branch" />Proposer un choix à l’élève à ce moment-là
        </button>
      ) : (
        <p className="tiny-note"><Icon name="info" />Une notification ne propose pas de choix : ajoutez juste après une scène (récit, message, choix du héros) qui en propose.</p>
      )}
    </div>
  );
}

function ChoicesEditor({ scene }) {
  const { editScenario, createScene } = useEditor();
  const incomingCall = scene.type === 'call' && !scene.lines?.length;
  return (
    <div className="choices" data-tour="choices">
      <div className="choices-hd">
        <Icon name="branch" />
        <span><b>L’élève choisit</b> — chaque bouton mène à une suite différente.</span>
        <HelpTip text="Dans une messagerie, le texte du bouton est envoyé par l’élève comme un message. Pour un choix « intérieur » (ne rien dire, fermer l’appli…), utilisez les effets du choix." />
      </div>
      {incomingCall && <p className="tiny-note"><Icon name="phoneCall" />Appel entrant : le 1er choix correspond au bouton vert « Décrocher », le 2e au bouton rouge « Refuser ».</p>}
      {scene.choices.map((c, i) => <ChoiceCard key={i} scene={scene} c={c} i={i} onCreate={(t) => createScene({ from: scene.id, choice: i }, t)} />)}
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => editScenario((s) => addChoice(s, scene.id))} disabled={scene.choices.length >= 6}><Icon name="plus" />Ajouter un choix</button>
        {scene.choices.length >= 4 && <span className="tiny-note">Au-delà de 4 choix, l’élève risque de ne pas tout lire.</span>}
      </div>
    </div>
  );
}

function ChoiceCard({ scene, c, i, onCreate }) {
  const { editScenario, s } = useEditor();
  const set = (fn, key) => editScenario((sc) => fn(byId(sc, scene.id).choices[i]), key);
  const isMessage = scene.type === 'message';
  const forwardable = ['message', 'publication', 'story', 'media'].includes(scene.type);
  const effects = [c.say !== undefined, c.react, c.forward, c.capture, c.likes, c.screenOff, c.open !== undefined, c.effect].filter(Boolean).length;
  const publications = s.scenes.filter((x) => x.type === 'publication');
  const sayMode = c.say === false ? 'none' : typeof c.say === 'string' ? 'other' : 'label';
  const canRemove = scene.choices.length > (['choice', 'call'].includes(scene.type) ? 1 : 0);

  return (
    <div className="choice-card" style={{ '--c': choiceColor(i) }}>
      <div className="choice-top">
        <span className="choice-letter">{LETTERS[i]}</span>
        <TodoText value={c.label} onChange={(v) => set((ch) => { ch.label = v; }, `label-${scene.id}-${i}`)} placeholder={isMessage ? 'Ce que l’élève peut répondre' : 'Texte du bouton (ex. « J’en parle à un adulte »)'} aria-label={`Texte du choix ${LETTERS[i]}`} />
        {canRemove && <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => editScenario((sc) => removeChoice(sc, scene.id, i))} aria-label={`Supprimer le choix ${LETTERS[i]}`} title="Supprimer ce choix"><Icon name="trash" /></button>}
      </div>
      <div className="choice-next">
        <span className="choice-arrow">mène à</span>
        <TargetSelect value={c.next} exclude={scene.id} onChange={(v) => set((ch) => { ch.next = v; })} onCreate={onCreate} />
        {c.next && <GoTo id={c.next} />}
      </div>
      <Collapse title="Effets dans le téléphone" sub="répondre autre chose, réagir, transférer, capture, fissure, téléphone figé…" icon="wandSparkle" count={effects}>
        <div className="effects">
          {isMessage && (
            <Field label="Ce que l’élève envoie dans la conversation">
              <Seg value={sayMode} onChange={(m) => set((ch) => { if (m === 'label') delete ch.say; else if (m === 'none') ch.say = false; else ch.say = typeof ch.say === 'string' ? ch.say : ch.label || ''; })}
                options={[{ value: 'label', label: 'Le texte du bouton' }, { value: 'other', label: 'Un autre texte' }, { value: 'none', label: 'Rien' }]} />
              {sayMode === 'other' && <input className="input mt-1" value={c.say} onChange={(e) => set((ch) => { ch.say = e.target.value; }, `say-${scene.id}-${i}`)} placeholder="Message réellement envoyé" />}
            </Field>
          )}
          {isMessage && (
            <Field label="Réagir au message avec un emoji" help="L’élève pose cet emoji sous le message au lieu d’écrire.">
              <EmojiRow value={c.react} onChange={(e) => set((ch) => { if (e) ch.react = e; else delete ch.react; })} />
            </Field>
          )}
          {forwardable && (
            <Field label="Transférer ce contenu à quelqu’un" help="Le message, la photo ou la publication est envoyé dans une autre conversation, marqué « Transféré ».">
              <div className="row">
                <PersonSelect value={c.forward?.thread} allowNone placeholder="— Ne pas transférer —" onChange={(t) => set((ch) => { if (t) ch.forward = { app: ch.forward?.app || 'papote', thread: t }; else delete ch.forward; })} />
                {c.forward && (
                  <select className="select" style={{ maxWidth: 150 }} value={c.forward.app} onChange={(e) => set((ch) => { ch.forward.app = e.target.value; })}>
                    {MESSAGING_APPS.map((a) => <option key={a.id} value={a.id}>dans {a.name}</option>)}
                  </select>
                )}
              </div>
            </Field>
          )}
          <Switch checked={c.capture} onChange={(v) => set((ch) => { if (v) ch.capture = true; else delete ch.capture; })} label="Faire une capture d’écran" hint="Elle s’ajoute dans l’appli Photos (une preuve, par exemple)." />
          {(scene.type === 'publication' || publications.length > 0) && (
            <Field label="Changer le nombre de « J’aime » (Pixa)">
              <div className="row">
                <input type="number" className="input input-num" value={c.likes?.add ?? ''} placeholder="0" onChange={(e) => set((ch) => { const n = parseInt(e.target.value, 10); if (Number.isFinite(n) && n !== 0) ch.likes = { ...(ch.likes || {}), add: n }; else delete ch.likes; })} />
                <span className="muted small">(+ pour en ajouter, − pour en retirer)</span>
                {scene.type !== 'publication' && c.likes && (
                  <select className="select" value={c.likes.post || ''} onChange={(e) => set((ch) => { ch.likes.post = e.target.value || undefined; })}>
                    <option value="">— Quelle publication ? —</option>
                    {publications.map((p) => <option key={p.id} value={p.id}>n° {sceneNumber(p.id)} · {p.content?.text || p.content?.alt || 'Publication'}</option>)}
                  </select>
                )}
              </div>
            </Field>
          )}
          <EffectEditor where="choice" scene={scene} s={s} value={c.effect} onChange={(e) => set((ch) => { if (e) ch.effect = e; else delete ch.effect; }, `fx-${scene.id}-${i}`)} />
          <Switch checked={c.screenOff} onChange={(v) => set((ch) => { if (v) ch.screenOff = true; else delete ch.screenOff; })} label="L’élève éteint son téléphone" hint="Écran noir jusqu’à ce qu’il le rallume ; l’histoire reprend 15 s après." />
          <Field label="Ensuite, le téléphone…" help="Par défaut, le téléphone bascule tout seul vers l’appli où se passe la suite quand c’est l’élève qui agit (il écrit ailleurs, appelle…).">
            <div className="row">
              <select className="select" value={c.open === false ? '__none' : c.open?.app || ''} onChange={(e) => set((ch) => { const v = e.target.value; if (!v) delete ch.open; else if (v === '__none') ch.open = false; else ch.open = { app: v }; })}>
                <option value="">bascule tout seul si besoin (recommandé)</option>
                <option value="__none">reste où il est</option>
                {STORY_APPS.map((a) => <option key={a.id} value={a.id}>ouvre {a.name}</option>)}
              </select>
              {c.open && MESSAGING_APPS.some((a) => a.id === c.open.app) && (
                <PersonSelect value={c.open.thread} allowNone placeholder="— liste des conversations —" onChange={(t) => set((ch) => { ch.open = { app: ch.open.app, ...(t ? { thread: t } : {}) }; })} />
              )}
            </div>
          </Field>
        </div>
      </Collapse>
    </div>
  );
}
