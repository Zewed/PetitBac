---
id: 29
title: Brancher Supabase pour la base de production et le temps réel des Salons
milestone: null
depends_on: [08]
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« Je joue en ligne avec mes amis, sur le vrai site, et tout le monde voit les mêmes choses au même moment. »

## Ce qu'il voit
Rien de nouveau à l'écran : les Salons se mettent à jour instantanément au lieu de toutes les secondes, et le jeu tourne sur la base Supabase.

## C'est fini quand
- [ ] Le jeu déployé utilise la base Postgres de Supabase (installée via la Marketplace Vercel), avec ses migrations appliquées.
- [ ] Dans un Salon, l'arrivée d'un Joueur apparaît chez les autres en moins d'une demi-seconde, sans relecture chaque seconde.
- [ ] Plusieurs instances du serveur voient le même Salon au même moment.
- [ ] L'erreur : si le temps réel décroche, la salle d'attente le dit et se reconnecte seule.

## Les règles
Recopiées de `docs/adr/0001-supabase-plutot-que-neon.md` :

Les Salons ont besoin de temps réel : savoir qui est connecté, diffuser un STOP en quelques dizaines de millisecondes, revenir après une déconnexion. Supabase fournit les deux avec la même base Postgres, et on garde Drizzle par-dessus.
Supabase s'installe via la Marketplace Vercel.

## Hors ticket
- Les Comptes (19), qui utiliseront aussi Supabase.

## Pourquoi ce ticket
Créé par l'autopilot le 22 octobre : Supabase n'est pas provisionné. Le ticket 08 relit le Salon chaque seconde (`useSalon` dans components/salon-attente.tsx), un seul endroit à remplacer par un canal Supabase Realtime. En développement, la base est PGlite.
