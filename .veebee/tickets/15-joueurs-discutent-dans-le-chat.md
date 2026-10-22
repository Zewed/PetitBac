---
id: 15
title: Les Joueurs discutent dans le chat du Salon
milestone: null
depends_on: [09]
design: .aeom/direction/manche.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Entre deux manches, on se chambre dans le chat ; pendant la manche, il est fermé pour qu'on ne se souffle rien. »

## Ce qu'il voit
« Chat fermé pendant la manche. Il rouvre à la découverte des points. » sur manche.html. Le chat ouvert n'est pas dessiné.

Maquette : `.aeom/direction/manche.html`

## C'est fini quand
- [ ] Le chat est ouvert dans le Salon d'attente, pendant la découverte des points et entre les Manches, et fermé pendant la Manche avec le message de la maquette.
- [ ] Les grossièretés d'un message sont masquées automatiquement.
- [ ] L'Hôte peut couper la parole à un Joueur ou l'exclure du Salon.
- [ ] Un Joueur peut signaler un message, et voit que son Signalement est envoyé.
- [ ] Rien du chat n'est gardé après la Partie, sauf les messages signalés.
- [ ] Le chat vide invite à écrire le premier message.

## Les règles
Recopiées de `.aeom/product.md` :

**Chat écrit** :
  - ouvert dans le salon d'attente, pendant la découverte des points et entre les manches ; fermé pendant la manche, pour qu'on ne puisse pas souffler de réponses ;
  - les grossièretés sont masquées automatiquement ;
  - l'hôte peut couper la parole à un joueur ou l'exclure du salon ;
  - un message signalé part dans `/admin` avec les messages autour pour le contexte ;
  - rien n'est gardé après la partie, sauf les messages signalés.

## Hors ticket
- Traiter les messages signalés : 24.
