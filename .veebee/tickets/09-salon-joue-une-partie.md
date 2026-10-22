---
id: 09
title: Le Salon joue une Partie ensemble, Manche après Manche
milestone: null
depends_on: [03, 08]
status: done
design: .aeom/direction/manche.html
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« On lance la partie, on a tous la même lettre en même temps, et après chaque manche on voit les scores. »

## Ce qu'il voit
L'écran de manche.html : « Salon de Léa · Classique », la Lettre, « Manche 3/5 », le chrono, les scores après la Manche précédente avec « toi » sur sa ligne.

Maquette : `.aeom/direction/manche.html`

## C'est fini quand
- [ ] L'Hôte choisit un Préréglage et lance la Partie ; les autres Joueurs ne peuvent pas la lancer.
- [ ] Tous les Joueurs reçoivent la même Lettre et les mêmes Catégories au même moment, et voient le même chrono.
- [ ] À la fin du chrono, toutes les Grilles se ferment en même temps, même celle d'un Joueur qui tapait encore.
- [ ] Après chaque Manche, chaque Joueur voit ses points par Palier et le classement du Salon.
- [ ] La Manche suivante démarre quand l'Hôte la lance, et « Manche 3/5 » suit la progression.
- [ ] La Partie s'arrête après le nombre de Manches du Préréglage.

## Les règles
Recopiées de `.aeom/product.md` :

| Préréglage | Catégories | Chrono | Manches |
|---|---|---|---|
| Express | 4 | 45 s | 3 |
| Classique (par défaut) | 6 | 90 s | 5 |
| Marathon | 12 | 3 min | 10 |
| Personnalisé | au choix | au choix | au choix |

## Hors ticket
- Le STOP : 10.
- La découverte des Réponses des autres : 11.
- La fin de Partie : 13.
- Les Réglages personnalisés : 16.
