import { eq } from "drizzle-orm";
import { joueurs } from "@/db/schema";
import type { Db } from "@/db/types";
import type { Joueur } from "./joueurs";
import { validerPseudo } from "./joueurs";

export const REFUS_MOINS_DE_15_ANS = "Le compte est réservé aux 15 ans et plus. Tu peux continuer à jouer sans compte.";

type Rattachement = { joueur: Joueur; nouveau: boolean } | { erreur: string };

/**
 * Le Joueur d'un Compte (identifiant Neon Auth), au retour du lien e-mail ou de Google :
 * - un Compte déjà rattaché retrouve son Joueur, sur n'importe quel appareil, avec sa Série, ses records et « Mes règles » ;
 * - un nouveau Compte prend le Joueur de l'appareil, s'il n'a pas déjà de Compte : il garde tout ce qu'il avait ;
 * - sinon, un nouveau Joueur est créé pour ce Compte.
 * Un nouveau Compte demande d'avoir confirmé 15 ans ou plus.
 */
export async function rattacherCompte(
  db: Db,
  { compteId, joueurAppareilId, pseudo, quinzeAns }: { compteId: string; joueurAppareilId: string | null; pseudo: string; quinzeAns: boolean },
  maintenant = new Date(),
): Promise<Rattachement> {
  const [deja] = await db.select({ id: joueurs.id, pseudo: joueurs.pseudo }).from(joueurs).where(eq(joueurs.compteId, compteId));
  if (deja) return { joueur: deja, nouveau: false };
  if (!quinzeAns) return { erreur: REFUS_MOINS_DE_15_ANS };
  const [appareil] = joueurAppareilId ? await db.select().from(joueurs).where(eq(joueurs.id, joueurAppareilId)) : [];
  if (appareil && !appareil.compteId) {
    await db.update(joueurs).set({ compteId, quinzeAnsConfirmeLe: maintenant }).where(eq(joueurs.id, appareil.id));
    return { joueur: { id: appareil.id, pseudo: appareil.pseudo }, nouveau: true };
  }
  const [cree] = await db
    .insert(joueurs)
    .values({ pseudo, compteId, quinzeAnsConfirmeLe: maintenant })
    .returning({ id: joueurs.id, pseudo: joueurs.pseudo });
  return { joueur: cree, nouveau: true };
}

/** Le Compte d'un Joueur, ou rien. */
export async function compteDuJoueur(db: Db, joueurId: string) {
  const [ligne] = await db.select({ compteId: joueurs.compteId, quinzeAnsConfirmeLe: joueurs.quinzeAnsConfirmeLe }).from(joueurs).where(eq(joueurs.id, joueurId));
  return ligne;
}

/** Un pseudo pour un Compte qui arrive sans Joueur : son nom, sinon le début de son adresse, sinon « Joueur ». */
export function pseudoPropose(nom: string | null | undefined, email: string | null | undefined): string {
  const candidats = [nom ?? "", (email ?? "").split("@")[0].replace(/[._+]+/g, " ")];
  for (const c of candidats) {
    const v = validerPseudo(c.trim().slice(0, 20).trim());
    if (v.ok) return v.pseudo;
  }
  return "Joueur";
}
