---
id: 05
title: Le Joueur fait le Défi du jour
milestone: null
depends_on: [01]
status: done
design:
  - .aeom/direction/index.html
  - .aeom/direction/manche.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Chaque jour, je lance le défi : 12 Catégories, une Lettre que tout le monde a, 3 minutes, un seul essai. »

## Ce qu'il voit
Le bloc du Défi sur l'accueil : « Défi du jour n°23 », la Lettre cachée « ? », « 12 catégories · 3 min de chrono · 1 seul essai », « Lancer le défi n°23 → », « Nouveau défi à minuit, heure de Paris ». La Manche du Défi reprend l'écran de manche.html, avec 12 Catégories et « J'ai fini ».

Maquette : `.aeom/direction/index.html`, `.aeom/direction/manche.html`

## C'est fini quand
- [ ] L'accueil montre le Défi du jour avec son numéro, la Lettre cachée jusqu'au départ.
- [ ] Le Défi a 12 Catégories tirées dans le Catalogue et la même Lettre pour tous les Joueurs ce jour-là.
- [ ] Le chrono dure 3 minutes, et « J'ai fini » arrête la Manche avant.
- [ ] Une fois le Défi fait, le Joueur ne peut pas le refaire : l'accueil montre son résultat à la place du bouton.
- [ ] Recharger la page pendant le Défi ne donne pas un deuxième essai et ne remet pas le chrono à zéro.
- [ ] À minuit, heure de Paris, un nouveau Défi apparaît avec le numéro suivant ; le Défi n°1 est celui du jour du lancement.

## Les règles
Recopiées de `.aeom/product.md` :

**Défi du jour** :
  - une manche de 12 catégories tirées chaque jour dans tout le catalogue, avec la même lettre pour tout le monde ;
  - 3 minutes de chrono, et un bouton « J'ai fini » pour s'arrêter avant ;
  - un seul essai par jour ;
  - un nouveau défi à minuit, heure de Paris ; le défi n°1 est celui du jour du lancement.

## Hors ticket
- Le partage du résultat et la Série : 06.
- Le classement : 07 et 20.
