---
id: 01
title: Le Joueur choisit un pseudo et joue une Manche seul, jugée et notée par Palier
milestone: null
depends_on: []
status: done
design:
  - .aeom/direction/index.html
  - .aeom/direction/manche.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« J'ouvre le jeu, je tape mon pseudo, je lance une Partie libre, je remplis ma Grille avant la fin du chrono, puis je vois combien rapporte chaque Réponse. »

## Ce qu'il voit
L'accueil réduit à son pseudo et au bloc « Seul » avec « Partie libre » (index.html), puis l'écran de Manche de manche.html sans les scores des autres ni le chat : la Lettre en grand en haut, le chrono en trait jaune qui raccourcit, une ligne épaisse par Catégorie avec la Réponse en écriture bleue, « J'ai fini » en bas à la place du STOP. Après la Manche, chaque Réponse avec son Palier dans sa couleur fluo et ses points ; ce moment-là n'est pas dessiné. Le kit de la maquette (style.css) sert à tout ce que ce ticket construit.

Maquette : `.aeom/direction/index.html`, `.aeom/direction/manche.html`

## C'est fini quand
- [ ] Le Joueur tape un pseudo et arrive sur l'accueil ; un pseudo grossier est refusé avec un message qui dit pourquoi.
- [ ] « Partie libre » lance une Manche : une Lettre tirée au hasard hors K, Q, W, X, Y et Z, les 6 Catégories du Pack Classique, un chrono de 1:30.
- [ ] Recharger la page ne remet pas le chrono à zéro : il continue là où il en était.
- [ ] La Manche s'arrête quand le Joueur appuie sur « J'ai fini » ou quand le chrono arrive à 0:00 ; la Grille ne se modifie plus.
- [ ] Chaque Réponse revient validée ou refusée par le Juge ; une Réponse refusée ou une case vide rapporte 0.
- [ ] Chaque Réponse validée affiche son Palier et ses points, et le total de la Manche s'affiche ; en Animal + C, « Chacal » rapporte plus que « Chien ».
- [ ] L'erreur : si le Juge ne répond pas, le Joueur le voit et peut relancer le jugement sans perdre sa Grille.

## Les règles
Recopiées de `.aeom/product.md` :

| Palier | Part des joueurs qui ont donné cette réponse | Points |
|---|---|---|
| Banal | plus de 30 % | 1 |
| Courant | de 10 à 30 % | 3 |
| Rare | de 3 à 10 % | 5 |
| Très rare | de 0,5 à 3 % | 8 |
| Légendaire | moins de 0,5 %, ou jamais donnée | 12 |

Une réponse refusée ou une case vide rapporte 0.
**Démarrage à froid** : tant qu'un couple a été peu joué, la cote s'appuie sur la fréquence des mots en français (une base comme Lexique) et sur une estimation par l'IA. Les vraies réponses des joueurs prennent ensuite le relais.
**Une IA juge chaque nouvelle réponse une seule fois** : validée ou refusée, avec sa forme de référence. La décision est gardée pour toujours, et un seul appel par manche juge toutes les réponses encore inconnues.
**Refusées** : les mots inventés et les réponses hors catégorie.
La vitesse ne rapporte aucun point.
**Sans compte** : on choisit un pseudo et on joue tout de suite, reconnu sur son appareil. On ne collecte aucune donnée personnelle.
**Pseudos** : un filtre anti-grossièretés, et un signalement possible depuis le classement.
n'importe quelle lettre se coche ou se décoche ; par défaut, K, Q, W, X, Y et Z sont exclues ;

## Hors ticket
- Le regroupement des variantes d'une Réponse : 02.
- Plusieurs Manches et les Préréglages : 03.
- La Cote recalculée chaque nuit : 04.
- Les limites anti-abus : 26.
