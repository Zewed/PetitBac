---
id: 27
title: Le Joueur installe Petit Bac sur son téléphone comme une app
milestone: null
depends_on: [01]
design: null
tracker: null            # filled after the push: { tool, id, url }
status: done
---

## Ce que l'utilisateur fait
« J'ajoute Petit Bac à mon écran d'accueil et je l'ouvre comme une app. »

## Ce qu'il voit
Pas dessiné.

## C'est fini quand
- [ ] Sur téléphone, le navigateur propose d'installer Petit Bac, qui s'ouvre ensuite en plein écran avec son icône.
- [ ] Sans connexion, le jeu dit qu'internet est nécessaire au lieu d'une page d'erreur du navigateur.
- [ ] Les visites sont mesurées par Vercel Web Analytics, sans cookies, donc sans bandeau.

## Les règles
Recopiées de `.aeom/product.md` :

`web` : dans le navigateur, d'abord sur téléphone, aussi sur ordinateur, et installable comme une app (PWA). On rejoint une partie en ouvrant un lien, sans rien installer. Une connexion internet est nécessaire.
**Mesure d'audience** : Vercel Web Analytics, sans cookies, donc sans bandeau cookies.

## Hors ticket
Rien.
