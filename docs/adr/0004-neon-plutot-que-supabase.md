# Neon plutôt que Supabase, finalement : base, Comptes et temps réel chez Neon

Remplace l'ADR 0001. Le 23 octobre 2026, l'installation de Supabase par la Marketplace Vercel a échoué deux fois : Supabase refusait de relier le compte d'Antoine (« plusieurs comptes avec la même adresse e-mail »), puis de créer la base. Antoine a choisi Neon à la place.

Neon, installé par la Marketplace Vercel dans l'équipe The Vibe Company (base `petit-bac`, Francfort, plan gratuit), couvre les trois besoins qui avaient fait choisir Supabase :
- **la base Postgres**, avec Drizzle par-dessus, sans changer le code du jeu ;
- **les Comptes**, avec Neon Auth (un Better Auth géré par Neon, comptes rangés dans le schéma `neon_auth`) : connexion par un code à 6 chiffres envoyé par e-mail, ou par Google ;
- **le temps réel** (Neon Realtime), activé sur la base, pour remplacer un jour la relecture des Salons chaque seconde (ticket 29).

On a écarté :
- **Insister sur Supabase** (support, ou création à la main sur supabase.com) : plus long, pour un résultat équivalent.
- **Le lien magique par e-mail**, que demandait le product.md : désactivé par défaut chez Neon, et fragile sur téléphone, où un lien ouvert depuis l'appli mail atterrit dans un autre navigateur, sans la session. Un code se tape là où l'on joue.

Conséquences :
- En développement, le jeu garde sa base embarquée (PGlite) même si `.env.local` contient `DATABASE_URL` : cette adresse est celle de la production. `PETIT_BAC_BASE=neon` force Neon en local. Les Comptes, eux, passent toujours par Neon Auth.
- Il faut `NEON_AUTH_COOKIE_SECRET` (au moins 32 caractères) dans chaque environnement.
- Neon Realtime est en bêta : le ticket 29 dira s'il suffit pour un STOP en quelques dizaines de millisecondes.
