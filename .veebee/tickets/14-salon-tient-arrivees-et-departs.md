---
id: 14
title: Le Salon tient quand un Joueur arrive en cours, se déconnecte ou que l'Hôte s'en va
milestone: null
depends_on: [09]
design: .aeom/direction/index.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Mon téléphone a coupé : je rouvre le lien et je reprends ma grille où j'en étais. »

## Ce qu'il voit
Le bandeau « Partie en cours · Salon de Léa · manche 3/5 · Reprendre → » en haut de l'accueil, et « Arrivé en cours de partie ? Tu regardes la manche, et tu joues dès la suivante. »

Maquette : `.aeom/direction/index.html`

## C'est fini quand
- [ ] Un Joueur qui arrive pendant une Manche la regarde sans jouer, et joue dès la Manche suivante.
- [ ] Un Joueur qui perd la connexion revient au même endroit, avec sa Grille, en rouvrant le lien depuis le même appareil.
- [ ] L'accueil d'un Joueur qui a une Partie en cours propose « Reprendre » avec le Salon et la Manche.
- [ ] Si l'Hôte quitte le Salon, un autre Joueur devient Hôte automatiquement, et tout le Salon le voit.
- [ ] Un Joueur déconnecté apparaît absent aux autres, sans bloquer la Manche.

## Les règles
Recopiées de `.aeom/product.md` :

**Arrivée en cours de partie** : on regarde la manche en cours et on joue dès la suivante.
**Déconnexion** : on revient au même endroit en rouvrant le lien depuis le même appareil.
**Si l'hôte s'en va**, un autre joueur devient hôte automatiquement.

## Hors ticket
Rien.
