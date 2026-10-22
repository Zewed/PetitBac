import { ouvrirPglite } from "@/db/pglite";
import { choisirPseudo } from "./joueurs";

export async function unJoueur() {
  const db = await ouvrirPglite();
  const resultat = await choisirPseudo(db, "Juju");
  if (!resultat.ok) throw new Error(resultat.erreur);
  return { db, joueur: resultat.joueur };
}

export const T0 = new Date("2026-10-22T20:00:00.000Z");
export const plus = (secondes: number) => new Date(T0.getTime() + secondes * 1000);
