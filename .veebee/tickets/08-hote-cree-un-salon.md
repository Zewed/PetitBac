---
id: 08
title: L'Hôte crée un Salon et ses amis le rejoignent par lien ou QR code
milestone: null
depends_on: [01]
status: done
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Je crée un salon, j'envoie le lien à mes potes, et je les vois arriver. »

## Ce qu'il voit
Le bloc « Entre amis » de l'accueil : « Créer un salon », « Rejoindre un salon » avec le champ du code. Le Salon d'attente n'est pas dessiné.

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] « Créer le salon » ouvre un Salon d'attente avec son lien, son code et un QR code.
- [ ] Un ami qui ouvre le lien ou tape le code choisit son pseudo et entre dans le Salon.
- [ ] Chaque Joueur du Salon voit la liste des présents changer en direct, avec l'Hôte marqué.
- [ ] Un 11e Joueur ne peut pas entrer : le message dit que le Salon est plein.
- [ ] Un code qui n'existe pas affiche une erreur qui dit de vérifier le code.
- [ ] Seul dans son Salon, l'Hôte voit qu'il attend au moins un autre Joueur.

## Les règles
Recopiées de `.aeom/product.md` :

**Salons privés** de 2 à 10 joueurs : l'hôte crée le salon, le règle et invite par lien ou QR code.

## Hors ticket
- Jouer la Partie : 09.
- Le chat : 15.
- Arriver en cours de Partie : 14.
