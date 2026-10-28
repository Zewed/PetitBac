---
id: 34
title: La Cote de démarrage s'appuie aussi sur la fréquence des mots en français
milestone: null
depends_on: [28]
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« J'écris une Réponse jamais vue, et ses points ressemblent à ce qu'on attend : un mot courant rapporte peu, un mot rare beaucoup. »

## Ce qu'il voit
Rien de nouveau à l'écran : la Cote de démarrage d'une Réponse jamais jouée mêle l'estimation du Juge et la fréquence du mot en français.

## C'est fini quand
- [ ] Une Réponse jamais vue reçoit une Cote de démarrage qui tient compte de la fréquence de son mot dans une base comme Lexique, en plus de l'estimation du Juge.
- [ ] Un nom propre ou un mot absent de la base garde l'estimation du Juge seule.
- [ ] Les vraies Réponses des Joueurs prennent le relais au recalcul de la nuit, comme aujourd'hui.

## Les règles
Recopiées de `.aeom/product.md` :

**Démarrage à froid** : tant qu'un couple a été peu joué, la cote s'appuie sur la fréquence des mots en français (une base comme Lexique) et sur une estimation par l'IA. Les vraies réponses des joueurs prennent ensuite le relais.

## Pourquoi ce ticket
Créé le 28 octobre en branchant le vrai Juge (28) : le Juge estime déjà la part des joueurs qui donneraient chaque Réponse. La fréquence des mots (Lexique, une base de plus de 100 000 mots sous licence CC BY-SA) est une seconde source à ajouter : il faut choisir comment l'embarquer et comment mêler les deux.
