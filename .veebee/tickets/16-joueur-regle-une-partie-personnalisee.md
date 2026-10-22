---
id: 16
title: Le Joueur règle une Partie Personnalisée
milestone: null
depends_on: [10, 12]
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Je veux 3 manches de 2 minutes, sans STOP, avec les lettres que je choisis. »

## Ce qu'il voit
La carte « Personnalisé · Tout à ta façon : chrono, lettres, STOP » parmi les Préréglages de l'accueil. L'écran des Réglages n'est pas dessiné.

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] « Personnalisé » ouvre les Réglages, en Partie libre comme dans un Salon (où seul l'Hôte règle).
- [ ] Manches : de 1 à 20, ou « le premier à X points gagne ».
- [ ] Lettres : chaque Lettre se coche ou se décoche, K, Q, W, X, Y et Z décochées par défaut ; la Lettre est tirée au hasard, choisie par l'Hôte, ou choisie par le dernier de la Manche précédente.
- [ ] Chrono : de 30 s à 10 min, ou sans limite.
- [ ] STOP : activé ou non, possible dès que la Grille est complète ou dès N cases remplies, avec un Temps de grâce de 0 à 30 s.
- [ ] Contestation : activée ou non ; désactivée, le bouton n'apparaît pas.
- [ ] Les Réglages ne changent jamais le barème : un Palier rapporte les mêmes points quel que soit le réglage.

## Les règles
Recopiées de `.aeom/product.md` :

**Réglages avancés**
- **Manches** : de 1 à 20, ou « le premier à X points gagne ».
- **Lettres** : n'importe quelle lettre se coche ou se décoche ; par défaut, K, Q, W, X, Y et Z sont exclues ; une lettre ne revient pas deux fois dans une partie ; la lettre est tirée au hasard, choisie par l'hôte, ou choisie par le dernier de la manche précédente.
- **Chrono** : de 30 s à 10 min, ou sans limite.
- **STOP** : activé ou non ; possible dès que la grille est complète (par défaut) ou dès N cases remplies ; les autres ont ensuite de 0 à 30 s pour finir (10 s par défaut).
- **Contestation** : activée ou non.
Les réglages d'une partie ne changent jamais le barème.

## Hors ticket
- Les Catégories et les Packs : 17.
- « Mes règles » : 18.
