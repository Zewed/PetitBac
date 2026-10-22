---
id: 03
title: Le Joueur enchaîne les Manches d'une Partie libre avec un Préréglage
milestone: null
depends_on: [01]
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Je choisis Express, Classique ou Marathon, je joue toutes les Manches d'affilée et je vois si j'ai battu mon record. »

## Ce qu'il voit
Le bloc « Seul » de l'accueil : « Partie libre → » et « Ton record en Classique 52 pts ». Le choix du Préréglage et la fin de Partie solo ne sont pas dessinés.

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] Le Joueur choisit un Préréglage : Express, Classique (par défaut) ou Marathon, avec ses Catégories, son chrono et son nombre de Manches.
- [ ] Les Manches s'enchaînent et le total de la Partie grimpe ; une Lettre ne revient pas deux fois dans la Partie.
- [ ] À la fin, le Joueur voit son total et, s'il l'a battu, son nouveau record pour ce Préréglage.
- [ ] L'accueil affiche le record par Préréglage ; la première fois, sans record, il n'affiche pas « 0 pts ».
- [ ] Le Joueur peut quitter une Partie en cours et revenir à l'accueil.

## Les règles
Recopiées de `.aeom/product.md` :

| Préréglage | Catégories | Chrono | Manches |
|---|---|---|---|
| Express | 4 | 45 s | 3 |
| Classique (par défaut) | 6 | 90 s | 5 |
| Marathon | 12 | 3 min | 10 |
| Personnalisé | au choix | au choix | au choix |

**Partie libre** : mêmes préréglages et réglages qu'en multi, avec « J'ai fini » à la place du STOP. On y bat son meilleur score par préréglage (le cas des réglages personnalisés reste à trancher). (to confirm)
une lettre ne revient pas deux fois dans une partie ;

## Hors ticket
- Le Préréglage Personnalisé : 16.
- Le Défi du jour : 05.
