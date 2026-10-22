import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // La Cote se recalcule chaque nuit (3 h ou 4 h à Paris selon l'heure d'été) et ne bouge pas de la journée.
  crons: [{ path: "/api/cron/cotes", schedule: "0 2 * * *" }],
};
