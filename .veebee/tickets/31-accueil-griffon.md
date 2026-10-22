---
id: 31
title: L'accueil prend le vrai trait de stabilo
milestone: null
depends_on: [30]
design: .aeom/direction/accueil-griffon/index.html
tracker: null            # filled after the push: { tool, id, url }
status: done
---

## Ce que l'utilisateur fait
« J'ouvre Petit Bac et ça ressemble à une page griffonnée au stabilo, pas à une grille sage sur fond blanc. »

## Ce qu'il voit
La maquette « griffon » validée par Antoine le 22 octobre (« parfait pour le 3, go ! »), sur la disposition du ticket 30 :
- **le fond** n'est plus blanc : de grands lavis de surligneur pâles qui se chevauchent ;
- **les tuiles** sont des traits de stabilo posés à la main, penchés et un peu décalés : encre plus foncée au départ, coupée au biais de la pointe, qui s'éclaircit et sèche vers la fin, stries du feutre, bords chargés et tremblés, translucide (le fond passe à travers) ;
- **des griffonnages au bille** : une étoile dans l'en-tête, un « ! » rouge près du Défi, « à toi ! » avec une flèche vers « Jouer », et sur ordinateur une flèche vers « Créer le salon » et un éclat près de Rejoindre ;
- **le « Bac » du logo et les feuilles des Préréglages** prennent le même trait.

Maquette : `.aeom/direction/accueil-griffon/index.html` (et ses feuilles `suite.html`, `suite-libre.html`).

## C'est fini quand
- [ ] L'accueil a le rendu de la maquette griffon, à 390 × 844 comme à 1280 × 800, et tient toujours sans défiler.
- [ ] Le texte et les boutons restent nets et lisibles : seuls les traits passent par les filtres.
- [ ] Les feuilles « Changer » et « Jouer → » restent droites et prennent le trait de stabilo sur leur bord du haut, leur titre et le Préréglage choisi.
- [ ] Les autres pages (Salon, Manche, résultats) ne changent pas.

## Les règles
Rien de nouveau : le ticket 30 garde son comportement.

## Comment
Les filtres SVG `#stabilo-a/b/c` et les lavis du fond vivent dans la page d'accueil ; les règles de la maquette s'ajoutent à `app/accueil.css`, limitées à `.p-acc` pour ne pas toucher les autres pages.

## Hors ticket
- Le même rendu sur les autres pages : à décider plus tard.
