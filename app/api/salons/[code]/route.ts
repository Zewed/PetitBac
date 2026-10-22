import { obtenirDb } from "@/db/client";
import { etatPartieSalon } from "@/lib/jeu/partie-salon";
import { lireSalon } from "@/lib/jeu/salons";
import { joueurCourant } from "@/lib/session";

/** Le Salon vu par un de ses Joueurs, relu chaque seconde par la salle d'attente. */
export async function GET(_request: Request, { params }: RouteContext<"/api/salons/[code]">) {
  const joueur = await joueurCourant();
  if (!joueur) return new Response("Non autorisé", { status: 401 });
  const db = await obtenirDb();
  const { code } = await params;
  const salon = await lireSalon(db, code, joueur.id);
  if (!salon) return new Response("Introuvable", { status: 404 });
  const partie = (await etatPartieSalon(db, code, joueur.id)) ?? null;
  return Response.json({ ...salon, partie }, { headers: { "Cache-Control": "no-store" } });
}
