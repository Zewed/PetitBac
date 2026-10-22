import { obtenirDb } from "@/db/client";
import { recalculerCotes } from "@/lib/jeu/cotes";

/**
 * Le recalcul de la nuit, appelé par le cron Vercel avec `Authorization: Bearer $CRON_SECRET`.
 * En développement, sans CRON_SECRET, on peut l'appeler à la main pour simuler la nuit.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const autorise = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
  if (!autorise) return new Response("Non autorisé", { status: 401 });
  try {
    const resultat = await recalculerCotes(await obtenirDb());
    return Response.json({ ok: true, ...resultat });
  } catch (erreur) {
    console.error("Recalcul de la Cote échoué ; la Cote de la veille reste en place.", erreur);
    return Response.json({ ok: false }, { status: 500 });
  }
}
