import { and, eq } from "drizzle-orm";
import { manches } from "@/db/schema";
import type { Db } from "@/db/types";

/**
 * La place du Joueur parmi tous ceux qui ont fini ce Défi : la part des autres qu'il devance.
 * À égalité de points, le plus rapide passe devant. Seul à l'avoir fini, il n'a pas de pourcentage.
 */
export async function positionAuDefi(db: Db, joueurId: string, numero: number): Promise<{ joueurs: number; mieuxQue: number | null } | null> {
  const lignes = await db
    .select({ joueurId: manches.joueurId, total: manches.total, commenceeLe: manches.commenceeLe, termineeLe: manches.termineeLe })
    .from(manches)
    .where(and(eq(manches.defiNumero, numero), eq(manches.etat, "jugee")));
  const joueurs = lignes.map((l) => ({
    joueurId: l.joueurId,
    total: l.total ?? 0,
    duree: (l.termineeLe ?? l.commenceeLe).getTime() - l.commenceeLe.getTime(),
  }));
  const moi = joueurs.find((j) => j.joueurId === joueurId);
  if (!moi) return null;
  if (joueurs.length === 1) return { joueurs: 1, mieuxQue: null };
  const devance = joueurs.filter((j) => j.joueurId !== joueurId && (moi.total > j.total || (moi.total === j.total && moi.duree < j.duree))).length;
  return { joueurs: joueurs.length, mieuxQue: Math.round((100 * devance) / (joueurs.length - 1)) };
}
