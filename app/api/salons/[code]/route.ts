import { obtenirDb } from "@/db/client";
import { lireSalon } from "@/lib/jeu/salons";
import { joueurCourant } from "@/lib/session";

/** Le Salon vu par un de ses Joueurs, relu chaque seconde par la salle d'attente. */
export async function GET(_request: Request, { params }: RouteContext<"/api/salons/[code]">) {
  const joueur = await joueurCourant();
  if (!joueur) return new Response("Non autorisé", { status: 401 });
  const salon = await lireSalon(await obtenirDb(), (await params).code, joueur.id);
  if (!salon) return new Response("Introuvable", { status: 404 });
  return Response.json(salon, { headers: { "Cache-Control": "no-store" } });
}
