import React from 'react';
import { Icon } from '../../icons.jsx';
import { Callout, Collapse, Field, Menu, Seg, Switch, useConfirm } from '../../ui.jsx';
import { appsFor, byId, changeType, deleteScene, duplicateScene, incoming, sceneNumber, TYPE_INFO, TYPE_ORDER, whoName } from '../../story/model.js';
import { useEditor } from './context.jsx';
import { AppPicker, EmojiRow, PersonSelect } from './pickers.jsx';
import { AudioField, ContentEditor, TodoText } from './media.jsx';
import { NextEditor } from './next.jsx';

/** Bloc numéroté du formulaire (« 1. Où ? »). */
function Block({ n, title, sub, children, tour }) {
  return (
    <section className="fblock" data-tour={tour}>
      <div className="fblock-hd"><span className="fblock-n">{n}</span><div><div className="fblock-title">{title}</div>{sub && <div className="fblock-sub">{sub}</div>}</div></div>
      <div className="fblock-body">{children}</div>
    </section>
  );
}

/** Liste de répliques (appel sous-titré, dialogue d'un récit). */
function LinesEditor({ lines = [], onChange, meLabel = 'L’élève (Toi)' }) {
  const set = (i, patch) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="lines">
      {lines.map((l, i) => (
        <div className="line-row" key={i}>
          <div style={{ width: 190, flexShrink: 0 }}><PersonSelect value={l.speaker} allowMe meLabel={meLabel} onChange={(v) => set(i, { speaker: v })} placeholder="— Qui parle ? —" /></div>
          <TodoText value={l.text} onChange={(v) => set(i, { text: v })} placeholder="Réplique" />
          <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => onChange(lines.filter((_, j) => j !== i))} aria-label="Supprimer la réplique"><Icon name="x" /></button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={() => onChange([...lines, { speaker: lines.length ? lines[lines.length - 1].speaker === 'me' ? lines.find((x) => x.speaker !== 'me')?.speaker || '' : 'me' : '', text: '' }])}><Icon name="plus" />Ajouter une réplique</button>
    </div>
  );
}

function ListEditor({ items = [], onChange, placeholder, addLabel }) {
  return (
    <div className="lines">
      {items.map((q, i) => (
        <div className="line-row" key={i}>
          <span className="q-n">{i + 1}</span>
          <TodoText value={q} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} placeholder={placeholder} />
          <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Supprimer"><Icon name="x" /></button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={() => onChange([...items, ''])}><Icon name="plus" />{addLabel}</button>
    </div>
  );
}

// ── Champs propres à chaque type ────────────────────────────────────────────
function MessageFields({ sc, set }) {
  const { s, story } = useEditor();
  const thread = sc.thread || (sc.sender !== 'me' && sc.sender !== 'system' ? sc.sender : '');
  const isGroup = story.meta.characters?.[thread]?.kind === 'group';
  return (
    <>
      <Block n={1} title="Dans quelle messagerie ?" tour="where">
        <AppPicker type="message" value={sc.app} onChange={(v) => set((x) => { x.app = v; })} />
      </Block>
      <Block n={2} title="Dans quelle conversation, et qui écrit ?" sub="Une conversation avec une personne, ou un groupe (ex. le groupe de la classe)." tour="who">
        <div className="grid-2">
          <Field label="Conversation">
            <PersonSelect value={thread} onChange={(v) => set((x) => { x.thread = v || undefined; if (v && story.meta.characters?.[v]?.kind !== 'group' && x.sender !== 'me' && x.sender !== 'system') x.sender = v; })} placeholder="— Avec qui ? —" />
          </Field>
          <Field label="Qui écrit ce message ?" hint={sc.sender === 'me' ? 'C’est l’élève qui envoie ce message (il apparaît à droite, en bleu).' : isGroup ? 'Dans un groupe, n’importe quel personnage peut écrire.' : ''}>
            <PersonSelect value={sc.sender} allowMe allowSystem onChange={(v) => set((x) => { x.sender = v; if (!x.thread && v !== 'me' && v !== 'system') x.thread = v; })} />
          </Field>
        </div>
      </Block>
      <Block n={3} title="Le message" tour="content">
        <ContentEditor content={sc.content} onChange={(c) => set((x) => { x.content = c; }, `content-${sc.id}`)} />
      </Block>
      <Collapse title="Plus d’options pour ce message" sub="réactions des autres, photo enregistrée" icon="smile" count={(sc.reactions?.length || 0) + (sc.save ? 1 : 0)}>
        <Field label="Réactions des autres personnages" hint="Elles apparaissent sous la bulle avec une petite animation.">
          <div className="lines">
            {(sc.reactions || []).map((r, i) => (
              <div className="line-row" key={i}>
                <div style={{ width: 180 }}><PersonSelect value={r.from} onChange={(v) => set((x) => { x.reactions[i].from = v; })} placeholder="— Qui ? —" /></div>
                <EmojiRow value={r.emoji} onChange={(e) => set((x) => { x.reactions[i].emoji = e || '👍'; })} />
                <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => set((x) => { x.reactions.splice(i, 1); })} aria-label="Supprimer"><Icon name="x" /></button>
              </div>
            ))}
            <button type="button" className="btn btn-sm" onClick={() => set((x) => { x.reactions = [...(x.reactions || []), { from: Object.keys(s.contacts)[0] || '', emoji: '😂' }]; })}><Icon name="plus" />Ajouter une réaction</button>
          </div>
        </Field>
        {sc.content?.type === 'image' && <Switch checked={sc.save} onChange={(v) => set((x) => { if (v) x.save = true; else delete x.save; })} label="Enregistrer aussi la photo dans l’appli Photos" />}
      </Collapse>
    </>
  );
}

function PublicationFields({ sc, set }) {
  const { s } = useEditor();
  const clan = sc.app === 'clan';
  return (
    <>
      <Block n={1} title="Sur quel réseau ?" tour="where">
        <AppPicker type="publication" value={sc.app} onChange={(v) => set((x) => { x.app = v; })} />
      </Block>
      <Block n={2} title={clan ? 'Qui fait le check-in, et où ?' : 'Qui publie ?'} tour="who">
        <div className="grid-2">
          <Field label="Auteur"><PersonSelect value={sc.author} allowMe onChange={(v) => set((x) => { x.author = v; })} /></Field>
          <Field label={clan ? 'Lieu du check-in' : 'Lieu (facultatif)'} required={clan}>
            <TodoText value={sc.place} onChange={(v) => set((x) => { x.place = v || undefined; }, `place-${sc.id}`)} placeholder={clan ? 'Ex. Place du Marché' : 'Ex. Collège Jean Moulin'} />
          </Field>
        </div>
        {clan && (
          <Field label="Avec qui ?" hint="Les amis présents (« Emma est à la Place du Marché avec Inès et Zoé »).">
            <div className="chips">
              {Object.entries(s.contacts).filter(([id]) => id !== sc.author).map(([id, c]) => {
                const on = sc.with?.includes(id);
                return <button type="button" key={id} className={`chip ${on ? 'on' : ''}`} onClick={() => set((x) => { x.with = on ? x.with.filter((w) => w !== id) : [...(x.with || []), id]; })}>{on && <Icon name="check" />}{c.name}</button>;
              })}
            </div>
          </Field>
        )}
      </Block>
      <Block n={3} title={clan ? 'Le commentaire (facultatif)' : 'La publication'} tour="content">
        <ContentEditor content={sc.content} kinds={clan ? ['text'] : ['image', 'text']} textLabel={clan ? 'Commentaire de l’auteur' : 'Texte'} onChange={(c) => set((x) => { x.content = c; }, `content-${sc.id}`)} />
        {!clan && (
          <Field label="Nombre de « J’aime » au départ" style={{ maxWidth: 260 }}>
            <input type="number" min="0" className="input" value={sc.likes ?? 0} onChange={(e) => set((x) => { x.likes = Math.max(0, parseInt(e.target.value, 10) || 0); }, `likes-${sc.id}`)} />
          </Field>
        )}
      </Block>
      <Block n={4} title="Les commentaires" sub={clan ? 'Les réactions des autres au check-in.' : 'Ce que les autres écrivent sous la publication.'}>
        <div className="lines">
          {(sc.comments || []).map((c, i) => (
            <div className="line-row" key={i}>
              <div style={{ width: 180, flexShrink: 0 }}><PersonSelect value={c.author} allowMe onChange={(v) => set((x) => { x.comments[i].author = v; })} placeholder="— Qui ? —" /></div>
              <TodoText value={c.text} onChange={(v) => set((x) => { x.comments[i].text = v; }, `com-${sc.id}-${i}`)} placeholder="Commentaire" />
              <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => set((x) => { x.comments.splice(i, 1); })} aria-label="Supprimer le commentaire"><Icon name="x" /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={() => set((x) => { x.comments = [...(x.comments || []), { author: Object.keys(s.contacts).find((k) => k !== x.author) || '', text: '' }]; })}><Icon name="plus" />Ajouter un commentaire</button>
        </div>
      </Block>
    </>
  );
}

function StoryFields({ sc, set }) {
  const frames = sc.frames || [];
  return (
    <>
      <Block n={1} title="Sur quel réseau ?" tour="where"><AppPicker type="story" value={sc.app} onChange={(v) => set((x) => { x.app = v; })} /></Block>
      <Block n={2} title="Qui publie la story ?" tour="who">
        <div style={{ maxWidth: 320 }}><PersonSelect value={sc.author} allowMe onChange={(v) => set((x) => { x.author = v; })} /></div>
      </Block>
      <Block n={3} title="Les écrans de la story" sub="Ils défilent l’un après l’autre ; les choix éventuels s’affichent sur le dernier." tour="content">
        {frames.map((f, i) => (
          <div className="frame-card" key={i}>
            <div className="frame-hd">
              <b>Écran {i + 1}</b>
              <span className="spacer" />
              <button type="button" className="btn btn-quiet btn-icon btn-sm" disabled={i === 0} onClick={() => set((x) => { [x.frames[i - 1], x.frames[i]] = [x.frames[i], x.frames[i - 1]]; })} aria-label="Monter"><Icon name="chevronUp" /></button>
              <button type="button" className="btn btn-quiet btn-icon btn-sm" disabled={i === frames.length - 1} onClick={() => set((x) => { [x.frames[i + 1], x.frames[i]] = [x.frames[i], x.frames[i + 1]]; })} aria-label="Descendre"><Icon name="chevronDown" /></button>
              {frames.length > 1 && <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={() => set((x) => { x.frames.splice(i, 1); })} aria-label="Supprimer l’écran"><Icon name="trash" /></button>}
            </div>
            <ContentEditor content={f} kinds={['text', 'image']} onChange={(c) => set((x) => { x.frames[i] = c; }, `frame-${sc.id}-${i}`)} />
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={() => set((x) => { x.frames = [...(x.frames || []), { type: 'text', text: '' }]; })}><Icon name="plus" />Ajouter un écran</button>
      </Block>
    </>
  );
}

function NotificationFields({ sc, set }) {
  return (
    <>
      <Block n={1} title="Quelle appli envoie la notification ?" tour="where"><AppPicker type="notification" value={sc.app} onChange={(v) => set((x) => { x.app = v; })} /></Block>
      <Block n={2} title="Le texte de la bannière" tour="content">
        <div className="grid-2">
          <Field label="Titre" hint="Souvent le nom de l’appli ou de l’expéditeur."><TodoText value={sc.title} onChange={(v) => set((x) => { x.title = v; }, `t-${sc.id}`)} placeholder="Ex. Pixa" /></Field>
          <Field label="Message"><TodoText value={sc.text} onChange={(v) => set((x) => { x.text = v; }, `x-${sc.id}`)} placeholder="Ex. Léo a publié une nouvelle photo" /></Field>
        </div>
      </Block>
    </>
  );
}

function MediaFields({ sc, set }) {
  return (
    <Block n={1} title="La photo ajoutée à la galerie" tour="content">
      <ContentEditor content={sc.content} kinds={['image']} onChange={(c) => set((x) => { x.content = c; }, `content-${sc.id}`)} />
    </Block>
  );
}

function CallFields({ sc, set }) {
  const mode = sc.lines?.length ? 'lines' : 'ring';
  return (
    <>
      <Block n={1} title="Par où passe l’appel ?" tour="where"><AppPicker type="call" value={sc.app || 'phone'} onChange={(v) => set((x) => { x.app = v; })} /></Block>
      <Block n={2} title="Qui appelle qui ?" tour="who">
        <div className="grid-2">
          <Field label="Sens de l’appel">
            <Seg value={sc.direction || 'incoming'} onChange={(v) => set((x) => { if (v === 'incoming') delete x.direction; else x.direction = v; })} options={[{ value: 'incoming', label: 'L’élève reçoit l’appel', icon: 'phoneCall' }, { value: 'outgoing', label: 'L’élève appelle', icon: 'send' }]} />
          </Field>
          <Field label={sc.direction === 'outgoing' ? 'Qui l’élève appelle-t-il ?' : 'Qui appelle ?'}>
            <PersonSelect value={sc.caller} onChange={(v) => set((x) => { x.caller = v; })} placeholder="— Choisir —" />
          </Field>
        </div>
      </Block>
      <Block n={3} title="Comment se passe l’appel ?" tour="content">
        <Seg block value={mode} onChange={(m) => set((x) => {
          if (m === 'lines') { x.lines = x.lines?.length ? x.lines : [{ speaker: x.caller || '', text: '' }, { speaker: 'me', text: '' }]; } else { delete x.lines; if (!x.choices?.length) { x.choices = [{ label: 'Décrocher', next: x.next || '' }, { label: 'Refuser', next: '' }]; delete x.next; } }
        })} options={[{ value: 'ring', label: 'Ça sonne : l’élève décroche ou refuse' }, { value: 'lines', label: 'Une conversation sous-titrée' }]} />
        {mode === 'lines' && <div className="mt-1"><LinesEditor lines={sc.lines} onChange={(lines) => set((x) => { x.lines = lines; }, `lines-${sc.id}`)} /></div>}
        <div className="mt-2"><AudioField src={sc.audio} onChange={(p) => set((x) => { if (p.src) x.audio = p.src; else delete x.audio; })} label="Enregistrement de l’appel (facultatif)" hint="Joué pendant l’appel à la place de la voix de synthèse." /></div>
      </Block>
    </>
  );
}

function ChoiceFields({ sc, set }) {
  return (
    <Block n={1} title="La question que se pose l’élève" sub="Une décision « dans sa tête », hors de toute appli." tour="content">
      <Field label="Question"><TodoText multiline value={sc.prompt} onChange={(v) => set((x) => { x.prompt = v; }, `p-${sc.id}`)} placeholder="Ex. Léo n’a pas l’air de vouloir supprimer. Que fais-tu ?" /></Field>
      <Switch checked={sc.minimized !== false} onChange={(v) => set((x) => { if (v) delete x.minimized; else x.minimized = false; })} label="Afficher d’abord une pastille « Faire un choix »" hint="L’élève peut relire ses messages avant de décider (recommandé)." />
    </Block>
  );
}

function NarrationFields({ sc, set }) {
  return (
    <>
      <Block n={1} title="Ce qui se passe" sub="Un court texte affiché par-dessus le téléphone." tour="content">
        <Field label="Repère de temps ou de lieu" hint="Ex. « 21 h 47 », « Le lendemain, au collège »."><TodoText value={sc.title} onChange={(v) => set((x) => { x.title = v; }, `t-${sc.id}`)} placeholder="Ex. Le lendemain, au collège" /></Field>
        <Field label="Texte"><TodoText multiline minRows={3} value={sc.text} onChange={(v) => set((x) => { x.text = v; }, `x-${sc.id}`)} placeholder="Écrivez à la 2e personne : « Tu arrives au collège… »" /></Field>
      </Block>
      <Collapse title="Un dialogue hors du téléphone" sub="ex. au bureau de la CPE" icon="quote" count={sc.lines?.length || 0}>
        <LinesEditor lines={sc.lines} onChange={(lines) => set((x) => { x.lines = lines; }, `lines-${sc.id}`)} />
      </Collapse>
      <Collapse title="Lecture à voix haute et affichage" icon="volume" count={(sc.audio ? 1 : 0) + (sc.minimized ? 1 : 0)}>
        <AudioField src={sc.audio} onChange={(p) => set((x) => { if (p.src) x.audio = p.src; else delete x.audio; })} label="Enregistrement du récit (facultatif)" hint="Bouton « Écouter » pour les élèves qui préfèrent entendre le texte." />
        <Switch checked={sc.minimized} onChange={(v) => set((x) => { if (v) x.minimized = true; else delete x.minimized; })} label="Commencer réduit en pastille" />
      </Collapse>
    </>
  );
}

function EndFields({ sc, set }) {
  return (
    <>
      <Block n={1} title="L’écran de fin" sub="Sobre, sans jugement : il aide l’élève à comprendre ce qui s’est passé." tour="content">
        <Field label="Titre de la fin" required><TodoText value={sc.title} onChange={(v) => set((x) => { x.title = v; }, `t-${sc.id}`)} placeholder="Ex. Tu as agi" /></Field>
        <Field label="Texte" hint="Laissez une ligne vide entre deux paragraphes."><TodoText multiline minRows={4} value={sc.text} onChange={(v) => set((x) => { x.text = v; }, `x-${sc.id}`)} placeholder="Ce que l’élève peut retenir. Pensez à donner une ressource (3018, adulte de confiance…)." /></Field>
      </Block>
      <Block n={2} title="Questions pour le débat en classe" sub="Affichées sur l’écran de fin : elles lancent la discussion.">
        <ListEditor items={sc.discuss || []} onChange={(d) => set((x) => { x.discuss = d; }, `d-${sc.id}`)} placeholder="Ex. Qu’aurais-tu fait à sa place ?" addLabel="Ajouter une question" />
      </Block>
      <Collapse title="Version audio du texte de fin" icon="volume" count={sc.audio ? 1 : 0}>
        <AudioField src={sc.audio} onChange={(p) => set((x) => { if (p.src) x.audio = p.src; else delete x.audio; })} label="Enregistrement (facultatif)" hint="Sans enregistrement, le téléphone peut lire le texte avec une voix de synthèse." />
      </Collapse>
    </>
  );
}

const FIELDS = { message: MessageFields, publication: PublicationFields, story: StoryFields, notification: NotificationFields, media: MediaFields, call: CallFields, choice: ChoiceFields, narration: NarrationFields, end: EndFields };

// ── Formulaire complet ──────────────────────────────────────────────────────
export function SceneForm({ id, onTestFrom, backTo, onBack }) {
  const { s, editScenario, select, byScene, story } = useEditor();
  const confirm = useConfirm();
  const sc = byId(s, id);
  if (!sc) return null;
  const info = TYPE_INFO[sc.type];
  const Fields = FIELDS[sc.type];
  const set = (fn, key) => editScenario((x) => fn(byId(x, id)), key);
  const problems = byScene.get(id) || [];
  const isStart = s.start === id;
  const inc = incoming(s, id).filter((x) => x.from);

  const remove = async () => {
    const ok = await confirm({
      title: 'Supprimer cette scène ?',
      message: sc.choices?.length
        ? 'Cette scène propose des choix : les chemins qui en partent ne seront plus reliés à l’histoire (vous les retrouverez en bas du plan, dans « Scènes non reliées »). Vous pourrez annuler avec ↶.'
        : 'Les scènes qui y menaient passeront directement à la suite. Vous pourrez annuler avec ↶.',
      confirmLabel: 'Supprimer', danger: true,
    });
    if (!ok) return;
    const fallback = sc.next || inc[0]?.from || null;
    editScenario((x) => deleteScene(x, id));
    select(fallback);
  };

  const notifyApp = sc.type === 'message' ? 'la conversation' : 'l’appli';
  return (
    <div className="scene-form" key={id}>
      {backTo && <button className="back-link" onClick={onBack}><Icon name="arrowLeft" />Revenir à la scène n° {sceneNumber(backTo)}</button>}
      <div className="sf-hd" data-tour="scene-head">
        <span className="sf-type" style={{ background: info.color }}><Icon name={info.icon} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sf-kicker">Scène n° {sceneNumber(id)}{isStart && <span className="pill accent">Première scène</span>}</div>
          <div className="sf-title">{info.label}</div>
          <div className="sf-help">{info.help}</div>
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={() => onTestFrom(id)} title="Lancer le téléphone de test directement à cette scène"><Icon name="play" />Tester d’ici</button>
          <Menu trigger={({ toggle }) => <button className="btn btn-sm btn-icon" onClick={toggle} aria-label="Autres actions"><Icon name="more" /></button>}
            items={[
              ...TYPE_ORDER.filter((t) => t !== sc.type).map((t) => ({ icon: TYPE_INFO[t].icon, label: `Transformer en « ${TYPE_INFO[t].label} »`, onClick: () => editScenario((x) => changeType(x, id, t)) })),
              '-',
              { icon: 'copy', label: 'Dupliquer la scène', hint: 'La copie est insérée juste après', onClick: () => { let nid; editScenario((x) => { nid = duplicateScene(x, id); }); setTimeout(() => select(nid), 0); } },
              !isStart && { icon: 'flag', label: 'Faire commencer l’histoire ici', onClick: () => editScenario((x) => { x.start = id; }) },
              '-',
              { icon: 'trash', label: 'Supprimer la scène', danger: true, onClick: remove },
            ]} />
        </div>
      </div>

      {problems.filter((p) => p.level !== 'info').length > 0 && (
        <div className="sf-problems">
          {problems.filter((p) => p.level !== 'info').map((p, i) => (
            <div key={i} className={`sf-problem ${p.level}`}><Icon name={p.level === 'error' ? 'alert' : p.level === 'tip' ? 'bulb' : 'info'} />{p.text}</div>
          ))}
        </div>
      )}

      <Fields sc={sc} set={set} />

      <Block n="→" title="Et ensuite ?" sub="Ce qui se passe après cette scène." tour="next">
        <NextEditor scene={sc} />
      </Block>

      {sc.type !== 'end' && (
        <Collapse title="Rythme et apparition" sub="délai, attendre que l’élève ouvre l’appli, notification" icon="clock" count={(sc.delay != null ? 1 : 0) + (sc.trigger === 'open' ? 1 : 0) + (sc.notify === false ? 1 : 0)}>
          <Field label="Délai avant l’apparition (secondes)" hint="Vide : un rythme naturel est choisi automatiquement (le temps de « taper » un message…)." style={{ maxWidth: 360 }}>
            <input type="number" min="0" step="0.5" className="input" value={sc.delay != null ? sc.delay / 1000 : ''} placeholder="automatique" onChange={(e) => set((x) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) x.delay = Math.round(v * 1000); else delete x.delay; }, `delay-${id}`)} />
          </Field>
          {(sc.app || sc.type === 'message') && (
            <Switch checked={sc.trigger === 'open'} onChange={(v) => set((x) => { if (v) x.trigger = 'open'; else delete x.trigger; })} label={`Attendre que l’élève ouvre ${notifyApp}`} hint="La scène n’arrive que quand l’élève va la chercher. Pratique pour la toute première scène." />
          )}
          {['message', 'publication', 'story', 'notification', 'call'].includes(sc.type) && (
            <Switch checked={sc.notify !== false} onChange={(v) => set((x) => { if (v) delete x.notify; else x.notify = false; })} label="Afficher une bannière de notification" hint="Si l’élève n’est pas déjà dans l’appli." />
          )}
        </Collapse>
      )}

      {sc.type === 'message' && sc.sender === 'me' && (
        <Callout icon="bulb" title="Un message écrit par l’élève">
          Il s’affiche tout seul, comme si l’élève l’avait tapé. Pour laisser l’élève <b>choisir</b> quoi répondre, mettez plutôt des choix sur le message précédent : le texte du bouton sera envoyé.
        </Callout>
      )}
      <p className="sf-foot">{inc.length ? <>On arrive ici depuis {inc.map((x, i) => <React.Fragment key={i}>{i ? ', ' : ''}<button className="link" onClick={() => select(x.from)}>n° {sceneNumber(x.from)}</button></React.Fragment>)}.</> : isStart ? 'C’est la première scène de l’histoire.' : 'Aucune scène ne mène ici pour l’instant.'}</p>
    </div>
  );
}

export { whoName, appsFor };
