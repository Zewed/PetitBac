---
id: 10
title: Un Joueur dit STOP et les autres n'ont plus que le Temps de grâce
milestone: null
depends_on: [09]
status: done
design: .aeom/direction/manche.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Dès que ma grille est pleine, je tape STOP et les autres n'ont plus que 10 secondes. »

## Ce qu'il voit
Le gros bloc rouge STOP en bas de manche.html, qui se remplit avec la Grille (« 4/6 ») et dit « Encore 2 cases à remplir pour dire STOP ».

Maquette : `.aeom/direction/manche.html`

## C'est fini quand
- [ ] Le STOP reste inactif tant que la Grille n'est pas complète, et dit combien de cases il manque.
- [ ] Grille complète, le STOP s'active ; quand un Joueur l'appuie, tout le Salon voit qui a dit STOP.
- [ ] Les autres ont 10 secondes de Temps de grâce, affichées, puis leur Grille se ferme.
- [ ] Si deux Joueurs disent STOP presque en même temps, un seul STOP compte.
- [ ] Dire STOP ne rapporte aucun point de plus.

## Les règles
Recopiées de `.aeom/product.md` :

**STOP** :
  - activé ou non ;
  - possible dès que la grille est complète (par défaut) ou dès N cases remplies ;
  - les autres ont ensuite de 0 à 30 s pour finir (10 s par défaut).
La vitesse ne rapporte aucun point.

## Hors ticket
- Régler le STOP et le Temps de grâce : 16.
