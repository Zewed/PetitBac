---
id: 19
title: Le Joueur crée un Compte et retrouve sa Série sur tous ses appareils
milestone: null
depends_on: [06, 18]
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Je crée un compte pour ne pas perdre ma série si je change de téléphone. »

## Ce qu'il voit
« Créer un compte pour garder ta série · Sans compte, ta série reste sur cet appareil. Compte dès 15 ans, par e-mail ou Google. » en bas de l'accueil. La création de Compte n'est pas dessinée.

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] Le Joueur crée un Compte par un lien envoyé par e-mail ou par Google.
- [ ] La création demande de confirmer avoir 15 ans ou plus ; en dessous, pas de Compte, et le jeu reste jouable sans.
- [ ] Le Joueur qui crée un Compte garde ce qu'il avait sur l'appareil : Série, records, Mes règles.
- [ ] Connecté sur un autre appareil, il retrouve sa Série, ses stats et Mes règles.
- [ ] Il peut se déconnecter, et l'appareil redevient un appareil sans Compte.
- [ ] L'erreur : un lien e-mail expiré dit d'en demander un nouveau.

## Les règles
Recopiées de `.aeom/product.md` :

**Compte optionnel**, par lien envoyé par e-mail ou par Google, réservé aux 15 ans et plus :
  - il garde la série, les stats, « Mes règles » et la place au classement, sur tous ses appareils ;
  - le joueur sans compte qui en crée un garde son historique.

## Hors ticket
- Le top 100 : 20.
