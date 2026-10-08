import React, { useRef } from 'react';
import { Icon } from '../icons.jsx';
import { PageHeader } from '../ui.jsx';
import { useTour } from '../nav.jsx';
import { STORY_APPS, TYPE_INFO, TYPE_ORDER } from '../story/model.js';
import { STEPS } from '../story/steps.js';
import { AppIcon } from './editor/pickers.jsx';
import { TEAM_NAME } from '../config.js';

const SECTIONS = [
  { id: 'declic', title: 'Déclic en deux minutes', icon: 'smartphone' },
  { id: 'etapes', title: 'Les six étapes', icon: 'list' },
  { id: 'scenes', title: 'Les types de scènes', icon: 'layers' },
  { id: 'applis', title: 'Les applis du téléphone', icon: 'grid' },
  { id: 'choix', title: 'Les choix et leurs effets', icon: 'branch' },
  { id: 'ecrire', title: 'Écrire une bonne histoire', icon: 'edit' },
  { id: 'medias', title: 'Images et sons', icon: 'image' },
  { id: 'envoyer', title: 'Envoyer à l’équipe', icon: 'send' },
  { id: 'faq', title: 'Questions fréquentes', icon: 'help' },
];

const EFFECTS = [
  ['Répondre autre chose', 'Le bouton dit « Je refuse », mais l’élève envoie « non merci, sans moi ».'],
  ['Ne rien envoyer', 'Le choix est une pensée ou une action (« Ignorer »), pas un message.'],
  ['Réagir avec un emoji', 'L’élève pose 😂 ou ❤️ sous le message au lieu d’écrire.'],
  ['Transférer', 'Le message, la photo ou la publication part dans une autre conversation (« ↪ Transféré »).'],
  ['Capture d’écran', 'Une capture s’ajoute dans Photos : une preuve à montrer à un adulte, par exemple.'],
  ['« J’aime »', 'Le compteur d’une publication Pixa monte (ou chute) : on voit l’effet de groupe.'],
  ['Éteindre le téléphone', 'Écran noir jusqu’à ce que l’élève le rallume ; l’histoire reprend 15 s après.'],
  ['Ouvrir une appli', 'Après « J’appelle le 3018 », le téléphone ouvre directement l’appli Téléphone.'],
];

const FAQ = [
  ['Mes histoires sont-elles en ligne ?', 'Non. Elles sont enregistrées sur cet ordinateur, dans le dossier de l’application. Rien ne part sur Internet : c’est vous qui envoyez le fichier .declic à l’équipe.'],
  ['Comment travailler à deux ?', 'Enregistrez une copie de l’histoire (menu ⋯ d’une histoire → « Enregistrer une copie »), envoyez le fichier à votre collègue : il l’ouvre avec « Ouvrir un fichier .declic ».'],
  ['Puis-je modifier mon histoire après l’avoir envoyée ?', 'Oui : modifiez-la ici, puis recréez le fichier et renvoyez-le. Le studio vous signale une histoire « modifiée depuis l’envoi ».'],
  ['L’élève peut-il revenir sur un choix ?', 'Non, comme dans la vraie vie. Il peut seulement recommencer l’histoire depuis l’écran de fin.'],
  ['Faut-il un compte pour les élèves ?', 'Non. L’élève ouvre un lien (ou flashe un QR code) : aucun nom, aucun compte, aucune donnée collectée.'],
  ['Mon test affiche des erreurs dans le téléphone', 'C’est la même vérification que celle de l’équipe : chaque erreur cite le numéro de la scène. Corrigez-les dans l’étape Scènes, le téléphone se relance tout seul.'],
  ['J’ai fait une fausse manipulation', 'Les flèches ↶ ↷ en haut de l’écran (ou Ctrl+Z / Ctrl+Y) annulent et rétablissent vos dernières modifications.'],
];

