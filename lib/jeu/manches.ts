import { and, eq, sql } from "drizzle-orm";
import { manches, parties, reponses, salons, type EtatManche } from "@/db/schema";
import type { Db } from "@/db/types";

import { PREREGLAGES, type IdPrereglage } from "./prereglages";

export type Manche = {
  id: string;
  partieId: string | null;
  lettre: string;
  categories: string[];
  finitLe: Date;
  etat: EtatManche;
  total: number | null;
  reponses: { categorie: string; saisie: string; valide: boolean | null; formeReference: string | null; palier: string | null; points: number | null }[];
  /** Secondes qui restent au chrono selon l'horloge du serveur, 0 quand il est écoulé. */
  resteS: number;
  /** La Partie de cette Manche : son Préréglage, le numéro de la Manche et le total de la Partie. */
  partie: { id: string; prereglage: IdPrereglage; nom: string; numero: number; nbManches: number; dureeS: number; total: number; etat: "en_cours" | "terminee" } | null;
  /** Le code du Salon quand la Manche est jouée entre amis. */
  salonCode: string | null;
  /** Le numéro du Défi du jour quand la Manche en est un. */
  defiNumero: number | null;
  /** La durée du chrono, en secondes. */
  dureeS: number;
};

export async function lireManche(db: Db, id: string, joueurId: string, maintenant = new Date()): Promise<Manche | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const [manche] = await db.select().from(manches).where(and(eq(manches.id, id), eq(manches.joueurId, joueurId)));
  if (!manche) return undefined;
  const lignes = await db.select().from(reponses).where(eq(reponses.mancheId, id));
  const [partie] = manche.partieId ? await db.select().from(parties).where(eq(parties.id, manche.partieId)) : [];
  const [salon] = partie?.salonId ? await db.select({ code: salons.code }).from(salons).where(eq(salons.id, partie.salonId)) : [];
  const parCategorie = new Map(lignes.map((r) => [r.categorie, r]));
  return {
    id: manche.id,
    partieId: manche.partieId,
    defiNumero: manche.defiNumero,
    salonCode: salon?.code ?? null,
    dureeS: Math.round((manche.finitLe.getTime() - manche.commenceeLe.getTime()) / 1000),
    lettre: manche.lettre,
    categories: manche.categories,
    finitLe: manche.finitLe,
    etat: manche.etat,
    total: manche.total,
    reponses: manche.categories.map((categorie) => {
      const r = parCategorie.get(categorie);
      return {
        categorie,
        saisie: r?.saisie ?? "",
        valide: r?.valide ?? null,
        formeReference: r?.formeReference ?? null,
        palier: r?.palier ?? null,
        points: r?.points ?? null,
      };
    }),
    resteS: Math.max(0, Math.ceil((manche.finitLe.getTime() - maintenant.getTime()) / 1000)),
    partie: partie
      ? {
          id: partie.id,
          prereglage: partie.prereglage as IdPrereglage,
          nom: PREREGLAGES[partie.prereglage as IdPrereglage].nom,
          numero: manche.numero,
          nbManches: partie.nbManches,
          dureeS: partie.dureeS,
          total: partie.total,
          etat: partie.etat,
        }
      : null,
  };
}

/** Les secondes laissées aux dernières Réponses parties juste avant 0:00 et arrivées juste après. */
export const TRANSIT_S = 3;

export type Saisies = Record<string, string>;
type Resultat = { ok: true } | { ok: false; erreur: string };

export async function enregistrerReponses(db: Db, id: string, joueurId: string, saisies: Saisies, maintenant = new Date()): Promise<Resultat> {
  const manche = await lireManche(db, id, joueurId, maintenant);
  if (!manche) return { ok: false, erreur: "Cette manche n'existe pas." };
  if (manche.etat !== "en_cours" || maintenant.getTime() > manche.finitLe.getTime() + TRANSIT_S * 1000) {
    return { ok: false, erreur: "La manche est finie : ta grille ne peut plus changer." };
  }
  const lignes = Object.entries(saisies)
    .filter(([categorie, saisie]) => manche.categories.includes(categorie) && typeof saisie === "string")
    .map(([categorie, saisie]) => ({ mancheId: id, categorie, saisie: saisie.trim().slice(0, 60) }));
  if (lignes.length === 0) return { ok: true };
  await db
    .insert(reponses)
    .values(lignes)
    .onConflictDoUpdate({ target: [reponses.mancheId, reponses.categorie], set: { saisie: sql`excluded.saisie` } });
  return { ok: true };
}

/** « J'ai fini », ou le chrono arrivé à 0:00 : on garde les dernières Réponses si elles arrivent à temps, puis la Grille se ferme. */
export async function terminerManche(db: Db, id: string, joueurId: string, saisies: Saisies, maintenant = new Date()) {
  const manche = await lireManche(db, id, joueurId, maintenant);
  if (!manche || manche.etat !== "en_cours") return;
  await enregistrerReponses(db, id, joueurId, saisies, maintenant);
  await db
    .update(manches)
    .set({ etat: "a_juger", termineeLe: maintenant })
    .where(and(eq(manches.id, id), eq(manches.etat, "en_cours")));
}
