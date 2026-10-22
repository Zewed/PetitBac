---
id: 32
title: Toute l'app prend le vrai trait de stabilo
milestone: null
depends_on: [31]
design: .aeom/direction/accueil-griffon/index.html
tracker: null            # filled after the push: { tool, id, url }
status: done
---

## Ce que l'utilisateur fait
« Partout dans le jeu, ça ressemble à une page passée au stabilo, comme l'accueil. »

## Ce qu'il voit
Le trait de l'accueil « griffon » (ticket 31) sur toutes les pages, validé par Antoine le 22 octobre. Les surligneurs prennent le trait :
- les lignes de Palier des résultats, la découverte des points et la légende des Paliers ;
- les titres surlignés, ta puce, le podium et le bloc de fin de Partie ;
- la grande Lettre et le chrono de la Manche, le fond du QR code et tes messages dans le chat ;
- les choix cochés, la case en train d'être remplie et le logo.

Les lavis du fond passent sur toutes les pages, plus pâles qu'à l'accueil.

## C'est fini quand
- [ ] Les surligneurs de toutes les pages ont le trait de stabilo : encre qui varie, stries, bords tremblés, translucide.
- [ ] Le texte, les boutons et les champs restent nets et en aplat ; la grille d'une Manche reste facile à lire.
- [ ] Aucune page ne défile de côté sur téléphone.

## Les règles
Rien de nouveau.

## Comment
`app/stabilo.css` applique le trait aux pseudo-éléments des surligneurs du kit ; les filtres SVG et les lavis passent dans `app/layout.tsx`.

## Hors ticket
Rien.
