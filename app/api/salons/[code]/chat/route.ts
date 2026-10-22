import { obtenirDb } from "@/db/client";
import { lireChat } from "@/lib/jeu/chat";
import { joueurCourant } from "@/lib/session";

/** Le chat du Salon vu par un de ses Joueurs, relu chaque seconde en attendant Supabase Realtime (ticket 29). */
export async function GET(_request: Request, { params }: RouteContext<"/api/salons/[code]/chat">) {
  const joueur = await joueurCourant();
  if (!joueur) return new Response("Non autorisé", { status: 401 });
  const { code } = await params;
  const chat = await lireChat(await obtenirDb(), code, joueur.id);
  if (!chat) return new Response("Introuvable", { status: 404 });
  return Response.json(chat, { headers: { "Cache-Control": "no-store" } });
}
