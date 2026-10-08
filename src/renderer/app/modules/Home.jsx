import React, { useMemo } from 'react';
import { Icon, Logo } from '../icons.jsx';
import { Menu, PageHeader, useConfirm } from '../ui.jsx';
import { newStoryRecord, useStore, useToast } from '../store.jsx';
import { useNav, useTour } from '../nav.jsx';
import { checkStory } from '../story/checks.js';
import { buildDeclicFile, fileNameFor, readDeclicFile } from '../story/exchange.js';
import { stats } from '../story/model.js';
import { progressOf, STEPS, stepIndex } from '../story/steps.js';
import { THEMES } from '../story/templates.js';
import { openDeclicFile, saveDeclicFile } from '../platform.js';
import { deep, plural, timeAgo, uid as makeUid } from '../utils.js';
import { useOpenExample } from './NewStory.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour';
}

const STATUS = {
  draft: { label: 'Brouillon', cls: '' },
  sent: { label: 'Envoyée', cls: 'success' },
  changed: { label: 'Modifiée depuis l’envoi', cls: 'warning' },
};

/** Ouvrir un fichier .declic (histoire envoyée par un collègue, sauvegarde…). */
export function useImportFile() {
  const { mutate } = useStore();
  const nav = useNav();
  const toast = useToast();
  return async (file) => {
    const f = file || await openDeclicFile();
    if (!f) return;
    if (f.error) { toast(f.error, 'error'); return; }
    try {
      const rec = await readDeclicFile(f.text);
      mutate((d) => { d.stories.unshift(rec); });
      toast(`« ${rec.scenario.title} » ajoutée à vos histoires.`);
      nav({ page: 'story', uid: rec.uid, step: 'scenes' });
    } catch (e) { toast(e.message, 'error', 5000); }
  };
}

export function StoryTile({ story }) {
  const nav = useNav();
  const { data, mutate } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const check = useMemo(() => checkStory(story), [story]);
  const st = stats(story.scenario);
  const pct = progressOf(story, check);
  const theme = THEMES.find((t) => t.id === story.meta.theme);
  const status = STATUS[story.status] || STATUS.draft;
  const step = STEPS[stepIndex(story.step)];
  const open = () => nav({ page: 'story', uid: story.uid, step: story.step || 'projet' });

  const duplicate = () => {
    const copy = deep(story);
    copy.uid = makeUid('h');
    copy.scenario.title = `${story.scenario.title} (copie)`;
    copy.status = 'draft'; copy.sentAt = null; copy.example = false;
    copy.createdAt = copy.updatedAt = new Date().toISOString();
    mutate((d) => { d.stories.unshift(copy); });
    toast('Copie créée.');
  };
  const saveCopy = async () => {
    const r = await saveDeclicFile(fileNameFor(story), await buildDeclicFile(story, data.profile));
    if (r?.ok) toast('Copie enregistrée (fichier .declic).');
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Supprimer cette histoire ?', message: `« ${story.scenario.title} » sera définitivement supprimée de ce studio. Si vous l’avez envoyée, l’équipe garde son exemplaire.`, confirmLabel: 'Supprimer', danger: true }))) return;
    mutate((d) => { d.stories = d.stories.filter((x) => x.uid !== story.uid); });
  };

  return (
    <div className="tile story-tile" onClick={open} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') open(); }}>
      <div className="tile-top">
        <div className="tile-icon" style={{ background: story.example ? 'linear-gradient(135deg,#d97706,#db2777)' : 'linear-gradient(135deg,#3b5bdb,#7c3aed)' }}><Icon name={theme?.icon || 'smartphone'} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="tile-title">{story.scenario.title || 'Sans titre'}</div>
          <div className="tile-sub">{[story.meta.niveau, theme?.label].filter(Boolean).join(' · ') || 'Niveau et thème à préciser'}</div>
        </div>
      </div>
      <div className="tile-meta">
        <span className="pill"><Icon name="route" />{plural(st.scenes, 'scène')}</span>
        <span className="pill"><Icon name="flag" />{plural(st.ends, 'fin')}</span>
        {check.errors > 0 ? <span className="pill danger"><Icon name="alert" />{plural(check.errors, 'erreur')}</span> : <span className={`pill ${status.cls}`}>{status.label}</span>}
        {story.example && <span className="pill warning">Exemple</span>}
      </div>
      <div>
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="tile-foot"><span>Étape : {step?.long}</span><span>{timeAgo(story.updatedAt)}</span></div>
      </div>
      <div className="tile-menu">
        <Menu trigger={({ toggle }) => <button className="btn btn-sm btn-icon" onClick={toggle} aria-label="Actions"><Icon name="more" /></button>}
          items={[
            { icon: 'edit', label: 'Ouvrir', onClick: open },
            { icon: 'copy', label: 'Dupliquer', hint: 'Pour en faire une variante', onClick: duplicate },
            { icon: 'save', label: 'Enregistrer une copie (.declic)', hint: 'Sauvegarde ou partage avec un collègue', onClick: saveCopy },
            '-',
            { icon: 'trash', label: 'Supprimer', danger: true, onClick: remove },
          ]} />
      </div>
    </div>
  );
}

