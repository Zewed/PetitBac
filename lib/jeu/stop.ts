import { and, eq, isNull, sql } from "drizzle-orm";
import { joueurs, manches } from "@/db/schema";
import type { Db } from "@/db/types";
import { enregistrerReponses, lireManche, terminerManche, type Saisies } from "./manches";

/** Les secondes laissées aux autres après un STOP. Réglable de 0 à 30 s avec le ticket 16. */
export const TEMPS_DE_GRACE_S = 10;

type Resultat = { ok: true } | { ok: false; erreur: string };

/**
 * Un Joueur dont la Grille est complète dit STOP : sa Grille se ferme, et toutes les autres Grilles de la Manche
 * n'ont plus que le Temps de grâce. Un seul STOP compte : la mise à jour ne passe que si personne ne l'a encore dit.
 */
export async function direStop(db: Db, mancheId: string, joueurId: string, saisies: Saisies, maintenant = new Date()): Promise<Resultat> {
  const manche = await lireManche(db, mancheId, joueurId, maintenant);
  if (!manche || !manche.partieId || !manche.salonCode) return { ok: false, erreur: "Le STOP se dit entre amis, dans un salon." };
  if (manche.etat !== "en_cours" || manche.resteS === 0) return { ok: false, erreur: "La manche est déjà finie." };
  const enregistre = await enregistrerReponses(db, mancheId, joueurId, saisies, maintenant);
  if (!enregistre.ok) return enregistre;
  const relue = (await lireManche(db, mancheId, joueurId, maintenant))!;
  const manquent = relue.reponses.filter((r) => r.saisie.trim() === "").length;
  if (manquent > 0) return { ok: false, erreur: `Encore ${manquent} case${manquent > 1 ? "s" : ""} à remplir pour dire STOP.` };

  const finGrace = new Date(maintenant.getTime() + TEMPS_DE_GRACE_S * 1000);
  const touchees = await db
    .update(manches)
    .set({ stopParId: joueurId, finitLe: sql`least(${manches.finitLe}, ${finGrace.toISOString()}::timestamptz)` })
    .where(and(eq(manches.partieId, manche.partieId), eq(manches.numero, manche.partie!.numero), isNull(manches.stopParId)))
    .returning({ id: manches.id });
  if (touchees.length === 0) {
    const [deja] = await db
      .select({ pseudo: joueurs.pseudo })
      .from(manches)
      .innerJoin(joueurs, eq(joueurs.id, manches.stopParId))
      .where(eq(manches.id, mancheId));
    return { ok: false, erreur: `${deja?.pseudo ?? "Quelqu'un"} a déjà dit STOP.` };
  }
  await terminerManche(db, mancheId, joueurId, {}, maintenant);
  return { ok: true };
}
