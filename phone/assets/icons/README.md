# Logos des applications

Déposez ici les logos fictifs : **carré 1024×1024 px** (512×512 minimum), PNG ou WebP,
fond plein jusqu'aux bords, **sans coins arrondis ni ombre** : l'arrondi iOS ou le
cercle Android est appliqué automatiquement. Garder le motif dans le cercle central
de ~80 % (la version Android coupe les coins). Noms attendus : `flash.webp`,
`pixa.webp`, `papote.webp`, `clan.webp`.

Puis renseignez le chemin dans `src/apps/registry.ts`, champ `icon.image` :

    icon: { image: '/assets/icons/flash.webp', bg: '#FFE600', color: '#FFE600' }

Les applications sans `image` affichent leur glyphe dessiné, ou une tuile unie
si aucun glyphe n'est défini (aucune appli actuellement : Flash, Pixa, Papote et Clan ont leur logo).
