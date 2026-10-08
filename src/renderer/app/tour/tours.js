/**
 * Visites guidées (didacticiel). Chaque étape montre un élément de l'écran
 * (attribut data-tour) avec une bulle d'explication.
 *   before(ctx) : prépare l'écran (navigation, ouverture de l'exemple…)
 *   target      : sélecteur CSS de l'élément à montrer (absent = bulle centrée)
 *   place       : position de la bulle (bottom, top, left, right)
 */
export const TOURS = {
  main: [
    {
      title: 'Bienvenue dans StoryLab 👋',
      text: 'En deux minutes, découvrez comment écrire une histoire interactive pour vos élèves. Vous pouvez quitter la visite à tout moment (Échap) et la relancer depuis le menu Aide.',
      before: (c) => c.nav({ page: 'home' }),
    },
    {
      target: '[data-tour="sidebar"]', place: 'right',
      title: 'Le menu',
      text: 'Accueil, toutes vos histoires, le guide de l’auteur et les réglages. Quand une histoire est ouverte, elle apparaît aussi ici.',
    },
    {
      target: '[data-tour="new-story"]', place: 'bottom',
      title: 'Créer une histoire',
      text: 'Donnez un titre, choisissez un niveau et un thème, puis une structure de départ : « une décision, deux fins », « deux décisions, trois fins »… Les textes marqués ✏️ sont à réécrire.',
      before: (c) => c.nav({ page: 'home' }),
    },
    {
      target: '[data-tour="stepper"]', place: 'bottom',
      title: 'Six étapes, dans l’ordre',
      text: 'Pour la visite, nous avons ouvert l’histoire d’exemple. Chaque histoire se construit en six étapes ; une coche verte indique une étape terminée. Vous pouvez passer d’une étape à l’autre quand vous voulez.',
      before: (c) => c.openExample('projet'),
    },
    {
      target: '[data-tour="project-card"]', place: 'right',
      title: 'Étape 1 · L’intention pédagogique',
      text: 'Le niveau, le thème, les objectifs : ce que vos élèves doivent comprendre. Ces informations aident l’équipe à relire et accompagnent l’histoire comme une fiche pédagogique.',
    },
    {
      target: '[data-tour="outline"]', place: 'right',
      title: 'Étape 3 · Le plan de l’histoire',
      text: 'Toutes les scènes, dans l’ordre où l’élève les vit. Quand l’élève choisit, l’histoire se sépare en chemins A, B, C… Les boutons « + » entre deux scènes en insèrent une nouvelle.',
      before: (c) => c.openExample('scenes', 's4'),
    },
    {
      target: '[data-tour="scene-form"]', place: 'left',
      title: 'La scène sélectionnée',
      text: 'Un formulaire en blocs numérotés : où se passe la scène (quelle appli), qui écrit, quoi. Les petits « ? » expliquent chaque champ.',
    },
    {
      target: '[data-tour="next"]', place: 'top',
      title: 'Et ensuite ?',
      text: 'Ici, l’élève a trois réponses possibles, et chacune mène à une suite différente. Sous chaque choix, « Effets dans le téléphone » permet de réagir avec un emoji, transférer, faire une capture…',
    },
    {
      target: '[data-tour="mini-phone"]', place: 'left',
      title: 'Aperçu immédiat',
      text: 'Le petit téléphone montre la scène pendant que vous l’écrivez.',
    },
    {
      target: '[data-tour="test-btn"]', place: 'bottom',
      title: 'Tester dans le vrai téléphone',
      text: 'Jouez votre histoire exactement comme vos élèves, dans le vrai téléphone Déclic. Vos modifications s’y appliquent en direct.',
    },
    {
      target: '[data-step="envoyer"]', place: 'bottom',
      title: 'Envoyer à l’équipe',
      text: 'Quand c’est prêt, le studio vérifie tout et crée un fichier .declic. Vous l’envoyez à l’équipe Déclic, qui le publie et vous donne le lien pour vos élèves.',
    },
    {
      title: 'À vous de jouer !',
      text: 'Explorez librement l’exemple (vous pouvez le modifier sans risque), ou revenez à l’accueil pour créer votre première histoire. Le Guide de l’auteur répond à toutes les questions.',
    },
  ],
  editor: [
    {
      target: '[data-tour="outline"]', place: 'right',
      title: 'Le plan de votre histoire',
      text: 'Cliquez sur une scène pour l’ouvrir. Un point rouge ou orange signale une scène à compléter.',
    },
    {
      target: '.ol-insert button', place: 'right',
      title: 'Ajouter une scène',
      text: 'Ce « + » insère une scène à cet endroit. Le studio vous demande quel type de scène : message, publication, appel, récit, choix, fin…',
    },
    {
      target: '[data-tour="scene-head"]', place: 'bottom',
      title: 'La scène ouverte',
      text: 'Son numéro et son type. Le menu ⋯ permet de la transformer, la dupliquer ou la supprimer ; « Tester d’ici » lance le téléphone directement à cette scène.',
    },
    {
      target: '[data-tour="next"]', place: 'top',
      title: 'Faire choisir l’élève',
      text: 'Une scène mène automatiquement à la suivante… ou propose un choix : chaque bouton ouvre un nouveau chemin. Dans « mène à », créez une nouvelle scène ou rejoignez une scène existante.',
    },
    {
      target: '[data-tour="map-btn"]', place: 'bottom',
      title: 'Vue d’ensemble',
      text: 'Toute l’histoire sous forme de carte, pour vérifier les chemins d’un coup d’œil.',
    },
  ],
  test: [
    {
      target: '.test-phone', place: 'right',
      title: 'Le vrai téléphone Déclic',
      text: 'Celui que verront vos élèves, avec votre histoire. À gauche, l’arbre de l’histoire suit votre partie.',
    },
    {
      target: '[data-tour="test-toolbar"]', place: 'bottom',
      title: 'Rejouer un autre chemin',
      text: 'Recommencez depuis le début, ou démarrez directement à une scène pour tester un chemin précis. « Accéléré » fait arriver les messages plus vite.',
    },
  ],
  send: [
    {
      target: '[data-tour="checklist"]', place: 'right',
      title: 'La vérification',
      text: 'Le studio vérifie l’histoire avec les mêmes règles que le téléphone. Les erreurs bloquent l’envoi ; « Corriger » vous emmène à la bonne scène.',
    },
    {
      target: '[data-tour="send-card"]', place: 'left',
      title: 'Créer le fichier',
      text: 'Un fichier .declic, à joindre à un message pour l’équipe. Il contient tout : textes, images, sons, fiche pédagogique.',
    },
  ],
};
