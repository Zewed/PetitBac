import "server-only";
import { cookies } from "next/headers";
import { obtenirDb } from "@/db/client";
import { trouverJoueur, type Joueur } from "@/lib/jeu/joueurs";

const COOKIE = "pb_joueur";

/** Sans Compte, le Joueur est reconnu sur son appareil par un cookie qui ne porte que son identifiant. */
export async function joueurCourant(): Promise<Joueur | undefined> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return undefined;
  return trouverJoueur(await obtenirDb(), id);
}

export async function retenirJoueur(id: string) {
  (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
}
