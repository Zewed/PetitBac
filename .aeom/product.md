# Petit Bac

## What kind of product
`game` : le petit bac en ligne, jouable en solo ou entre amis, où une réponse rapporte d'autant plus de points qu'elle est rare. (seen: Antoine)

## What it is for
On reçoit une lettre et une grille de catégories (Animal, Pays, Métier…), et il faut trouver pour chacune une réponse qui commence par cette lettre, avant la fin du chrono ou le STOP d'un autre joueur. (seen: Antoine)
Ce qui change du petit bac sur papier : plus une réponse a été donnée par l'ensemble des joueurs, moins elle vaut de points. En C, « Chacal » rapporte bien plus que « Chien ». (seen: Antoine)
Une IA juge chaque réponse, ce qui rend le jeu possible en solo et avec un défi du jour commun à tous. (seen: Antoine)

## Who uses it
Tout public à partir d'environ 10 ans : des groupes d'amis et des familles qui jouent ensemble, souvent dans la même pièce ou en vocal, et des joueurs seuls qui reviennent chaque jour pour le défi du jour. Le jeu est d'abord lancé entre amis pour l'éprouver, puis ouvert au public. (seen: Antoine)

## Where it is used
`web` : dans le navigateur, d'abord sur téléphone, aussi sur ordinateur, et installable comme une app (PWA). On rejoint une partie en ouvrant un lien, sans rien installer. Une connexion internet est nécessaire. (seen: Antoine)

## The main loop
Recevoir une lettre, remplir sa grille avant la fin du chrono ou le STOP, découvrir ses points réponse par réponse selon leur rareté, réagir aux réponses des autres et contester celles qui semblent fausses, puis enchaîner la manche suivante. (seen: Antoine)
En solo, revenir chaque jour faire le défi du jour, partager son résultat et prolonger sa série. (seen: Antoine)

## Genre and fiction
Jeu de lettres et de culture générale, version en ligne du petit bac (ou « jeu du baccalauréat ») qu'on joue sur papier avec une grille et un crayon. (seen: Antoine)
Le principe de la rareté rappelle le jeu télévisé « Personne n'y avait pensé ! ». (seen: Antoine)

## The feeling it aims for
La fierté de trouver la réponse à laquelle personne n'avait pensé, le chambrage entre amis au moment de découvrir les points, et l'envie de revenir chaque jour pour le défi. (to confirm)

## References
Le petit bac sur papier, pour le jeu lui-même. « Personne n'y avait pensé ! » pour le plaisir de la réponse rare. Wordle pour le défi du jour, son résultat partageable et sa série. (seen: Antoine)
Aucune direction artistique n'est choisie : elle sera proposée par AEOM à partir de ce document. (seen: Antoine)

## Visual assets
Aucun : le projet n'a encore ni logo, ni illustration, ni icône. (seen: Antoine)

## Key journeys
Pas encore écrits : Antoine définira les écrans et les parcours après cette description. (seen: Antoine)

---

## Règles et fonctionnalités de la v1

### La rareté et la cote
- Chaque couple catégorie + lettre a sa **cote** : pour chaque réponse, la part des joueurs qui l'ont donnée parmi tous ceux qui ont joué ce couple, depuis toujours, toutes parties confondues (solo, défi du jour, multi). Seules les réponses validées comptent.
- **Démarrage à froid** : tant qu'un couple a été peu joué, la cote s'appuie sur la fréquence des mots en français (une base comme Lexique) et sur une estimation par l'IA. Les vraies réponses des joueurs prennent ensuite le relais.
- **La cote se recalcule chaque nuit** et ne bouge pas de la journée : les points tombent dès la fin d'une manche, et tous les joueurs du même jour sont jugés sur la même échelle. Les réponses de la journée comptent dans le calcul de la nuit suivante.
- La vitesse ne rapporte aucun point.

### Le barème
Cinq paliers, affichés au moment de découvrir les points :

| Palier | Part des joueurs qui ont donné cette réponse | Points |
|---|---|---|
| Banal | plus de 30 % | 1 |
| Courant | de 10 à 30 % | 3 |
| Rare | de 3 à 10 % | 5 |
| Très rare | de 0,5 à 3 % | 8 |
| Légendaire | moins de 0,5 %, ou jamais donnée | 12 |

Une réponse refusée ou une case vide rapporte 0. Les seuils seront ajustés après les premières parties. (to confirm)
Les réglages d'une partie ne changent jamais le barème.

