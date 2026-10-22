---
id: 04
title: Les Paliers suivent les Réponses des Joueurs, recalculés chaque nuit
milestone: null
depends_on: [02]
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Si tout le monde répond “chien” en C, demain “chien” ne rapporte plus qu'un point. »

## Ce qu'il voit
Rien de nouveau à l'écran : les Paliers affichés changent d'un jour à l'autre.

## C'est fini quand
- [ ] Chaque nuit, la Cote de chaque couple Catégorie + Lettre est recalculée à partir de toutes les Réponses validées, toutes Parties confondues.
- [ ] Pendant la journée, une même Réponse garde le même Palier pour tous les Joueurs.
- [ ] Après une journée où beaucoup de Joueurs ont donné « chien » en Animal + C, « chien » est Banal le lendemain.
- [ ] Une Réponse jamais donnée est Légendaire.
- [ ] Un couple Catégorie + Lettre peu joué garde sa Cote de démarrage.
- [ ] L'erreur : si le recalcul de la nuit échoue, les Paliers de la veille restent en place et le jeu continue.

## Les règles
Recopiées de `.aeom/product.md` :

Chaque couple catégorie + lettre a sa **cote** : pour chaque réponse, la part des joueurs qui l'ont donnée parmi tous ceux qui ont joué ce couple, depuis toujours, toutes parties confondues (solo, défi du jour, multi). Seules les réponses validées comptent.
**La cote se recalcule chaque nuit** et ne bouge pas de la journée : les points tombent dès la fin d'une manche, et tous les joueurs du même jour sont jugés sur la même échelle. Les réponses de la journée comptent dans le calcul de la nuit suivante.

| Palier | Part des joueurs qui ont donné cette réponse | Points |
|---|---|---|
| Banal | plus de 30 % | 1 |
| Courant | de 10 à 30 % | 3 |
| Rare | de 3 à 10 % | 5 |
| Très rare | de 0,5 à 3 % | 8 |
| Légendaire | moins de 0,5 %, ou jamais donnée | 12 |

## Hors ticket
- L'ajustement des seuils des Paliers après les premières parties : un réglage à faire en jouant, pas un ticket.
