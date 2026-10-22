import { and, eq, sql } from "drizzle-orm";
import { manches, reponses, type EtatManche } from "@/db/schema";
import type { Db } from "@/db/types";
import { tirerLettre } from "./lettres";
import { PACK_CLASSIQUE } from "./packs";

export const DUREE_PARTIE_LIBRE_S = 90;

export type Manche = {
  id: string;
  lettre: string;
  categories: string[];
  finitLe: Date;
  etat: EtatManche;
  total: number | null;
  reponses: { categorie: string; saisie: string; valide: boolean | null; formeReference: string | null; palier: string | null; points: number | null }[];
  /** Secondes qui restent au chrono selon l'horloge du serveur, 0 quand il est écoulé. */
  resteS: number;
};

type Options = { maintenant?: Date; aleatoire?: () => number };

export async function commencerPartieLibre(db: Db, joueurId: string, { maintenant = new Date(), aleatoire }: Options = {}) {
  const [manche] = await db
    .insert(manches)
    .values({
      joueurId,
      lettre: tirerLettre(aleatoire),
      categories: PACK_CLASSIQUE,
      commenceeLe: maintenant,
      finitLe: new Date(maintenant.getTime() + DUREE_PARTIE_LIBRE_S * 1000),
    })
    .returning();
  return manche;
}

export async function lireManche(db: Db, id: string, joueurId: string, maintenant = new Date()): Promise<Manche | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const [manche] = await db.select().from(manches).where(and(eq(manches.id, id), eq(manches.joueurId, joueurId)));
  if (!manche) return undefined;
  const lignes = await db.select().from(reponses).where(eq(reponses.mancheId, id));
  const parCategorie = new Map(lignes.map((r) => [r.categorie, r]));
  return {
    id: manche.id,
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
