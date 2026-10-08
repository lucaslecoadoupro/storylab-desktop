import React from 'react';
import { Icon } from '../../icons.jsx';
import { Avatar } from '../../ui.jsx';
import { appInfo, byId, incoming } from '../../story/model.js';
import { useEditor } from './context.jsx';
import { AppIcon } from './pickers.jsx';
import { useMediaUrl } from './media.jsx';

/**
 * Aperçu immédiat de la scène sélectionnée, dans un petit téléphone.
 * Ce n'est qu'une esquisse : « Tester » lance le vrai téléphone Déclic.
 */
const name = (s, id) => (id === 'me' ? 'Moi' : id === 'system' ? 'Info' : s.contacts?.[id]?.name || '…');
const strip = (t) => (t || '').replace(/^✏️\s*/, '');

function Img({ src, alt, className = '' }) {
  const url = useMediaUrl(src);
  return url ? <img className={`mp-img ${className}`} src={url} alt={alt || ''} /> : <div className={`mp-img ph ${className}`}><Icon name="image" /><span>{strip(alt) || 'Photo'}</span></div>;
}

function Bubble({ s, sc, faded }) {
  const me = sc.sender === 'me';
  const sys = sc.sender === 'system';
  const c = sc.content || {};
  if (sys) return <div className={`mp-sys ${faded ? 'faded' : ''}`}>{strip(c.text)}</div>;
  return (
    <div className={`mp-msg ${me ? 'me' : ''} ${faded ? 'faded' : ''}`}>
      {!me && <span className="mp-from">{name(s, sc.sender)}</span>}
      <div className="mp-bubble">
        {c.type === 'image' && <Img src={c.src} alt={c.alt} />}
        {c.type === 'audio' && <span className="mp-voice"><Icon name="play" /><span className="mp-wave" />{c.duration ? `0:${String(c.duration).padStart(2, '0')}` : '0:08'}</span>}
        {c.type !== 'audio' && c.text && <span>{strip(c.text)}</span>}
        {!c.text && c.type === 'text' && <span className="mp-empty">…</span>}
      </div>
      {sc.reactions?.length > 0 && <span className="mp-reacts">{sc.reactions.map((r) => r.emoji).join('')}</span>}
    </div>
  );
}

function Choices({ sc, dark }) {
  if (!sc.choices?.length) return null;
  return (
    <div className={`mp-choices ${dark ? 'dark' : ''}`}>
      {sc.choices.map((c, i) => <span key={i} className="mp-choice">{c.react ? `${c.react} ` : ''}{strip(c.label) || '…'}</span>)}
    </div>
  );
}

/** Messages précédents de la même conversation (en remontant l'histoire). */
function previousInThread(s, sc, max = 3) {
  const key = sc.thread || sc.sender;
  const out = [];
  let cur = incoming(s, sc.id).find((x) => x.from)?.from;
  const seen = new Set();
  while (cur && out.length < max && !seen.has(cur)) {
    seen.add(cur);
    const p = byId(s, cur);
    if (p?.type === 'message' && (p.thread || p.sender) === key && p.app === sc.app) out.unshift(p);
    cur = incoming(s, cur).find((x) => x.from)?.from;
  }
  return out;
}