export function GuidePage() {
  const tour = useTour();
  const refs = useRef({});
  const go = (id) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const Sec = ({ id, children }) => {
    const s = SECTIONS.find((x) => x.id === id);
    return (
      <section className="guide-sec" ref={(el) => { refs.current[id] = el; }} id={`g-${id}`}>
        <h2><Icon name={s.icon} />{s.title}</h2>
        {children}
      </section>
    );
  };
  return (
    <>
      <PageHeader badge="Aide" badgeIcon="book" title="Guide de l’auteur" sub="Tout ce qu’il faut savoir pour écrire une histoire Déclic."
        actions={<button className="btn btn-white" onClick={() => tour.start('main')}><Icon name="compass" />Relancer la visite guidée</button>} />
      <div className="page-content guide">
        <nav className="guide-toc">
          {SECTIONS.map((s) => <button key={s.id} onClick={() => go(s.id)}><Icon name={s.icon} />{s.title}</button>)}
        </nav>
        <div className="guide-body">
          <Sec id="declic">
            <p>Déclic est un <b>faux smartphone</b> dans le navigateur. L’élève l’ouvre avec un simple lien : il reçoit des messages, voit passer des publications, décroche des appels… et <b>choisit</b> comment réagir. Chaque choix l’emmène vers une suite différente, jusqu’à une fin qui sert de point de départ au débat en classe.</p>
            <div className="guide-cols">
              <div><b>Ce que vous faites ici</b><span>Vous écrivez l’histoire : les scènes, les personnages, les choix et les fins.</span></div>
              <div><b>Ce que fait l’équipe</b><span>{TEAM_NAME.charAt(0).toUpperCase() + TEAM_NAME.slice(1)} relit, teste et publie l’histoire, puis vous envoie le lien pour vos élèves.</span></div>
              <div><b>Ce que vit l’élève</b><span>Un téléphone crédible, sans compte, sans collecte de données, à jouer seul ou en binôme.</span></div>
            </div>
          </Sec>
          <Sec id="etapes">
            <ol className="guide-steps">
              {STEPS.map((s) => <li key={s.id}><Icon name={s.icon} /><b>{s.long}</b><span>{s.sub}</span></li>)}
            </ol>
            <p className="muted">L’ordre est conseillé, pas imposé : la barre des étapes, en haut d’une histoire, permet d’aller partout à tout moment. Une coche verte indique une étape terminée.</p>
          </Sec>
          <Sec id="scenes">
            <p>Une histoire est une suite de <b>scènes</b>. Chaque scène mène à la suivante, ou propose des <b>choix</b> qui ouvrent plusieurs chemins.</p>
            <div className="guide-types">
              {TYPE_ORDER.map((t) => (
                <div key={t} className="guide-type">
                  <span className="tp-icon" style={{ background: TYPE_INFO[t].color }}><Icon name={TYPE_INFO[t].icon} /></span>
                  <div><b>{TYPE_INFO[t].label}</b><span>{TYPE_INFO[t].help}</span><em>{TYPE_INFO[t].when}</em></div>
                </div>
              ))}
            </div>
          </Sec>
          <Sec id="applis">
            <p>Les applis sont fictives (aucune vraie marque) mais reprennent les codes que les élèves connaissent.</p>
            <div className="guide-apps">
              {STORY_APPS.map((a) => <div key={a.id} className="guide-app"><AppIcon id={a.id} size={36} /><div><b>{a.name}</b><span>{a.desc}</span></div></div>)}
            </div>
          </Sec>
          <Sec id="choix">
            <p>Dans une messagerie, le <b>texte du bouton est envoyé</b> par l’élève comme un message. Sous chaque choix, « Effets dans le téléphone » permet d’aller plus loin :</p>
            <table className="guide-table"><tbody>{EFFECTS.map(([a, b]) => <tr key={a}><th>{a}</th><td>{b}</td></tr>)}</tbody></table>
            <p className="muted">Plusieurs chemins peuvent <b>se rejoindre</b> : dans « mène à », choisissez une scène existante.</p>
          </Sec>
          <Sec id="ecrire">
            <ul className="guide-list">
              <li><b>Partez d’une situation vécue</b> par les élèves de ce niveau : groupe de classe, photo, rumeur, sortie, jeu en ligne.</li>
              <li><b>Un vrai dilemme</b> : chaque choix doit être tentant pour une raison ou une autre. Proposez aussi le « mauvais » choix, celui que des élèves feraient vraiment.</li>
              <li><b>Écrivez comme un téléphone</b> : messages courts, plusieurs bulles, langage des élèves sans caricature.</li>
              <li><b>Rythme</b> : alternez messages, notifications, publications ; un récit pour changer de moment (« Le lendemain… »).</li>
              <li><b>2 ou 3 décisions, 2 à 4 fins</b> : au-delà, l’histoire devient longue à écrire et à jouer.</li>
              <li><b>Des fins sans morale</b> : décrivez les conséquences et posez des questions ouvertes.</li>
              <li><b>Une ressource</b> quand le sujet le demande : 3018, adulte de confiance, infirmière scolaire.</li>
            </ul>
          </Sec>
          <Sec id="medias">
            <ul className="guide-list">
              <li><b>Images</b> : JPG, PNG ou WebP. Le studio les réduit (1 080 px) et les compresse automatiquement.</li>
              <li>Chaque image a une <b>description</b> : elle s’affiche tant que l’image n’est pas fournie et elle est lue aux élèves malvoyants. Vous pouvez donc écrire toute l’histoire avant d’avoir les images.</li>
              <li><b>Pas de photos d’élèves</b> ni de personnes réelles reconnaissables : illustrations, photos libres de droits, mises en scène sans visage.</li>
              <li><b>Sons</b> : enregistrés au micro ou importés, 1 min 30 au plus. Toujours une <b>transcription</b> pour les messages vocaux.</li>
              <li>Sans enregistrement, le téléphone peut lire les textes avec une voix de synthèse.</li>
            </ul>
          </Sec>
          <Sec id="envoyer">
            <ol className="guide-list">
              <li>Dans l’étape <b>Envoyer</b>, corrigez les erreurs éventuelles (le studio les liste, avec un bouton « Corriger »).</li>
              <li>Indiquez vos coordonnées et, si vous le souhaitez, un message.</li>
              <li>« Créer le fichier à envoyer » produit un fichier <b>.declic</b> : il contient tout (textes, images, sons, fiche pédagogique).</li>
              <li>Envoyez ce fichier à {TEAM_NAME} par votre messagerie professionnelle.</li>
              <li>L’équipe l’importe dans son espace, le teste et le publie. Vous recevez le <b>lien</b> (et éventuellement un QR code) pour vos élèves.</li>
            </ol>
          </Sec>
          <Sec id="faq">
            {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
          </Sec>
        </div>
      </div>
    </>
  );
}
