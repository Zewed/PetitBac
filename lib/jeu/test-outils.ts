import { ouvrirPglite } from "@/db/pglite";
import { expect } from "vitest";
import type { Db } from "@/db/types";
import { choisirPseudo } from "./joueurs";
import { commencerPartieLibre, terminerManche, type Saisies } from "./manches";

export async function unJoueur() {
  const db = await ouvrirPglite();
  const resultat = await choisirPseudo(db, "Juju");
  if (!resultat.ok) throw new Error(resultat.erreur);
  return { db, joueur: resultat.joueur };
}

export const T0 = new Date("2026-10-22T20:00:00.000Z");
export const plus = (secondes: number) => new Date(T0.getTime() + secondes * 1000);

const LETTRES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V"];

/** Une Partie libre d'une Manche, dans la Lettre voulue, terminée avec ces Réponses et prête à être jugée. */
export async function uneMancheEn(lettre: string, saisies: Saisies, base?: { db: Db; joueur: { id: string } }) {
  const { db, joueur } = base ?? (await unJoueur());
  const aleatoire = () => (LETTRES.indexOf(lettre) + 0.5) / LETTRES.length;
  const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0, aleatoire });
  expect(manche.lettre).toBe(lettre);
  await terminerManche(db, manche.id, joueur.id, saisies, plus(40));
  return { db, joueur, id: manche.id };
}
