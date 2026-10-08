import React, { useMemo, useState } from 'react';
import { Icon } from '../../icons.jsx';
import { AutoText, Callout, Field } from '../../ui.jsx';
import { useStore, useStory, useToast } from '../../store.jsx';
import { checkStory } from '../../story/checks.js';
import { buildDeclicFile, fileNameFor } from '../../story/exchange.js';
import { sceneNumber, stats } from '../../story/model.js';
import { STEPS, stepDone } from '../../story/steps.js';
import { openMail, revealFile, saveDeclicFile } from '../../platform.js';
import { TEAM_EMAIL, TEAM_NAME } from '../../config.js';
import { fmtDate, plural } from '../../utils.js';

const LEVEL = { error: { icon: 'alert', label: 'À corriger' }, warning: { icon: 'info', label: 'À vérifier' }, tip: { icon: 'bulb', label: 'Conseil' }, info: { icon: 'info', label: 'Info' } };

/** Étape 6 — vérifier, puis créer le fichier à envoyer à l'équipe. */
export function StepSend({ uid, onOpenScene, onStep }) {
  const { data, mutate } = useStore();
  const { story, edit } = useStory(uid);
  const toast = useToast();
  const check = useMemo(() => checkStory(story), [story]);
  const st = stats(story.scenario);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const p = data.profile;
  const setP = (k, v) => mutate((d) => { d.profile[k] = v; });
  const all = [...check.problems, ...check.tips];
  const profileOk = p.prenom.trim() && p.nom.trim() && p.etablissement.trim();
  // Textes d'exemple (✏️) pas encore réécrits : on n'envoie pas une histoire à moitié écrite.
  const todos = check.problems.filter((x) => x.todo).length;
  const ready = check.ok && todos === 0;

  const exportFile = async () => {
    setBusy(true);
    try {
      const content = await buildDeclicFile(story, data.profile);
      const r = await saveDeclicFile(fileNameFor(story), content);
      if (r?.ok) {
        mutate((d) => { const x = d.stories.find((y) => y.uid === uid); x.status = 'sent'; x.sentAt = new Date().toISOString(); });
        setSaved(r);
        toast('Fichier créé : il ne reste plus qu’à l’envoyer.');
      } else if (!r?.canceled) toast(r?.error || 'Le fichier n’a pas pu être enregistré.', 'error');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const mailto = () => {
    const subject = `Déclic — proposition d’histoire : ${story.scenario.title}`;
    const body = `Bonjour,\n\nVoici une histoire écrite avec StoryLab : « ${story.scenario.title} »${story.meta.niveau ? ` (${story.meta.niveau})` : ''}.\nLe fichier ${saved?.name || '.declic'} est en pièce jointe.\n\n${story.meta.message ? `${story.meta.message}\n\n` : ''}${p.prenom} ${p.nom}\n${[p.discipline, p.etablissement].filter(Boolean).join(', ')}`;
    openMail(`mailto:${TEAM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="step-grid">
      <div className="stack">
        <div className="card" data-tour="checklist">
          <div className="card-hd">
            <div className="card-title"><Icon name="clipboard" />Vérification</div>
            <span className={`pill ${ready ? 'success' : 'danger'}`}>{ready ? 'Prête à envoyer' : check.errors ? plural(check.errors, 'erreur') : 'Textes ✏️ à réécrire'}</span>
          </div>
          <div className="card-body">
            <div className="check-steps">
              {STEPS.filter((x) => x.id !== 'envoyer').map((x) => {
                const ok = stepDone(story, x.id, check);
                return (
                  <button key={x.id} className={`check-step ${ok ? 'ok' : ''}`} onClick={() => onStep(x.id)}>
                    <span className="check-ic"><Icon name={ok ? 'check' : x.icon} /></span>{x.long}
                  </button>
                );
              })}
            </div>
            <div className="check-figures">
              <span><b>{st.scenes}</b> scènes</span><span><b>{st.decisions}</b> décisions</span><span><b>{st.ends}</b> fins</span><span><b>{st.paths}</b> parcours possibles</span><span>≈ <b>{st.minutes}</b> min par partie</span>
            </div>
            {all.length === 0 ? (
              <div className="all-good"><Icon name="sparkles" />Tout est en ordre : votre histoire est prête.</div>
            ) : (
              <ul className="problem-list">
                {all.map((x, i) => (
                  <li key={i} className={x.level}>
                    <span className="pl-badge"><Icon name={LEVEL[x.level].icon} />{LEVEL[x.level].label}</span>
                    <span className="pl-text">{x.sceneId && <b>Scène n° {sceneNumber(x.sceneId)} : </b>}{x.text}</span>
                    {x.sceneId && <button className="btn btn-sm" onClick={() => onOpenScene(x.sceneId)}>Corriger</button>}
                    {!x.sceneId && x.step && <button className="btn btn-sm" onClick={() => onStep(x.step)}>Compléter</button>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card" data-tour="author">
          <div className="card-hd"><div className="card-title"><Icon name="user" />Vos coordonnées</div><span className="card-sub">pour que l’équipe puisse vous répondre</span></div>
          <div className="card-body stack">
            <div className="grid-2">
              <Field label="Prénom" required><input className="input" value={p.prenom} onChange={(e) => setP('prenom', e.target.value)} /></Field>
              <Field label="Nom" required><input className="input" value={p.nom} onChange={(e) => setP('nom', e.target.value)} /></Field>
              <Field label="Établissement" required><input className="input" value={p.etablissement} onChange={(e) => setP('etablissement', e.target.value)} placeholder="Ex. Collège Alfred Crouzet, Servian" /></Field>
              <Field label="Discipline ou fonction"><input className="input" value={p.discipline} onChange={(e) => setP('discipline', e.target.value)} placeholder="Ex. Professeur d’espagnol, CPE…" /></Field>
            </div>
            <Field label="Adresse électronique professionnelle" hint="Utilisée seulement par l’équipe Déclic pour vous répondre."><input className="input" type="email" value={p.email} onChange={(e) => setP('email', e.target.value)} placeholder="prenom.nom@ac-academie.fr" /></Field>
            <Field label="Un message pour l’équipe (facultatif)">
              <AutoText minRows={2} value={story.meta.message} onChange={(v) => edit((x) => { x.meta.message = v; }, 'meta-message')} placeholder="Ex. Testée avec ma classe de 5e, ça marche bien ! J’aimerais qu’elle se lance depuis Pixa." />
            </Field>
          </div>
        </div>
      </div>

      <aside className="stack side-tips">
        <div className={`send-card ${ready ? '' : 'blocked'}`} data-tour="send-card">
          <div className="send-ic"><Icon name="send" /></div>
          <div className="send-title">Envoyer à {TEAM_NAME}</div>
          <p>Le studio crée un fichier <b>.declic</b> qui contient toute l’histoire : textes, images, sons et fiche pédagogique.</p>
          {!check.ok && <p className="send-warn"><Icon name="alert" />Corrigez d’abord {plural(check.errors, 'erreur')} : sinon l’histoire ne pourrait pas être jouée.</p>}
          {check.ok && todos > 0 && <p className="send-warn"><Icon name="edit" />Réécrivez d’abord les textes d’exemple marqués ✏️ ({plural(todos, 'scène')}).</p>}
          {ready && !profileOk && <p className="send-warn"><Icon name="user" />Indiquez votre prénom, votre nom et votre établissement.</p>}
          <button className="btn btn-primary btn-block btn-lg" disabled={!ready || !profileOk || busy} onClick={exportFile}><Icon name="download" />{busy ? 'Préparation…' : 'Créer le fichier à envoyer'}</button>
          {story.status === 'sent' && story.sentAt && !saved && <p className="tiny-note"><Icon name="check" />Fichier déjà créé le {fmtDate(story.sentAt)}. Recréez-le si vous avez modifié l’histoire.</p>}
          {story.status === 'changed' && <p className="tiny-note"><Icon name="info" />Modifiée depuis le dernier envoi : recréez le fichier.</p>}
          {saved && (
            <div className="send-done">
              <div className="row"><Icon name="check" /><b>{saved.name}</b></div>
              <ol>
                <li>Écrivez à {TEAM_NAME}{TEAM_EMAIL ? <> (<b>{TEAM_EMAIL}</b>)</> : ''}.</li>
                <li>Joignez ce fichier au message.</li>
                <li>L’équipe le teste, le publie, et vous envoie le lien pour vos élèves.</li>
              </ol>
              <div className="row-wrap">
                {TEAM_EMAIL && <button className="btn btn-success" onClick={mailto}><Icon name="mail" />Écrire à l’équipe</button>}
                {saved.path && <button className="btn" onClick={() => revealFile(saved.path)}><Icon name="folder" />Afficher le fichier</button>}
              </div>
            </div>
          )}
        </div>
        <Callout icon="refresh" title="Et après ?">
          L’équipe peut vous demander des modifications : rouvrez simplement l’histoire ici, corrigez, et renvoyez un nouveau fichier.
        </Callout>
      </aside>
    </div>
  );
}
