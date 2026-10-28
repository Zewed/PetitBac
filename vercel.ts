import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Les fonctions tournent à Francfort, à côté de la base Neon : la correction d'une Grille enchaîne des dizaines de requêtes,
  // et chacune traversait l'Atlantique depuis Washington (8 à 15 secondes d'attente au lieu d'une ou deux).
  regions: ["fra1"],
  // Chaque déploiement de production met d'abord la base Neon à jour : un ticket qui touche au schéma ne casse jamais la prod.
  buildCommand: "node scripts/migrer.mjs && pnpm build",
  // La Cote se recalcule chaque nuit (3 h ou 4 h à Paris selon l'heure d'été) et ne bouge pas de la journée.
  crons: [{ path: "/api/cron/cotes", schedule: "0 2 * * *" }],
};
