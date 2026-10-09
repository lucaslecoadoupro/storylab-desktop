# StoryLab (application de bureau)

**Créer des histoires interactives Déclic sans savoir coder** — l'appli des enseignants du projet StoryLab / Déclic, dans la famille ClassPro et CorrigePro : gratuit, sans inscription, 100 % local, Mac & Windows.

Un·e enseignant·e conçoit son scénario pédagogique pas à pas, le teste dans le **vrai téléphone Déclic**, puis crée un fichier **.declic** qu'il ou elle envoie à l'équipe. L'équipe l'importe dans le panneau `/admin` de Déclic, le relit et le publie.

## Parcours de l'enseignant

1. **Intention pédagogique** : titre, niveau, thème, objectifs, résumé, consigne de départ, durée, fiche pédagogique (déroulé, débrief).
2. **Personnages** : contacts, groupes de discussion, services (3018…), ajout en un clic.
3. **Scènes** : le plan de l'histoire (chemins A/B/C, boutons « + » pour insérer), le formulaire guidé de la scène et un aperçu immédiat dans un petit téléphone.
4. **Fins & débat** : textes de fin, questions pour le débat, chemins sans fin signalés.
5. **Tester** : le vrai téléphone Déclic, avec l'arbre de l'histoire ; les modifications s'y appliquent en direct ; « Tester d'ici » démarre directement à une scène.
6. **Envoyer** : vérification (mêmes règles que le moteur), coordonnées, message, création du fichier `.declic`.

## Fonctionnalités

- **Tous les types de scènes du moteur** : message (texte, photo, message vocal, réactions), publication (Pixa, check-in Clan, commentaires, « J'aime »), story, notification, photo reçue, appel (sonnerie ou sous-titré, Téléphone ou Papote), récit (avec dialogue), choix du héros, fin.
- **Tous les effets des choix** : répondre autre chose ou rien, réagir avec un emoji, transférer, capture d'écran, « J'aime » +/−, éteindre le téléphone, ouvrir une appli ou une conversation.
- **Réglages fins** : délai, attente que l'élève ouvre l'appli, notification, pastille réduite ; fin qui attend que l'élève ait lu X messages.
- **Effets du téléphone** : capture d'écran, piratage, tempête de notifications, message fantôme, écran fissuré, téléphone figé, compte à rebours sur une décision.
- **Médias** : images compressées en WebP (1 080 px), sons enregistrés au micro (1 min 30) ou importés (1,5 Mo), description obligatoire des images, transcription des vocaux.
- **Départ guidé** : structures prêtes à remplir (« une décision, deux fins », « deux décisions, trois fins », page blanche, ou **sur mesure : 2 à 10 fins**) ; à l'étape « Fins & débat », **Ajouter une fin** depuis n'importe quelle scène, ou en supprimer une ; les textes d'exemple ✏️ sont surlignés et doivent être réécrits avant l'envoi.
- **Histoire d'exemple complète** (« La photo de trop »), modifiable sans risque.
- **Didacticiel** : écran de bienvenue au premier lancement, visite guidée complète (12 étapes), mini-visites à la première ouverture de l'éditeur, du test et de l'envoi, bulles « ? » sur les champs, conseils contextuels par type de scène, Guide de l'auteur intégré.
- Annuler / rétablir (Ctrl+Z / Ctrl+Y), vue d'ensemble en carte, duplication, copies `.declic` pour travailler à deux, thème sombre.

## Lancer

    npm install
    npm start          # construit l'interface et ouvre l'application
    npm run dev        # idem, avec les outils de développement
    npm run serve      # version navigateur (http://localhost:5180/studio/), sans Electron

Paquets d'installation : `npm run dist:mac`, `npm run dist:win`, ou pousser un tag `v1.0.0` (GitHub Actions, voir `.github/workflows/release.yml`).

## Le téléphone embarqué

`phone/` contient le téléphone Déclic **déjà construit** (il est versionné : rien à faire pour lancer le studio). Après une évolution du moteur ou des applis de StoryLab, le mettre à jour :

    npm run build:phone -- ../storylab    # chemin du dépôt StoryLab

Le script construit le téléphone, le copie dans `phone/`, et recopie le format des scénarios et le validateur (`src/renderer/app/shared/`) : le studio vérifie ainsi les histoires avec exactement les mêmes règles que le téléphone et le panneau de l'équipe.

## Comment ça marche

- Tout est servi par un schéma privé `app://declic/` : `/studio/…` (l'interface), `/…` (le téléphone), `/scenarios/<id>/media/…` (images et sons du dossier de données). Studio et téléphone partagent la même origine : le studio dépose le brouillon dans le stockage local (`storylab-admin:draft:<id>`, le mécanisme de l'onglet « Tester » du panneau admin) et le téléphone, ouvert avec `?draft`, se met à jour en direct.
- Données : `declic-studio.json` (+ copie `.bak`) et dossier `media/` dans le dossier de l'application (menu Fichier → Ouvrir le dossier des données).
- Le fichier `.declic` est un JSON : `{ format: "declic-studio", author, pedagogy, message, scenario }`, médias intégrés en adresses `data:` (le panneau admin les transforme en fichiers `media/…` à la publication).

## Côté équipe (StoryLab)

Le panneau `/admin` de Déclic accepte les fichiers `.declic` dans « Importer (Excel, Word, StoryLab)… » : l'histoire s'ouvre dans l'éditeur, avec la fiche de l'enseignant (auteur, objectifs, déroulé, message) dans « Remarques sur le fichier importé ». Voir `src/admin/import/studio.ts` dans StoryLab.

Le panneau `/admin` exporte aussi n'importe quelle histoire en `.declic` (bouton « ⬇ .declic ») : elle se rouvre ici pour être modifiée.

## Réglages à adapter

`src/renderer/app/config.js` : adresse électronique de l'équipe (`TEAM_EMAIL`, actuellement lucas.le-coadou@ac-montpellier.fr : bouton « Écrire à l'équipe » après la création du fichier) et nom de l'équipe.

## Organisation

    src/main/            processus Electron (protocole app://, fichiers, micro, menus)
    src/renderer/app/
      shared/            format et validateur du moteur StoryLab (copiés par build:phone)
      story/             modèle (scènes, liens, plan), modèles de départ, vérification, médias, échanges
      modules/           accueil, nouvelle histoire, étapes, éditeur, guide, réglages
      tour/              écran de bienvenue et visites guidées
    phone/               téléphone Déclic construit
