# Supabase plutôt que Neon, pour le temps réel des salons et les comptes sans inscription

> Remplacé par l'ADR 0004 (Neon), le 23 octobre 2026.

D'habitude, on part sur Neon et Drizzle. Ici, les Salons ont besoin de temps réel : savoir qui est connecté, diffuser un STOP en quelques dizaines de millisecondes, revenir après une déconnexion. Les comptes doivent aussi permettre de jouer sans inscription, puis de devenir un vrai Compte (lien par e-mail ou Google) sans perdre son historique. Supabase fournit les deux avec la même base Postgres, et on garde Drizzle par-dessus.

On a écarté :
- **Neon avec un flux d'événements qui interroge la base** (comme dans Bruno) : 500 ms de latence est trop lent pour un STOP, et interroger la base en continu coûte cher.
- **Les WebSockets des fonctions Vercel** : il aurait fallu ajouter Redis pour que plusieurs instances partagent l'état d'un Salon.
- **PartyKit ou les Durable Objects de Cloudflare** : c'est le modèle idéal (un objet par Salon), mais c'est une plateforme de plus à apprendre et à exploiter.

Conséquences :
- Le serveur fait foi pour le chrono. Chaque Manche stocke son heure de fin, un STOP la ramène à « maintenant + Temps de grâce », et les appareils ne font qu'afficher le compte à rebours.
- Supabase s'installe via la Marketplace Vercel.
