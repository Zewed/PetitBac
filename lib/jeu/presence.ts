import { and, asc, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { joueurs, manches, parties, salonJoueurs, salons } from "@/db/schema";
import type { Db } from "@/db/types";
import { PREREGLAGES, type IdPrereglage } from "./prereglages";
import { codeDepuisSaisie } from "./salons";

/** Sans relire le Salon depuis ce temps, un Joueur apparaît absent aux autres. */
export const ABSENT_APRES_S = 15; // la même valeur que dans salons.ts
/** Un Hôte absent depuis ce temps est remplacé par le Joueur présent arrivé juste après lui. */
export const RELEVE_HOTE_APRES_S = 60;

async function leSalon(db: Db, code: string) {
  const [salon] = await db.select().from(salons).where(eq(salons.code, codeDepuisSaisie(code)));
  return salon;
}

/** Le Joueur relit le Salon : il est présent. Et si l'Hôte ne donne plus de nouvelles, un autre prend la relève. */
export async function marquerPresent(db: Db, code: string, joueurId: string, maintenant = new Date()) {
  const salon = await leSalon(db, code);
  if (!salon) return;
  await db.update(salonJoueurs).set({ vuLe: maintenant }).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, joueurId)));
  const [hote] = await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, salon.hoteId)));
  if (hote && hote.vuLe.getTime() >= maintenant.getTime() - RELEVE_HOTE_APRES_S * 1000) return;
  const [releve] = await db
    .select()
    .from(salonJoueurs)
    .where(
      and(
        eq(salonJoueurs.salonId, salon.id),
        ne(salonJoueurs.joueurId, salon.hoteId),
        gte(salonJoueurs.vuLe, new Date(maintenant.getTime() - ABSENT_APRES_S * 1000)),
      ),
    )
    .orderBy(asc(salonJoueurs.rejointLe))
    .limit(1);
  if (releve) await db.update(salons).set({ hoteId: releve.joueurId }).where(eq(salons.id, salon.id));
}

/** Le Joueur quitte le Salon ; si c'était l'Hôte, le Joueur arrivé juste après lui le remplace. */
export async function quitterSalon(db: Db, code: string, joueurId: string) {
  const salon = await leSalon(db, code);
  if (!salon) return;
  await db.delete(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, joueurId)));
  if (salon.hoteId !== joueurId) return;
  const [suivant] = await db.select().from(salonJoueurs).where(eq(salonJoueurs.salonId, salon.id)).orderBy(asc(salonJoueurs.rejointLe)).limit(1);
  if (suivant) await db.update(salons).set({ hoteId: suivant.joueurId }).where(eq(salons.id, salon.id));
}

/** La Partie de Salon en cours d'un Joueur, pour « Reprendre » sur l'accueil. */
export async function partieEnCoursDuJoueur(db: Db, joueurId: string) {
  const siens = await db.select({ salonId: salonJoueurs.salonId }).from(salonJoueurs).where(eq(salonJoueurs.joueurId, joueurId));
  if (!siens.length) return null;
  const [partie] = await db
    .select()
    .from(parties)
    .where(and(inArray(parties.salonId, siens.map((s) => s.salonId)), eq(parties.etat, "en_cours")))
    .orderBy(desc(parties.creeLe))
    .limit(1);
  if (!partie) return null;
  const [salon] = await db.select({ code: salons.code, hote: joueurs.pseudo }).from(salons).innerJoin(joueurs, eq(joueurs.id, salons.hoteId)).where(eq(salons.id, partie.salonId!));
  const [derniere] = await db.select({ numero: manches.numero }).from(manches).where(eq(manches.partieId, partie.id)).orderBy(desc(manches.numero)).limit(1);
  return { code: salon.code, hote: salon.hote, numero: derniere?.numero ?? 1, nbManches: partie.nbManches, nom: PREREGLAGES[partie.prereglage as IdPrereglage].nom };
}

/** Les Joueurs du Salon qui n'ont pas relu le Salon depuis un moment. */
export async function absents(db: Db, salonId: string, maintenant = new Date()) {
  const lignes = await db
    .select({ joueurId: salonJoueurs.joueurId })
    .from(salonJoueurs)
    .where(and(eq(salonJoueurs.salonId, salonId), lt(salonJoueurs.vuLe, new Date(maintenant.getTime() - ABSENT_APRES_S * 1000))));
  return new Set(lignes.map((l) => l.joueurId));
}
