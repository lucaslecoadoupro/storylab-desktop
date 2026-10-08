import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, Logo } from '../icons.jsx';
import { useStore } from '../store.jsx';

/** Illustrations des diapositives d'accueil (SVG, sans dépendance). */
function ArtPhone() {
  return (
    <svg viewBox="0 0 240 150" className="wl-art" aria-hidden="true">
      <rect x="88" y="10" width="64" height="130" rx="12" fill="#0f1b4d" />
      <rect x="93" y="20" width="54" height="110" rx="6" fill="#fff" />
      <rect x="98" y="30" width="34" height="12" rx="6" fill="#e9ecef" />
      <rect x="108" y="48" width="34" height="12" rx="6" fill="#3b5bdb" />
      <rect x="98" y="66" width="40" height="12" rx="6" fill="#e9ecef" />
      <rect x="98" y="96" width="44" height="10" rx="5" fill="#7c3aed" opacity=".85" />
      <rect x="98" y="110" width="44" height="10" rx="5" fill="#7c3aed" opacity=".45" />
      <circle cx="56" cy="50" r="16" fill="#00CC33" /><path d="M49 50h14M56 43v14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="186" cy="44" r="14" fill="#F0526A" /><path d="M180 44l4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="190" cy="104" r="12" fill="#FFE600" />
      <circle cx="48" cy="104" r="12" fill="#2b8a3e" />
    </svg>
  );
}
function ArtBranches() {
  return (
    <svg viewBox="0 0 240 150" className="wl-art" aria-hidden="true">
      <path d="M120 22v30M120 52C120 80 60 70 60 100M120 52v48M120 52c0 28 60 18 60 48" stroke="#9aa3b5" strokeWidth="3" fill="none" />
      <circle cx="120" cy="22" r="12" fill="#495057" />
      <circle cx="120" cy="52" r="12" fill="#7048e8" />
      <circle cx="60" cy="104" r="14" fill="#3b5bdb" /><circle cx="120" cy="104" r="14" fill="#d6336c" /><circle cx="180" cy="104" r="14" fill="#0ca678" />
      <text x="60" y="109" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="13">A</text>
      <text x="120" y="109" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="13">B</text>
      <text x="180" y="109" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="13">C</text>
      <path d="M60 120v12M120 120v12M180 120v12" stroke="#c92a2a" strokeWidth="3" />
      <rect x="50" y="132" width="20" height="10" rx="2" fill="#c92a2a" /><rect x="110" y="132" width="20" height="10" rx="2" fill="#c92a2a" /><rect x="170" y="132" width="20" height="10" rx="2" fill="#c92a2a" />
    </svg>
  );
}
function ArtSend() {
  return (
    <svg viewBox="0 0 240 150" className="wl-art" aria-hidden="true">
      <rect x="30" y="40" width="62" height="78" rx="6" fill="#fff" stroke="#d3d8e2" strokeWidth="2" />
      <path d="M42 60h38M42 72h30M42 84h34" stroke="#c4cad6" strokeWidth="4" strokeLinecap="round" />
      <rect x="40" y="96" width="42" height="12" rx="6" fill="#3b5bdb" />
      <text x="61" y="105" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="8">.declic</text>
      <path d="M104 78h40" stroke="#9aa3b5" strokeWidth="3" strokeDasharray="5 5" /><path d="M140 70l10 8-10 8" stroke="#9aa3b5" strokeWidth="3" fill="none" />
      <circle cx="186" cy="78" r="30" fill="#0f9b6e" /><path d="M172 79l9 9 19-20" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SLIDES = [
  { art: <ArtPhone />, title: 'Un téléphone fictif, une histoire vraie', text: 'Avec Déclic, l’élève prend en main un faux smartphone : il reçoit des messages, voit des publications, décroche des appels… et devient le héros d’une histoire.' },
  { art: <ArtBranches />, title: 'Ses choix changent la suite', text: 'Vous écrivez les scènes et les décisions. Chaque choix ouvre un chemin différent, jusqu’à des fins qui lancent le débat en classe.' },
  { art: <ArtSend />, title: 'Vous écrivez, l’équipe publie', text: 'Testez votre histoire dans le vrai téléphone, puis envoyez-la à l’équipe Déclic : elle la publie et vous donne le lien pour vos élèves.' },
];

/** Écran d'accueil au tout premier lancement. */
export function Welcome({ onTour }) {
  const { data, mutate } = useStore();
  const [i, setI] = useState(0);
  const [prenom, setPrenom] = useState(data.profile.prenom || '');
  const last = i === SLIDES.length;
  const done = (tour) => {
    mutate((d) => { d.settings.welcomed = true; if (prenom.trim()) d.profile.prenom = prenom.trim(); });
    if (tour) setTimeout(onTour, 200);
  };
  return createPortal(
    <div className="welcome-back">
      <div className="welcome" role="dialog" aria-modal="true" aria-label="Bienvenue dans StoryLab">
        <div className="wl-head"><Logo size={40} /><div><b>StoryLab</b><span>Créer des histoires interactives</span></div></div>
        {!last ? (
          <div className="wl-slide" key={i}>
            {SLIDES[i].art}
            <h2>{SLIDES[i].title}</h2>
            <p>{SLIDES[i].text}</p>
          </div>
        ) : (
          <div className="wl-slide">
            <div className="wl-hello">👋</div>
            <h2>Faisons connaissance</h2>
            <p>Votre prénom (il reste sur cet ordinateur ; il sera joint aux histoires que vous enverrez).</p>
            <input className="input input-lg" autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" onKeyDown={(e) => { if (e.key === 'Enter') done(true); }} style={{ maxWidth: 320, margin: '0 auto' }} />
          </div>
        )}
        <div className="wl-dots">{[...SLIDES, null].map((_, j) => <span key={j} className={j === i ? 'on' : ''} />)}</div>
        <div className="wl-nav">
          {!last ? (
            <>
              <button className="btn btn-quiet" onClick={() => setI(SLIDES.length)}>Passer</button>
              <span className="spacer" />
              {i > 0 && <button className="btn" onClick={() => setI(i - 1)}><Icon name="arrowLeft" />Précédent</button>}
              <button className="btn btn-primary" onClick={() => setI(i + 1)} autoFocus>Suivant<Icon name="arrowRight" /></button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => done(false)}>Je découvre seul</button>
              <span className="spacer" />
              <button className="btn btn-primary btn-lg" onClick={() => done(true)}><Icon name="compass" />Faire la visite guidée (2 min)</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
