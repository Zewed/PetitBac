# Les migrations passent toutes seules, à chaque déploiement de production

Le 28 octobre 2026, la base Neon de production ne contenait que les tables des Comptes : aucune migration n'y avait jamais été appliquée, et le jeu en ligne plantait dès le choix du pseudo. Antoine a choisi de migrer automatiquement plutôt qu'à la main.

Sur Vercel, le build de production lance d'abord `scripts/migrer.mjs` (la `buildCommand` de `vercel.ts`), qui applique `db/migrations` sur Neon par l'adresse sans pooler (`DATABASE_URL_UNPOOLED`), puis construit le site. Seule la production migre : les Previews ont les mêmes variables de base, et une branche pas encore mergée ne doit jamais changer la base des Joueurs.

On a écarté :
- **Migrer à la main** après chaque ticket qui touche au schéma : un oubli casse la prod jusqu'à ce que quelqu'un y pense.
- **Migrer au démarrage du serveur** : plusieurs instances démarreraient en même temps, et une erreur se verrait chez les Joueurs plutôt qu'au build.

Conséquences :
- Une migration qui échoue fait échouer le build : le déploiement précédent reste en ligne.
- Une migration doit rester compatible avec le code encore en ligne pendant le build : ajouter des colonnes ou des tables, pas en renommer ni en supprimer d'un coup.