### La validation des réponses
- **Une IA juge chaque nouvelle réponse une seule fois** : validée ou refusée, avec sa forme de référence. La décision est gardée pour toujours, et un seul appel par manche juge toutes les réponses encore inconnues.
- **Variantes regroupées** : majuscules, accents, pluriels, articles (« les Chacals » devient « chacal »), petites fautes de frappe (« chacla », corrigée à l'affichage) et abréviations (« hippo » devient « hippopotame ») comptent comme la même réponse.
- **Refusées** : les mots inventés et les réponses hors catégorie.
- **Contestation en multi** (si elle est activée) : un joueur conteste une décision, le salon vote à la majorité, et le résultat ne vaut que pour cette partie. Il ne modifie jamais la base commune.
- Une réponse validée par un vote rapporte selon sa cote, donc Légendaire si elle n'a jamais été validée ailleurs. (to confirm)
- **En solo**, on peut signaler une décision.
- Une réponse contestée ou signalée dans plusieurs parties est rejugée par l'IA, puis tranchée dans `/admin` si besoin.

### Le mode Classique (seul mode de la v1)
Une manche = une lettre et une grille de catégories, une réponse par case.

**Préréglages**

| Préréglage | Catégories | Chrono | Manches |
|---|---|---|---|
| Express | 4 | 45 s | 3 |
| Classique (par défaut) | 6 | 90 s | 5 |
| Marathon | 12 | 3 min | 10 |
| Personnalisé | au choix | au choix | au choix |

**Réglages avancés**
- **Manches** : de 1 à 20, ou « le premier à X points gagne ».
- **Catégories** :
  - de 1 à 20 ;
  - choisies à la main, tirées au hasard dans les packs cochés, ou retirées au sort à chaque manche.
- **Lettres** :
  - n'importe quelle lettre se coche ou se décoche ; par défaut, K, Q, W, X, Y et Z sont exclues ;
  - une lettre ne revient pas deux fois dans une partie ;
  - la lettre est tirée au hasard, choisie par l'hôte, ou choisie par le dernier de la manche précédente.
- **Chrono** : de 30 s à 10 min, ou sans limite.
- **STOP** :
  - activé ou non ;
  - possible dès que la grille est complète (par défaut) ou dès N cases remplies ;
  - les autres ont ensuite de 0 à 30 s pour finir (10 s par défaut).
- **Contestation** : activée ou non.
- **« Mes règles »** : on enregistre ses réglages pour les réutiliser.

### Solo
- **Défi du jour** :
  - une manche de 12 catégories tirées chaque jour dans tout le catalogue, avec la même lettre pour tout le monde ;
  - 3 minutes de chrono, et un bouton « J'ai fini » pour s'arrêter avant ;
  - un seul essai par jour ;
  - un nouveau défi à minuit, heure de Paris ; le défi n°1 est celui du jour du lancement.
- **Partager son résultat** façon Wordle : numéro du défi, lettre, une case par palier obtenu, total des points. On garde aussi sa **série** de jours joués d'affilée.
- **Classement du défi** :
  - chacun voit sa position (« mieux que 82 % des joueurs ») ;
  - le top 100 avec les pseudos est réservé aux joueurs qui ont un compte ;
  - en cas d'égalité, le plus rapide passe devant.
- **Partie libre** : mêmes préréglages et réglages qu'en multi, avec « J'ai fini » à la place du STOP. On y bat son meilleur score par préréglage (le cas des réglages personnalisés reste à trancher). (to confirm)

### Multi
- **Salons privés** de 2 à 10 joueurs : l'hôte crée le salon, le règle et invite par lien ou QR code.
- **Arrivée en cours de partie** : on regarde la manche en cours et on joue dès la suivante.
- **Déconnexion** : on revient au même endroit en rouvrant le lien depuis le même appareil.
- **Si l'hôte s'en va**, un autre joueur devient hôte automatiquement.
- **Fin de partie** : podium, réponse la plus rare de la partie, et un bouton « Rejouer » qui garde le même salon.
- **Réactions en emoji** sur les réponses des autres pendant la découverte des points.
- **Chat écrit** :
  - ouvert dans le salon d'attente, pendant la découverte des points et entre les manches ; fermé pendant la manche, pour qu'on ne puisse pas souffler de réponses ;
  - les grossièretés sont masquées automatiquement ;
  - l'hôte peut couper la parole à un joueur ou l'exclure du salon ;
  - un message signalé part dans `/admin` avec les messages autour pour le contexte ;
  - rien n'est gardé après la partie, sauf les messages signalés.

### Comptes et pseudos
- **Sans compte** : on choisit un pseudo et on joue tout de suite, reconnu sur son appareil. On ne collecte aucune donnée personnelle.
- **Compte optionnel**, par un code envoyé par e-mail ou par Google, réservé aux 15 ans et plus :
  - il garde la série, les stats, « Mes règles » et la place au classement, sur tous ses appareils ;
  - le joueur sans compte qui en crée un garde son historique.
- **Pseudos** : un filtre anti-grossièretés, et un signalement possible depuis le classement.

### Le catalogue
- Au lancement, le seul pack « Classique » et ses 12 catégories (décidé par Antoine le 23 octobre). Les autres catégories s'ajoutent une par une, relues par Antoine, jusqu'à une dizaine de packs : les propositions de l'IA attendent dans `lib/jeu/propositions.ts`.
- Le pack « Classique » (Prénom, Pays, Animal, Métier, Fruit ou légume…) sert par défaut.
- Contenu adapté aux familles. Les joueurs ne peuvent pas inventer leurs propres catégories en v1.

### `/admin` (réservé au compte d'Antoine)
- La file des réponses contestées ou signalées à trancher.
- La gestion des packs et des catégories : ajouter, activer, désactiver.
- Les pseudos et messages signalés.
- Un tableau de bord : parties par jour, joueurs du défi, coût de l'IA.

### Mesure d'audience et limites
- **Mesure d'audience** : Vercel Web Analytics, sans cookies, donc sans bandeau cookies. Les statistiques de jeu viennent de la base du jeu.
- **Pas de publicité.**
- **Limites anti-abus** par appareil, pour protéger le budget de l'IA : un nombre maximal de réponses envoyées et de salons créés par minute.

### Pas dans la v1
- les autres modes : Rafale (1 catégorie, 1 lettre, 20 s, un maximum de réponses), Alphabet, Survie, Duel, Équipes ;
- l'adversaire robot ;
- le matchmaking public ;
- les catégories inventées par les joueurs ;
- un pack adultes ;
- les autres langues ;
- la monétisation.

### Stack prévue
Next.js 16 (App Router), Tailwind 4, TypeScript, pnpm et Vitest, hébergé sur Vercel. Neon pour la base Postgres, les comptes (Neon Auth) et le temps réel des salons, avec Drizzle par-dessus (ADR 0004). Le serveur fait foi pour le chrono. Claude Haiku 5.5 juge les réponses via l'AI SDK et Vercel AI Gateway. Une tâche programmée recalcule la cote chaque nuit. Les raisons sont dans `docs/adr/`.
