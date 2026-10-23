import { obtenirDb } from "@/db/client";
import { effacerVieuxMessages } from "@/lib/jeu/chat";
import { recalculerCotes } from "@/lib/jeu/cotes";

/**
 * Le recalcul de la nuit, appelé par le cron Vercel avec `Authorization: Bearer $CRON_SECRET`, et le ménage du chat
 * des Salons où aucune Partie ne finit.
 * En développement, sans CRON_SECRET, on peut l'appeler à la main pour simuler la nuit.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const autorise = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
  if (!autorise) return new Response("Non autorisé", { status: 401 });
  try {
    const db = await obtenirDb();
    // Le ménage ne doit pas empêcher le recalcul : s'il casse, les messages attendront la nuit suivante.
    const messagesEffaces = await effacerVieuxMessages(db).catch((erreur) => {
      console.error("Effacement des vieux messages du chat échoué ; ils seront effacés la nuit suivante.", erreur);
      return null;
    });
    const resultat = await recalculerCotes(db);
    return Response.json({ ok: true, ...resultat, messagesEffaces });
  } catch (erreur) {
    console.error("Recalcul de la Cote échoué ; la Cote de la veille reste en place.", erreur);
    return Response.json({ ok: false }, { status: 500 });
  }
}
