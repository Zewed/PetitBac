---
id: 06
title: Le Joueur partage son résultat du Défi et prolonge sa Série
milestone: null
depends_on: [05]
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Après le défi, j'envoie mon résultat à mes potes, et je vois ma Série grimper. »

## Ce qu'il voit
Sur l'accueil, la Série en traits de stylo (« 7 jours d'affilée », « Fais le n°23 pour passer à 8. ») et le résultat d'hier : la Lettre, la date, 12 pastilles fluo (une par Palier), le total, « Partager mon résultat ».

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] « Partager mon résultat » donne un texte avec le numéro du Défi, la Lettre, une case par Palier obtenu et le total, sans les Réponses.
- [ ] Sur téléphone, le partage ouvre la feuille de partage quand elle existe, sinon copie le texte et le dit.
- [ ] La Série augmente de 1 chaque jour où le Joueur fait le Défi, et retombe à 0 s'il saute un jour.
- [ ] La première fois, sans Série, l'accueil invite à faire le premier Défi au lieu d'afficher « 0 jour ».
- [ ] Sans Compte, la Série reste sur l'appareil.

## Les règles
Recopiées de `.aeom/product.md` :

**Partager son résultat** façon Wordle : numéro du défi, lettre, une case par palier obtenu, total des points. On garde aussi sa **série** de jours joués d'affilée.

## Hors ticket
- La Série sur plusieurs appareils : 19.
