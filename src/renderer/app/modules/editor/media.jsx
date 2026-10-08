import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../icons.jsx';
import { AutoText, Field, Seg } from '../../ui.jsx';
import { media } from '../../platform.js';
import { useToast } from '../../store.jsx';
import { fmtSeconds, importAudio, importImage, RECORD_MAX_SECONDS, startRecording } from '../../story/media.js';
import { isTodo } from '../../story/templates.js';

/** Adresse affichable d'un média du studio. */
export function useMediaUrl(src) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!src) { setUrl(null); return undefined; }
    media.url(src).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [src]);
  return url;
}

/** Champ texte qui signale les textes d'exemple (✏️) à réécrire. */
export function TodoText({ value, onChange, multiline, placeholder, minRows = 2, className = '', ...rest }) {
  const todo = isTodo(value);
  const props = {
    value: value ?? '',
    placeholder,
    className: `${multiline ? '' : 'input'} ${todo ? 'is-todo' : ''} ${className}`,
    // Un clic dans un texte d'exemple le sélectionne entièrement : il suffit de taper.
    onFocus: (e) => { if (todo) e.target.select(); },
    ...rest,
  };
  return multiline ? <AutoText {...props} minRows={minRows} onChange={onChange} /> : <input {...props} onChange={(e) => onChange(e.target.value)} />;
}

// ── Image ───────────────────────────────────────────────────────────────────
export function ImageField({ src, alt, onChange, altLabel = 'Description de l’image', compact }) {
  const url = useMediaUrl(src);
  const input = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const take = async (file) => {
    if (!file) return;
    setBusy(true);
    try { const r = await importImage(file); onChange({ src: r.src }); toast('Image ajoutée (compressée pour le téléphone).'); } catch (e) { toast(e.message, 'error', 5000); } finally { setBusy(false); }
  };
  return (
    <div className={`image-field ${compact ? 'compact' : ''}`}>
      <div
        className={`image-drop ${over ? 'over' : ''} ${url ? 'has' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
        role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') input.current?.click(); }}
        aria-label={url ? 'Changer l’image' : 'Ajouter une image'}
      >
        {url ? <img src={url} alt={alt || ''} /> : (
          <div className="image-drop-empty">
            <Icon name="image" />
            <b>{busy ? 'Préparation…' : 'Ajouter une image'}</b>
            <span>Glissez une image ici ou cliquez · facultatif</span>
          </div>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="image-side">
        <Field label={altLabel} required help="Elle s’affiche tant que l’image n’est pas fournie, et elle est lue aux élèves malvoyants. Décrivez ce qu’on voit, en une phrase.">
          <TodoText value={alt} onChange={(v) => onChange({ alt: v })} placeholder="Ex. Selfie de Léa et Emma devant le collège" />
        </Field>
        {url && <button type="button" className="btn btn-sm btn-quiet" onClick={() => onChange({ src: undefined })}><Icon name="trash" />Retirer l’image</button>}
        {!compact && (
          <p className="tiny-note"><Icon name="lock" />Pas de photo d’élèves ou de personnes réelles reconnaissables : utilisez des illustrations, des photos libres de droits ou des mises en scène sans visage.</p>
        )}
      </div>
    </div>
  );
}

// ── Son ─────────────────────────────────────────────────────────────────────
export function AudioField({ src, onChange, label = 'Enregistrement', hint }) {
  const url = useMediaUrl(src);
  const toast = useToast();
  const input = useRef(null);
  const rec = useRef(null);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    const r = rec.current;
    rec.current = null;
    setRecording(false);
    if (!r) return;
    setBusy(true);
    try { const out = await r.stop(); onChange({ src: out.src, duration: out.duration }); toast('Enregistrement ajouté.'); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const start = async () => {
    try {
      setSecs(0);
      rec.current = await startRecording((s, limit) => { setSecs(s); if (limit) finish(); });
      setRecording(true);
    } catch (e) { toast(e.message, 'error', 6000); }
  };
  useEffect(() => () => rec.current?.cancel(), []);
  const take = async (file) => {
    if (!file) return;
    setBusy(true);
    try { const r = await importAudio(file); onChange({ src: r.src, duration: r.duration }); toast('Son ajouté.'); } catch (e) { toast(e.message, 'error', 6000); } finally { setBusy(false); }
  };

  return (
    <div className="audio-field">
      <span className="field-label">{label}</span>
      {url && !recording ? (
        <div className="audio-row">
          <audio controls src={url} preload="metadata" />
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => onChange({ src: undefined, duration: undefined })}><Icon name="trash" />Retirer</button>
        </div>
      ) : (
        <div className="audio-row">
          {recording ? (
            <button type="button" className="btn btn-danger" onClick={finish}><Icon name="stop" />Arrêter ({fmtSeconds(secs)} / {fmtSeconds(RECORD_MAX_SECONDS)})</button>
          ) : (
            <button type="button" className="btn" onClick={start} disabled={busy}><Icon name="mic" />Enregistrer au micro</button>
          )}
          {!recording && <button type="button" className="btn btn-quiet" onClick={() => input.current?.click()} disabled={busy}><Icon name="upload" />Importer un son</button>}
          {recording && <span className="rec-dot" aria-label="Enregistrement en cours" />}
          <input ref={input} type="file" accept="audio/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

// ── Contenu d'un message, d'une publication, d'un écran de story ────────────
export function ContentEditor({ content, onChange, kinds = ['text', 'image', 'audio'], textLabel = 'Texte', textPlaceholder, captionLabel = 'Légende (facultative)' }) {
  const c = content || { type: 'text', text: '' };
  const set = (patch) => onChange({ ...c, ...patch });
  const opts = [
    { value: 'text', label: 'Texte', icon: 'type' },
    { value: 'image', label: 'Photo', icon: 'image' },
    { value: 'audio', label: 'Message vocal', icon: 'mic' },
  ].filter((o) => kinds.includes(o.value));
  return (
    <div className="content-editor">
      {opts.length > 1 && <Seg value={c.type} onChange={(type) => set({ type })} options={opts} />}
      {c.type === 'text' && (
        <Field label={textLabel}>
          <TodoText multiline value={c.text} onChange={(text) => set({ text })} placeholder={textPlaceholder || 'Écrivez comme on écrit vraiment sur un téléphone : court, naturel, avec des emojis si besoin 🙂'} />
        </Field>
      )}
      {c.type === 'image' && (
        <>
          <ImageField src={c.src} alt={c.alt} onChange={(p) => set(p)} />
          <Field label={captionLabel}>
            <TodoText value={c.text} onChange={(text) => set({ text })} placeholder="Texte qui accompagne la photo" />
          </Field>
        </>
      )}
      {c.type === 'audio' && (
        <>
          <AudioField src={c.src} onChange={(p) => set(p)} label="Message vocal" hint="1 min 30 au plus. Sans enregistrement, le téléphone lit la transcription avec une voix de synthèse." />
          <Field label="Transcription" help="Affichée sous le message vocal à la demande : indispensable pour les élèves qui n’entendent pas bien, ou sans casque.">
            <TodoText multiline value={c.text} onChange={(text) => set({ text })} placeholder="Ce que dit le message vocal, mot pour mot" />
          </Field>
        </>
      )}
    </div>
  );
}
