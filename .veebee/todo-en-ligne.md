# Jouer sur le vrai site : la todo

Site : https://petit-bac-mu.vercel.app. On règle une étape à la fois, dans l'ordre.

## Ce qui bloque
- [x] **1. Remplir la base de production.** Fait le 28 octobre (PR #29) : les migrations passent toutes seules à chaque déploiement de production.
- [x] **2. Ajouter les deux variables manquantes dans Vercel.** Ajoutées en production et redéployées le 28 octobre.
  - `NEON_AUTH_COOKIE_SECRET` : un secret généré, jamais affiché. Sans lui, la connexion au Compte ne marche pas en ligne.
  - `ADMIN_EMAILS` : dewez.antoine2@gmail.com. Sans elle, /admin n'existe pas en ligne.
- [x] **3. Redéployer et jouer en ligne pour de vrai.** Tout passe, le 28 octobre. Tester, dans cet ordre :
  - [x] une Manche en solo : fait le 28 octobre. Le Juge corrigeait en 8 à 15 s, et répond maintenant en 0,6 s depuis que les fonctions tournent à Francfort, à côté de la base (PR #30) ;
  - [x] le Défi du jour : fait le 28 octobre, avec 12 pts et la Série à 1 jour ;
  - [x] un Salon à deux appareils, jusqu'au podium (Antoine) ;
  - [x] la création d'un Compte par code e-mail (Antoine).

## Ce qui gâche le jeu
- [ ] **4. Brancher le vrai Juge (ticket 28).** Antoine choisit Jev (TypeSafe AI), un modèle de décision, à la place de Claude Haiku. Le Juge Claude, mergé puis retiré le 28 octobre, n'a jamais été allumé.

## À finir
- [x] **5. Livrer /admin (ticket 22).** Livré le 28 octobre ; Antoine vérifie la page sur le vrai site.

## Plus tard, ça ne bloque pas
- [ ] Le temps réel des Salons avec Neon Realtime (aujourd'hui, ils se relisent chaque seconde, et ça marche).
- [ ] Le top 100 du Défi (20).
- [ ] /admin : le Catalogue (23), la modération (24) et le tableau de bord (25).
