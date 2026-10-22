---
id: 30
title: L'accueil tient sans défiler, Entre amis d'abord
milestone: null
depends_on: [05, 08, 14, 16, 18]
design: .aeom/direction/accueil/index.html
tracker: null            # filled after the push: { tool, id, url }
status: done
---

## Ce que l'utilisateur fait
« J'ouvre Petit Bac et je vois tout de suite à quoi je peux jouer, sans faire défiler : créer un salon, en rejoindre un, jouer seul, le défi du jour. »

## Ce qu'il voit
La maquette v6 validée par Antoine le 22 octobre : quatre tuiles au surligneur fluo, sans défilement à 390 × 844 comme à 1280 × 800.
- **Créer un salon**, en jaune, la plus grande : la bulle « Un petit bac ? », le Préréglage choisi sur une bande de papier avec « Changer », et « Créer le salon ».
- **Rejoindre un salon**, en rose : la clé, et le champ du code avec « Rejoindre ».
- **Partie libre**, en vert : le crayon, et « Jouer → ».
- **Défi du jour**, en bleu, la plus petite : son numéro, « Fait » et les points, avec « Voir ».
- Sur ordinateur, les quatre tuiles ont quatre largeurs différentes. Sur téléphone, Créer et Rejoindre prennent toute la largeur, et Seul et Défi sont côte à côte, à parts égales.
- « Changer » et « Jouer → » ouvrent une feuille qui monte par-dessus l'accueil assombri, avec les Préréglages.

Maquette : `.aeom/direction/accueil/index.html`, avec ses feuilles `suite.html` (Préréglage du salon) et `suite-libre.html` (Préréglage de la Partie libre).

## C'est fini quand
- [ ] L'accueil d'un Joueur qui a un pseudo tient sans défiler, à 390 × 844 comme à 1280 × 800, avec les quatre tuiles de la maquette, dans l'ordre Entre amis, puis Seul, puis Défi.
- [ ] « Créer le salon » crée un Salon avec le Préréglage affiché. « Changer » ouvre la feuille : Express, Classique, Marathon et Personnalisé. Les Réglages et « Mes règles » se choisissent ensuite dans le Salon, au lancement, comme aujourd'hui.
- [ ] « Jouer → » ouvre la feuille de la Partie libre : les Préréglages avec le record sous chacun, Personnalisé avec ses Réglages, « Mes règles » quand il y en a, puis « Lancer la partie ».
- [ ] Le Défi pas encore fait montre son numéro, la Lettre cachée (« ? ») et « Jouer » (« Reprendre » s'il est commencé). Une fois fait, il montre « Fait », les points et « Voir ».
- [ ] Une Partie de Salon en cours apparaît en bandeau compact « Reprendre » au-dessus des tuiles, sans faire défiler.
- [ ] La Série et la place au classement du Défi, qui quittent l'accueil, apparaissent sur le résultat du Défi, ouvert par « Voir ».
- [ ] Le code faux dans Rejoindre et le message des limites anti-abus s'affichent dans leur tuile.

## Les règles
Recopiées de `.aeom/product.md` et des tickets construits :
- Le préréglage par défaut est Classique ; Personnalisé et « Mes règles » se choisissent aussi (tickets 16 et 18).
- Le Défi : une Manche par jour, la même pour tous, un seul essai (ticket 05).
- Une Partie de Salon en cours se reprend depuis l'accueil (ticket 14).

## Comment
- `app/page.tsx` est réécrit autour des tuiles. Les feuilles sont un composant client (un `<dialog>`) qui reprend `ChoixPrereglage` et `ReglagesPersonnalises`.
- Les styles de la maquette (`.aeom/direction/accueil/style.css`) vont dans `app/accueil.css`, sur le kit déjà présent (`app/kit.css`).
- La Série (`components/serie.tsx`) et la place au classement (`components/dernier-resultat.tsx`) vont sur la page du résultat du Défi.

## Hors ticket
- La légende des Paliers quitte l'accueil : elle reste sur les résultats.
- Le choix du pseudo (premier écran sans pseudo) ne change pas.
