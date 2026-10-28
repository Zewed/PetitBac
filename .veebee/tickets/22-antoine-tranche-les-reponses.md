---
id: 22
title: Antoine tranche dans /admin les Réponses signalées ou contestées
milestone: null
depends_on: [12, 19, 21]
design: null
tracker: null            # filled after the push: { tool, id, url }
status: done
---

## Ce que l'utilisateur fait
« J'ouvre /admin, je vois les réponses qui posent problème, et je dis oui ou non. »

## Ce qu'il voit
Pas dessiné.

## C'est fini quand
- [ ] /admin ne s'ouvre qu'avec le Compte d'Antoine ; tout autre visiteur voit une page introuvable.
- [ ] La file montre les Réponses signalées ou contestées, avec la Catégorie, la Lettre, la décision du Juge et le nombre de Parties concernées.
- [ ] Une Réponse contestée ou signalée dans plusieurs Parties est rejugée par l'IA avant d'arriver dans la file.
- [ ] Antoine valide ou refuse la Réponse, et sa décision remplace celle du Juge pour les Parties suivantes.
- [ ] La file vide dit qu'il n'y a rien à trancher.

## Les règles
Recopiées de `.aeom/product.md` :

Une réponse contestée ou signalée dans plusieurs parties est rejugée par l'IA, puis tranchée dans `/admin` si besoin.
La file des réponses contestées ou signalées à trancher.

## Hors ticket
- Les pseudos et messages signalés : 24.
