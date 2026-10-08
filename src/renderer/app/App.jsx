import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from './store.jsx';
import { NavCtx, useTour } from './nav.jsx';
import { Icon, Logo } from './icons.jsx';
import { isDesktop, isMac, onFileOpened, onMenu, pendingFile } from './platform.js';
import { APP_VERSION } from './config.js';
import { STEPS } from './story/steps.js';
import { HomePage, StoriesPage, useImportFile } from './modules/Home.jsx';
import { StoryPage } from './modules/Story.jsx';
import { GuidePage } from './modules/Guide.jsx';
import { SettingsPage } from './modules/Settings.jsx';
import { NewStoryModal, useOpenExample } from './modules/NewStory.jsx';
import { TourProvider } from './tour/Tour.jsx';
import { Welcome } from './tour/Welcome.jsx';

const NAV = [
  { section: 'Studio', items: [
    { id: 'home', icon: 'home', label: 'Accueil', match: ['home'] },
    { id: 'stories', icon: 'layers', label: 'Mes histoires', match: ['stories'] },
  ] },
  { section: 'Aide', items: [
    { id: 'guide', icon: 'book', label: 'Guide de l’auteur', match: ['guide'] },
    { id: 'settings', icon: 'settings', label: 'Réglages', match: ['settings'] },
  ] },
];

function Shell({ route, nav, onNew }) {
  const { data, mutate, saveState } = useStore();
  const tour = useTour();
  const [collapsed, setCollapsed] = useState(false);
  const p = data.profile;
  const who = [p.prenom, p.nom].filter(Boolean).join(' ');
  const current = route.page === 'story' ? data.stories.find((s) => s.uid === route.uid) : null;
  const importFile = useImportFile();

  // Menus de l'application (Fichier → Nouvelle histoire…) et fichiers ouverts par double-clic.
  useEffect(() => onMenu((v) => {
    if (v === 'new') onNew();
    if (v === 'open') importFile();
    if (v === 'tour') tour.start('main');
    if (v === 'guide') nav({ page: 'guide' });
  }), [onNew, importFile, tour, nav]);
  useEffect(() => {
    pendingFile().then((f) => { if (f) importFile(f); });
    return onFileOpened((f) => importFile(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let page;
  switch (route.page) {
    case 'stories': page = <StoriesPage onNew={onNew} />; break;
    case 'story': page = <StoryPage key={route.uid} uid={route.uid} step={route.step} scene={route.scene} from={route.from} />; break;
    case 'guide': page = <GuidePage />; break;
    case 'settings': page = <SettingsPage />; break;
    default: page = <HomePage onNew={onNew} />;
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-tour="sidebar">
        <div className="sb-drag" />
        <div className="sb-logo" style={collapsed ? { justifyContent: 'center', padding: '.875rem .4rem' } : undefined}>
          <div className="sb-logo-icon"><Logo size={34} /></div>
          {!collapsed && <div className="sb-logo-text">StoryLab<span>Histoires interactives Déclic</span></div>}
        </div>
        <nav className="sb-nav">
          {!collapsed && (
            <button className="sb-new" onClick={onNew}><Icon name="plus" />Nouvelle histoire</button>
          )}
          {NAV.map((sec) => (
            <div key={sec.section}>
              {!collapsed ? <div className="sb-section-label">{sec.section}</div> : <div style={{ height: '.6rem' }} />}
              {sec.items.map((it) => {
                const on = it.match.includes(route.page);
                const badge = it.id === 'stories' && data.stories.length ? data.stories.length : null;
                return (
                  <button key={it.id} className={`sb-item ${on ? 'on' : ''}`} onClick={() => nav({ page: it.id })} title={collapsed ? it.label : undefined} style={collapsed ? { justifyContent: 'center', padding: '.55rem 0' } : undefined}>
                    <Icon name={it.icon} />
                    {!collapsed && <span>{it.label}</span>}
                    {!collapsed && badge != null && <span className="sb-badge">{badge}</span>}
                  </button>
                );
              })}
              {sec.section === 'Studio' && current && !collapsed && (
                <div className="sb-current">
                  <div className="sb-section-label">Histoire ouverte</div>
                  <div className="sb-current-title">{current.scenario.title || 'Sans titre'}</div>
                  {STEPS.map((st, i) => (
                    <button key={st.id} className={`sb-item sb-sub ${route.step === st.id ? 'on' : ''}`} onClick={() => nav({ page: 'story', uid: current.uid, step: st.id })}>
                      <span className="sb-step-n">{i + 1}</span><span>{st.long}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sb-footer">
          {!collapsed && (
            <button className="sb-profile" onClick={() => nav({ page: 'settings' })}>
              <div className="sb-avatar">{(p.prenom || p.nom ? `${(p.prenom || '')[0] || ''}${(p.nom || '')[0] || ''}` : 'DS').toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className="sb-profile-name">{who || 'Mon profil'}</div>
                <div className="sb-profile-meta">{[p.discipline, p.etablissement].filter(Boolean).join(' · ') || 'Compléter mon profil'}</div>
              </div>
            </button>
          )}
          <div className="sb-bottom-row" style={collapsed ? { flexDirection: 'column', gap: '.3rem' } : undefined}>
            {!collapsed && <span className="sb-version">v{APP_VERSION} · {saveState === 'saving' ? 'enregistrement…' : saveState === 'error' ? '⚠ non enregistré' : 'enregistré'}</span>}
            <div className="row" style={{ gap: 2, flexDirection: collapsed ? 'column' : 'row' }}>
              <button className="sb-icon-btn" title="Visite guidée" aria-label="Visite guidée" onClick={() => tour.start('main')}><Icon name="help" /></button>
              <button className="sb-icon-btn" title={data.settings.theme === 'dark' ? 'Thème clair' : 'Thème sombre'} aria-label="Changer de thème" onClick={() => mutate((d) => { d.settings.theme = d.settings.theme === 'dark' ? 'light' : 'dark'; })}>
                <Icon name={data.settings.theme === 'dark' ? 'sun' : 'moon'} />
              </button>
              <button className="sb-icon-btn" title={collapsed ? 'Déplier le menu' : 'Replier le menu'} aria-label="Replier le menu" onClick={() => setCollapsed(!collapsed)}><Icon name="sidebar" /></button>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-area">{page}</main>
    </div>
  );
}

export function App() {
  const { data } = useStore();
  const [route, setRoute] = useState({ page: 'home' });
  const [creating, setCreating] = useState(false);
  const nav = useCallback((r) => setRoute(r), []);
  const onNew = useCallback(() => setCreating(true), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.settings.theme || 'light');
    document.documentElement.classList.toggle('is-mac', isDesktop && isMac);
  }, [data.settings.theme]);

  return (
    <NavCtx.Provider value={nav}>
      <TourHost nav={nav}>
        <Shell route={route} nav={nav} onNew={onNew} />
        {creating && <NewStoryModal onClose={() => setCreating(false)} />}
        <FirstRun />
      </TourHost>
    </NavCtx.Provider>
  );
}

/** Le didacticiel a besoin de naviguer et d'ouvrir l'histoire d'exemple. */
function TourHost({ nav, children }) {
  const openExample = useOpenExample();
  const ctx = useMemo(() => ({ nav, openExample }), [nav, openExample]);
  return <TourProvider ctx={ctx}>{children}</TourProvider>;
}

function FirstRun() {
  const { data } = useStore();
  const tour = useTour();
  if (data.settings.welcomed) return null;
  return <Welcome onTour={() => tour.start('main')} />;
}
