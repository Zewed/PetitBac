import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

let instance: ReturnType<typeof createNeonAuth> | undefined;

/**
 * Les Comptes (ticket 19) : Neon Auth, un Better Auth géré par Neon (Marketplace Vercel), par code e-mail ou Google.
 * Le Compte ne remplace pas le cookie du Joueur (lib/session.ts) : au retour de la connexion, il retrouve le Joueur
 * rattaché à ce Compte, sur n'importe quel appareil (lib/jeu/comptes.ts).
 * Créée à la première utilisation : le build (la CI n'a pas les variables de Neon) n'en a pas besoin.
 */
export function auth() {
  instance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    logLevel: "warn",
  });
  return instance;
}
