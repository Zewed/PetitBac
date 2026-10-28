import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Chaque déploiement de production met d'abord la base Neon à jour : un ticket qui touche au schéma ne casse jamais la prod.
  buildCommand: "node scripts/migrer.mjs && pnpm build",
  // La Cote se recalcule chaque nuit (3 h ou 4 h à Paris selon l'heure d'été) et ne bouge pas de la journée.
  crons: [{ path: "/api/cron/cotes", schedule: "0 2 * * *" }],
};