function Screen({ s, sc }) {
  const app = sc.app ? appInfo(sc.app) : null;
  switch (sc.type) {
    case 'message': {
      const thread = sc.thread || sc.sender;
      return (
        <div className={`mp-app mp-chat app-${sc.app}`}>
          <div className="mp-bar"><Icon name="chevronLeft" /><Avatar name={name(s, thread)} size={22} /><b>{name(s, thread)}</b><span className="spacer" /><AppIcon id={sc.app} size={16} /></div>
          <div className="mp-thread">
            {previousInThread(s, sc).map((p) => <Bubble key={p.id} s={s} sc={p} faded />)}
            <Bubble s={s} sc={sc} />
          </div>
          <Choices sc={sc} />
        </div>
      );
    }
    case 'publication': {
      const c = sc.content || {};
      if (sc.app === 'clan') {
        return (
          <div className="mp-app mp-clan">
            <div className="mp-bar dark"><b>Clan</b></div>
            <div className="mp-checkin">
              <Avatar name={name(s, sc.author)} size={30} />
              <div><b>{name(s, sc.author)}</b> est à <b>{strip(sc.place) || '…'}</b>{sc.with?.length ? <> avec {sc.with.map((w) => name(s, w)).join(', ')}</> : null}</div>
            </div>
            {c.text && <div className="mp-caption">« {strip(c.text)} »</div>}
            {(sc.comments || []).map((cm, i) => <div key={i} className="mp-comment"><b>{name(s, cm.author)}</b> {strip(cm.text)}</div>)}
            <Choices sc={sc} />
          </div>
        );
      }
      return (
        <div className="mp-app mp-feed">
          <div className="mp-bar"><b className="mp-logo">Pixa</b><span className="spacer" /><Icon name="heart" /></div>
          <div className="mp-post">
            <div className="mp-post-hd"><Avatar name={name(s, sc.author)} size={22} /><div><b>{name(s, sc.author)}</b>{sc.place && <small>{strip(sc.place)}</small>}</div></div>
            {c.type === 'image' && <Img src={c.src} alt={c.alt} className="square" />}
            <div className="mp-post-actions"><Icon name="heart" /><Icon name="message" /><Icon name="send" /></div>
            <div className="mp-likes">{sc.likes ?? 0} J’aime</div>
            {c.text && <div className="mp-caption"><b>{name(s, sc.author)}</b> {strip(c.text)}</div>}
            {(sc.comments || []).slice(0, 3).map((cm, i) => <div key={i} className="mp-comment"><b>{name(s, cm.author)}</b> {strip(cm.text)}</div>)}
          </div>
          <Choices sc={sc} />
        </div>
      );
    }
    case 'story': {
      const f = sc.frames?.[0] || {};
      return (
        <div className="mp-app mp-story">
          <div className="mp-story-bars">{(sc.frames || [0]).map((_, i) => <span key={i} className={i === 0 ? 'on' : ''} />)}</div>
          <div className="mp-story-hd"><Avatar name={name(s, sc.author)} size={20} /><b>{name(s, sc.author)}</b></div>
          <div className="mp-story-body">{f.type === 'image' ? <Img src={f.src} alt={f.alt} className="cover" /> : <p>{strip(f.text) || '…'}</p>}</div>
          <Choices sc={sc} dark />
        </div>
      );
    }
    case 'notification':
      return (
        <div className="mp-home">
          <div className="mp-banner"><AppIcon id={sc.app} size={22} /><div><b>{strip(sc.title) || app?.name}</b><span>{strip(sc.text) || '…'}</span></div></div>
          <div className="mp-icons">{['papote', 'pixa', 'flash', 'clan'].map((a) => <AppIcon key={a} id={a} size={34} />)}</div>
        </div>
      );
    case 'media':
      return (
        <div className="mp-app mp-photos">
          <div className="mp-bar"><b>Photos</b></div>
          <div className="mp-grid"><span /><span /><span /><span /><Img src={sc.content?.src} alt={sc.content?.alt} className="hl" /></div>
        </div>
      );
    case 'call':
      return (
        <div className="mp-call">
          <Avatar name={name(s, sc.caller)} size={58} />
          <div className="mp-call-name">{name(s, sc.caller)}</div>
          <div className="mp-call-state">{sc.lines?.length ? 'Appel en cours…' : sc.direction === 'outgoing' ? 'Appel…' : `Appel entrant${sc.app === 'papote' ? ' Papote' : ''}…`}</div>
          {sc.lines?.length ? (
            <div className="mp-subs">{sc.lines.slice(0, 3).map((l, i) => <div key={i} className={l.speaker === 'me' ? 'me' : ''}><b>{l.speaker === 'me' ? 'Toi' : name(s, l.speaker)}</b> {strip(l.text)}</div>)}</div>
          ) : (
            <div className="mp-call-btns"><span className="no"><Icon name="phoneCall" /></span><span className="yes"><Icon name="phoneCall" /></span></div>
          )}
        </div>
      );
    case 'choice':
      return (
        <div className="mp-home dim">
          <div className="mp-sheet">
            <div className="mp-sheet-kicker">Faire un choix</div>
            <div className="mp-sheet-q">{strip(sc.prompt) || 'Que fais-tu ?'}</div>
            {(sc.choices || []).map((c, i) => <span key={i} className="mp-sheet-btn">{strip(c.label) || '…'}</span>)}
          </div>
        </div>
      );
    case 'narration':
      return (
        <div className="mp-home dim">
          <div className="mp-narr">
            {sc.title && <div className="mp-narr-title">{strip(sc.title)}</div>}
            <p>{strip(sc.text) || '…'}</p>
            {(sc.lines || []).slice(0, 3).map((l, i) => <p key={i} className="mp-narr-line"><b>{l.speaker === 'me' ? 'Toi' : name(s, l.speaker)} :</b> {strip(l.text)}</p>)}
            <span className="mp-sheet-btn">{sc.choices?.length ? strip(sc.choices[0].label) || '…' : 'Continuer'}</span>
          </div>
        </div>
      );
    case 'end':
      return (
        <div className="mp-end">
          <div className="mp-end-kicker">Fin de l’histoire</div>
          <div className="mp-end-title">{strip(sc.title) || '…'}</div>
          {(sc.text || '').split(/\n\s*\n/).filter(Boolean).slice(0, 2).map((p, i) => <p key={i}>{strip(p)}</p>)}
          {sc.discuss?.length > 0 && <div className="mp-end-q"><b>À débattre</b>{sc.discuss.slice(0, 3).map((q, i) => <span key={i}>{strip(q)}</span>)}</div>}
          <span className="mp-end-btn">Recommencer l’histoire</span>
        </div>
      );
    default:
      return null;
  }
}

export function MiniPhone({ id }) {
  const { s } = useEditor();
  const sc = id ? byId(s, id) : null;
  return (
    <div className="mini-phone" data-tour="mini-phone" aria-label="Aperçu de la scène">
      <div className="mp-frame">
        <div className="mp-status"><span>9:41</span><span className="mp-notch" /><span>●●● 5G</span></div>
        <div className="mp-screen">{sc ? <Screen s={s} sc={sc} /> : <div className="mp-home"><div className="mp-icons">{['papote', 'pixa', 'flash', 'clan'].map((a) => <AppIcon key={a} id={a} size={34} />)}</div></div>}</div>
      </div>
      <div className="mp-caption-under">Aperçu rapide · le vrai rendu est dans « Tester »</div>
    </div>
  );
}
