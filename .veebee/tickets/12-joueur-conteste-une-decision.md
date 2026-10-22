---
id: 12
title: Un Joueur conteste une décision du Juge et le Salon vote
milestone: null
depends_on: [11]
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Le Juge a refusé ma réponse ? Je conteste, tout le salon vote, et si la majorité dit oui, mes points comptent. »

## Ce qu'il voit
Pas dessiné.

## C'est fini quand
- [ ] Pendant la découverte des points, un Joueur peut contester la décision du Juge sur une Réponse.
- [ ] Les Joueurs du Salon votent, et la majorité tranche.
- [ ] Une Réponse validée par le vote rapporte selon sa Cote, et le total du Joueur se met à jour.
- [ ] Le vote ne vaut que pour cette Partie : la même Réponse jouée ailleurs garde la décision du Juge.

## Les règles
Recopiées de `.aeom/product.md` :

**Contestation en multi** (si elle est activée) : un joueur conteste une décision, le salon vote à la majorité, et le résultat ne vaut que pour cette partie. Il ne modifie jamais la base commune.
Une réponse validée par un vote rapporte selon sa cote, donc Légendaire si elle n'a jamais été validée ailleurs. (to confirm)

## Hors ticket
- Activer ou non la Contestation : 16.
- Rejuger une Réponse contestée dans plusieurs Parties : 22.
