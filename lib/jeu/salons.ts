import { and, asc, count, eq } from "drizzle-orm";
import { joueurs, salonJoueurs, salons } from "@/db/schema";
import type { Db } from "@/db/types";
import type { IdPrereglage } from "./prereglages";

/** Sans relire le Salon depuis ce temps, un Joueur apparaît absent aux autres (presence.ts). */
const ABSENT_APRES_S = 15;

export const MAX_JOUEURS_SALON = 10;

// Sans 0, O, 1, I ni L : un code qui se dicte et se tape sans se tromper.
const ALPHABET_CODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LONGUEUR_CODE = 6;

function nouveauCode(aleatoire: () => number = Math.random) {
  return Array.from({ length: LONGUEUR_CODE }, () => ALPHABET_CODE[Math.floor(aleatoire() * ALPHABET_CODE.length)]).join("");
}

/** Le code d'un Salon depuis ce que le Joueur a tapé : le code seul, avec des espaces ou en minuscules, ou le lien entier. */
export function codeDepuisSaisie(saisie: string): string {
  const sansLien = saisie.trim().replace(/^.*\/salon\//i, "").split(/[?#/]/)[0];
  return sansLien.replace(/[\s-]/g, "").toUpperCase();
}

export async function creerSalon(db: Db, hoteId: string, prereglage: IdPrereglage) {
  for (let essai = 0; essai < 5; essai++) {
    const [salon] = await db.insert(salons).values({ code: nouveauCode(), hoteId, prereglage }).onConflictDoNothing().returning();
    if (salon) {
      await db.insert(salonJoueurs).values({ salonId: salon.id, joueurId: hoteId });
      return salon;
    }
  }
  throw new Error("Impossible de trouver un code de salon libre.");
}

export type ResultatRejoindre = { ok: true; code: string } | { ok: false; erreur: string };

export async function rejoindreSalon(db: Db, saisie: string, joueurId: string): Promise<ResultatRejoindre> {
  const code = codeDepuisSaisie(saisie);
  const [salon] = code ? await db.select().from(salons).where(eq(salons.code, code)) : [];
  if (!salon) return { ok: false, erreur: "Aucun salon avec ce code. Vérifie-le auprès de celui qui t'a invité." };
  const [deja] = await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, joueurId)));
  if (deja) return { ok: true, code };
  const [{ n }] = await db.select({ n: count() }).from(salonJoueurs).where(eq(salonJoueurs.salonId, salon.id));
  if (n >= MAX_JOUEURS_SALON) return { ok: false, erreur: `Ce salon est plein : ${MAX_JOUEURS_SALON} joueurs au maximum.` };
  await db.insert(salonJoueurs).values({ salonId: salon.id, joueurId }).onConflictDoNothing();
  return { ok: true, code };
}

export type SalonVu = {
  code: string;
  prereglage: IdPrereglage;
  joueurs: { pseudo: string; hote: boolean; moi: boolean; absent: boolean }[];
  /** L'Hôte est seul : il attend au moins un autre Joueur. */
  enAttente: boolean;
  jeSuisHote: boolean;
};

/** Le Salon tel que le voit un de ses Joueurs ; rien pour qui n'y est pas. */
export async function lireSalon(db: Db, saisie: string, joueurId: string, maintenant = new Date()): Promise<SalonVu | undefined> {
  const code = codeDepuisSaisie(saisie);
  const [salon] = code ? await db.select().from(salons).where(eq(salons.code, code)) : [];
  if (!salon) return undefined;
  const presents = await db
    .select({ joueurId: salonJoueurs.joueurId, pseudo: joueurs.pseudo, vuLe: salonJoueurs.vuLe })
    .from(salonJoueurs)
    .innerJoin(joueurs, eq(joueurs.id, salonJoueurs.joueurId))
    .where(eq(salonJoueurs.salonId, salon.id))
    .orderBy(asc(salonJoueurs.rejointLe));
  if (!presents.some((p) => p.joueurId === joueurId)) return undefined;
  return {
    code: salon.code,
    prereglage: salon.prereglage as IdPrereglage,
    joueurs: presents.map((p) => ({
      pseudo: p.pseudo,
      hote: p.joueurId === salon.hoteId,
      moi: p.joueurId === joueurId,
      absent: p.vuLe.getTime() < maintenant.getTime() - ABSENT_APRES_S * 1000,
    })),
    enAttente: presents.length < 2,
    jeSuisHote: salon.hoteId === joueurId,
  };
}

export async function salonExiste(db: Db, saisie: string): Promise<boolean> {
  const code = codeDepuisSaisie(saisie);
  if (!code) return false;
  const [salon] = await db.select({ id: salons.id }).from(salons).where(eq(salons.code, code));
  return Boolean(salon);
}