export function HomePage({ onNew }) {
  const { data } = useStore();
  const nav = useNav();
  const tour = useTour();
  const openExample = useOpenExample();
  const importFile = useImportFile();
  const stories = [...data.stories].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const mine = stories.filter((s) => !s.example);
  const empty = mine.length === 0;
  const ready = mine.filter((s) => checkStory(s).ok).length;
  const sent = mine.filter((s) => s.status === 'sent').length;
  const last = mine[0];

  return (
    <>
      <PageHeader badge="Accueil" badgeIcon="home" title={`${greeting()}${data.profile.prenom ? ` ${data.profile.prenom}` : ''} 👋`}
        sub="Écrivez des histoires interactives que vos élèves vivront dans un téléphone fictif."
        actions={last ? <button className="btn btn-white" onClick={() => nav({ page: 'story', uid: last.uid, step: last.step || 'projet' })}><Icon name="edit" />Reprendre « {last.scenario.title} »</button> : null}
        stats={[
          { label: 'Mes histoires', value: mine.length },
          { label: 'Scènes écrites', value: mine.reduce((a, s) => a + s.scenario.scenes.length, 0) },
          { label: 'Prêtes à envoyer', value: ready },
          { label: 'Envoyées', value: sent },
        ]} />
      <div className="page-content">
        {empty && (
          <div className="card welcome-card" data-tour="welcome-card">
            <div className="card-body hero-welcome">
              <Logo size={64} />
              <div style={{ flex: 1 }}>
                <div className="slab" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bienvenue dans StoryLab</div>
                <div className="muted" style={{ fontSize: '.86rem', marginTop: '.25rem', maxWidth: 640, lineHeight: 1.55 }}>
                  Imaginez une situation, écrivez les messages, les publications et les appels que recevra l’élève, puis les choix qui feront évoluer l’histoire. Testez-la dans le vrai téléphone Déclic, et envoyez-la à l’équipe qui la publiera pour vos élèves.
                </div>
              </div>
              <div className="stack" style={{ gap: '.45rem' }}>
                <button className="btn btn-primary btn-lg" onClick={onNew}><Icon name="plus" />Créer ma première histoire</button>
                <button className="btn" onClick={() => openExample()}><Icon name="sparkles" />Explorer l’exemple</button>
                <button className="btn btn-quiet" onClick={() => tour.start('main')}><Icon name="compass" />Visite guidée (2 min)</button>
              </div>
            </div>
          </div>
        )}

        <div className="quick-actions" data-tour="quick-actions">
          <button className="qa" onClick={onNew} data-tour="new-story">
            <div className="qa-icon" style={{ background: 'linear-gradient(135deg,#3b5bdb,#7c3aed)' }}><Icon name="plus" /></div>
            <div className="qa-title">Nouvelle histoire</div>
            <div className="qa-sub">Partez d’une structure prête à remplir, guidé pas à pas.</div>
          </button>
          <button className="qa" onClick={() => openExample()}>
            <div className="qa-icon" style={{ background: 'linear-gradient(135deg,#d97706,#db2777)' }}><Icon name="sparkles" /></div>
            <div className="qa-title">Explorer l’exemple</div>
            <div className="qa-sub">« La photo de trop » : une histoire complète à jouer et à décortiquer.</div>
          </button>
          <button className="qa" onClick={() => importFile()}>
            <div className="qa-icon" style={{ background: 'linear-gradient(135deg,#0f9b6e,#0891b2)' }}><Icon name="upload" /></div>
            <div className="qa-title">Ouvrir un fichier .declic</div>
            <div className="qa-sub">Une histoire d’un collègue, ou une copie que vous avez enregistrée.</div>
          </button>
          <button className="qa" onClick={() => nav({ page: 'guide' })}>
            <div className="qa-icon" style={{ background: 'linear-gradient(135deg,#475569,#1a2440)' }}><Icon name="book" /></div>
            <div className="qa-title">Guide de l’auteur</div>
            <div className="qa-sub">Types de scènes, effets des choix, conseils d’écriture.</div>
          </button>
        </div>

        <div className="how mt-3" data-tour="how">
          {[
            { icon: 'bulb', t: 'Imaginez', d: 'Une situation proche des élèves et un vrai dilemme.' },
            { icon: 'edit', t: 'Écrivez', d: 'Messages, publications, appels… et les choix de l’élève.' },
            { icon: 'play', t: 'Testez', d: 'Dans le vrai téléphone Déclic, comme vos élèves.' },
            { icon: 'send', t: 'Envoyez', d: 'Un fichier à l’équipe, qui publie et vous donne le lien.' },
          ].map((x, i) => (
            <div key={x.t} className="how-step"><span className="how-n">{i + 1}</span><Icon name={x.icon} /><div><b>{x.t}</b><span>{x.d}</span></div></div>
          ))}
        </div>

        {stories.length > 0 && (
          <>
            <div className="section-title mt-3"><Icon name="layers" />Mes histoires<button className="btn btn-sm btn-quiet" onClick={() => nav({ page: 'stories' })}>Tout voir<Icon name="arrowRight" /></button></div>
            <div className="grid-auto">{stories.slice(0, 6).map((s) => <StoryTile key={s.uid} story={s} />)}</div>
          </>
        )}
      </div>
    </>
  );
}

export function StoriesPage({ onNew }) {
  const { data } = useStore();
  const importFile = useImportFile();
  const stories = [...data.stories].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return (
    <>
      <PageHeader badge="Mes histoires" badgeIcon="layers" title="Mes histoires" sub="Toutes les histoires de ce studio, enregistrées sur cet ordinateur."
        actions={<>
          <button className="btn btn-ghost" onClick={() => importFile()}><Icon name="upload" />Ouvrir un fichier</button>
          <button className="btn btn-white" onClick={onNew}><Icon name="plus" />Nouvelle histoire</button>
        </>} />
      <div className="page-content">
        <div className="grid-auto">
          {stories.map((s) => <StoryTile key={s.uid} story={s} />)}
          <button className="tile add" onClick={onNew}><Icon name="plus" /><span>Nouvelle histoire</span></button>
        </div>
      </div>
    </>
  );
}

export { newStoryRecord };
