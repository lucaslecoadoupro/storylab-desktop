import React, { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import { Field, PageHeader, Seg } from '../ui.jsx';
import { useStore, useToast } from '../store.jsx';
import { useTour } from '../nav.jsx';
import { isDesktop, openDataFolder } from '../platform.js';
import { APP_VERSION } from '../config.js';

export function SettingsPage() {
  const { data, mutate } = useStore();
  const tour = useTour();
  const toast = useToast();
  const [phone, setPhone] = useState(null);
  const p = data.profile;
  const setP = (k, v) => mutate((d) => { d.profile[k] = v; });
  useEffect(() => { fetch('/studio-phone.json').then((r) => (r.ok ? r.json() : null)).then(setPhone).catch(() => {}); }, []);

  return (
    <>
      <PageHeader badge="Réglages" badgeIcon="settings" title="Réglages" sub="Votre profil, l’apparence et l’aide." />
      <div className="page-content">
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-hd"><div className="card-title"><Icon name="user" />Mon profil</div><span className="card-sub">joint aux histoires que vous envoyez</span></div>
            <div className="card-body stack">
              <div className="grid-2">
                <Field label="Prénom"><input className="input" value={p.prenom} onChange={(e) => setP('prenom', e.target.value)} /></Field>
                <Field label="Nom"><input className="input" value={p.nom} onChange={(e) => setP('nom', e.target.value)} /></Field>
              </div>
              <Field label="Établissement"><input className="input" value={p.etablissement} onChange={(e) => setP('etablissement', e.target.value)} /></Field>
              <Field label="Discipline ou fonction"><input className="input" value={p.discipline} onChange={(e) => setP('discipline', e.target.value)} /></Field>
              <Field label="Adresse électronique professionnelle"><input className="input" type="email" value={p.email} onChange={(e) => setP('email', e.target.value)} /></Field>
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <div className="card-hd"><div className="card-title"><Icon name="sun" />Apparence</div></div>
              <div className="card-body">
                <Seg value={data.settings.theme} onChange={(v) => mutate((d) => { d.settings.theme = v; })} options={[{ value: 'light', label: 'Clair', icon: 'sun' }, { value: 'dark', label: 'Sombre', icon: 'moon' }]} />
              </div>
            </div>
            <div className="card">
              <div className="card-hd"><div className="card-title"><Icon name="compass" />Aide et visites guidées</div></div>
              <div className="card-body stack">
                <div className="row-wrap">
                  <button className="btn" onClick={() => tour.start('main')}><Icon name="compass" />Visite guidée complète</button>
                  <button className="btn" onClick={() => { mutate((d) => { d.settings.tours = {}; d.settings.dismissedTips = {}; }); toast('Les visites et conseils s’afficheront de nouveau.'); }}><Icon name="refresh" />Réafficher tous les conseils</button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-hd"><div className="card-title"><Icon name="lock" />Données</div></div>
              <div className="card-body stack">
                <p className="muted" style={{ fontSize: '.82rem' }}>Vos histoires, images et sons restent sur cet ordinateur. Rien n’est envoyé sur Internet : vous seul créez et envoyez les fichiers .declic.</p>
                {isDesktop && <button className="btn" onClick={openDataFolder} style={{ width: 'fit-content' }}><Icon name="folder" />Ouvrir le dossier des données</button>}
                <p className="tiny-note">StoryLab {APP_VERSION}{phone ? ` · téléphone Déclic ${phone.storylab} (${new Date(phone.builtAt).toLocaleDateString('fr-FR')})` : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
