---
id: 02
title: Le Juge range les variantes d'une Réponse sous une seule Forme de référence
milestone: null
depends_on: [01]
status: done
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« J'écris “les Chacals” ou “chacla”, et le jeu comprend que c’est “chacal”. »

## Ce qu'il voit
La Réponse corrigée à l'affichage après la Manche ; pas d'écran à part.

## C'est fini quand
- [ ] « les Chacals », « Chacal » et « chacal » donnent la même Réponse, avec le même Palier.
- [ ] Une petite faute de frappe est corrigée à l'affichage : « chacla » s'affiche « chacal ».
- [ ] Une abréviation est reconnue : « hippo » compte comme « hippopotame ».
- [ ] Les accents et les majuscules ne changent rien : « Équateur » et « equateur » sont la même Réponse.
- [ ] Une Réponse déjà jugée ne fait plus attendre : rejouer « chacal » en Animal + C donne les points tout de suite.

## Les règles
Recopiées de `.aeom/product.md` :

**Variantes regroupées** : majuscules, accents, pluriels, articles (« les Chacals » devient « chacal »), petites fautes de frappe (« chacla », corrigée à l'affichage) et abréviations (« hippo » devient « hippopotame ») comptent comme la même réponse.
**Une IA juge chaque nouvelle réponse une seule fois** : validée ou refusée, avec sa forme de référence. La décision est gardée pour toujours, et un seul appel par manche juge toutes les réponses encore inconnues.

## Hors ticket
- Le calcul de la Cote sur la Forme de référence : 04.
