# Jouer sur le vrai site : la todo

Site : https://petit-bac-mu.vercel.app. On règle une étape à la fois, dans l'ordre.

## Ce qui bloque
- [x] **1. Remplir la base de production.** Fait le 28 octobre (PR #29) : les migrations passent toutes seules à chaque déploiement de production.
- [x] **2. Ajouter les deux variables manquantes dans Vercel.** Ajoutées en production et redéployées le 28 octobre.
  - `NEON_AUTH_COOKIE_SECRET` : un secret généré, jamais affiché. Sans lui, la connexion au Compte ne marche pas en ligne.
  - `ADMIN_EMAILS` : dewez.antoine2@gmail.com. Sans elle, /admin n'existe pas en ligne.
- [ ] **3. Redéployer et jouer en ligne pour de vrai.** Tester, dans cet ordre :
  - une Manche en solo ;
  - le Défi du jour ;
  - un Salon à deux appareils, jusqu'au podium ;
  - la création d'un Compte par code e-mail.

## Ce qui gâche le jeu
- [ ] **4. Brancher le vrai Juge (ticket 28).** Remplacer le faux Juge par Claude Haiku via AI Gateway. D'abord vérifier si AI Gateway s'authentifie tout seul une fois sur Vercel ; si ce n'est pas le cas, il faudra une clé `AI_GATEWAY_API_KEY`.

## À finir
- [ ] **5. Livrer /admin (ticket 22).** Antoine ouvre http://localhost:3100/admin et valide la page ; ensuite PR, puis merge.

## Plus tard, ça ne bloque pas
- [ ] Le temps réel des Salons avec Neon Realtime (aujourd'hui, ils se relisent chaque seconde, et ça marche).
- [ ] Le top 100 du Défi (20).
- [ ] /admin : le Catalogue (23), la modération (24) et le tableau de bord (25).
