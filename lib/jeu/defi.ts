import { and, asc, eq } from "drizzle-orm";
import { defis, manches } from "@/db/schema";
import type { Db } from "@/db/types";
import { tirerLettre } from "./lettres";
import { PACK_CLASSIQUE } from "./packs";

export const DUREE_DEFI_S = 180;
export const NB_CATEGORIES_DEFI = 12;

/** Le jour à Paris, « 2026-10-22 » : le Défi change à minuit, heure de Paris. */
export function jourAParis(maintenant: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(maintenant);
}

/** « Jeudi 22 octobre ». */
export function jourEnToutesLettres(maintenant: Date): string {
  const s = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" }).format(maintenant);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joursEntre(debut: string, fin: string): number {
  return Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86_400_000);
}

export type Defi = { numero: number; date: string; lettre: string; categories: string[] };

/** Le Défi du jour, le même pour tous ; le n°1 est celui du jour du lancement, le premier jour où un Défi a existé. */
export async function defiDuJour(db: Db, maintenant = new Date(), aleatoire: () => number = Math.random): Promise<Defi> {
  const date = jourAParis(maintenant);
  const [existant] = await db.select().from(defis).where(eq(defis.date, date));
  if (existant) return existant;
  const [premier] = await db.select().from(defis).orderBy(asc(defis.date)).limit(1);
  const numero = premier ? premier.numero + joursEntre(premier.date, date) : 1;
  const categories = [...PACK_CLASSIQUE].sort(() => aleatoire() - 0.5).slice(0, NB_CATEGORIES_DEFI);
  await db.insert(defis).values({ numero, date, lettre: tirerLettre(aleatoire), categories }).onConflictDoNothing();
  const [defi] = await db.select().from(defis).where(eq(defis.date, date));
  return defi;
}

/** Lance le Défi du jour, ou rend celui déjà lancé : un seul essai, et recharger ne remet pas le chrono à zéro. */
export async function commencerDefi(db: Db, joueurId: string, maintenant = new Date()) {
  const defi = await defiDuJour(db, maintenant);
  const deja = await mancheDuDefi(db, joueurId, defi.numero);
  if (deja) return deja;
  await db
    .insert(manches)
    .values({
      joueurId,
      defiNumero: defi.numero,
      lettre: defi.lettre,
      categories: defi.categories,
      commenceeLe: maintenant,
      finitLe: new Date(maintenant.getTime() + DUREE_DEFI_S * 1000),
    })
    .onConflictDoNothing();
  return (await mancheDuDefi(db, joueurId, defi.numero))!;
}

async function mancheDuDefi(db: Db, joueurId: string, numero: number) {
  const [manche] = await db.select().from(manches).where(and(eq(manches.joueurId, joueurId), eq(manches.defiNumero, numero)));
  return manche;
}

/** Le Défi du jour vu par un Joueur : pas encore lancé, en cours, ou fait avec son total. */
export async function monDefi(db: Db, joueurId: string, maintenant = new Date()) {
  const defi = await defiDuJour(db, maintenant);
  const manche = await mancheDuDefi(db, joueurId, defi.numero);
  return { defi, mancheId: manche?.id ?? null, etat: manche?.etat ?? null, total: manche?.total ?? null };
}
