import { and, desc, eq, ne } from "drizzle-orm";
import { manches, parties } from "@/db/schema";
import type { Db } from "@/db/types";
import { LETTRES_EXCLUES_PAR_DEFAUT, tirerLettre } from "./lettres";
import { categoriesPour, PREREGLAGES, type IdPrereglage } from "./prereglages";

type Options = { prereglage?: IdPrereglage; maintenant?: Date; aleatoire?: () => number };

/** Une Partie libre : un Préréglage, et sa première Manche lancée tout de suite. */
export async function commencerPartieLibre(db: Db, joueurId: string, { prereglage = "classique", maintenant = new Date(), aleatoire }: Options = {}) {
  const { nbManches, dureeS } = PREREGLAGES[prereglage];
  const [partie] = await db
    .insert(parties)
    .values({ joueurId, prereglage, nbManches, dureeS, categories: categoriesPour(prereglage, aleatoire) })
    .returning();
  return lancerManche(db, partie, 1, [], maintenant, aleatoire);
}

/** La Manche suivante, une fois la précédente jugée ; rien quand la Partie est finie ou la Manche en cours. */
export async function mancheSuivante(db: Db, partieId: string, joueurId: string, { maintenant = new Date(), aleatoire }: Omit<Options, "prereglage"> = {}) {
  const partie = await trouverPartie(db, partieId, joueurId);
  if (!partie || partie.etat !== "en_cours") return undefined;
  const jouees = await db.select().from(manches).where(eq(manches.partieId, partieId)).orderBy(desc(manches.numero));
  const derniere = jouees[0];
  if (!derniere || derniere.etat !== "jugee" || derniere.numero >= partie.nbManches) return undefined;
  return lancerManche(db, partie, derniere.numero + 1, jouees.map((m) => m.lettre), maintenant, aleatoire);
}

async function lancerManche(db: Db, partie: typeof parties.$inferSelect, numero: number, dejaTirees: string[], maintenant: Date, aleatoire?: () => number) {
  const [manche] = await db
    .insert(manches)
    .values({
      joueurId: partie.joueurId,
      partieId: partie.id,
      numero,
      lettre: tirerLettre(aleatoire, [...LETTRES_EXCLUES_PAR_DEFAUT, ...dejaTirees]),
      categories: partie.categories,
      commenceeLe: maintenant,
      finitLe: new Date(maintenant.getTime() + partie.dureeS * 1000),
    })
    .returning();
  return manche;
}

async function trouverPartie(db: Db, id: string, joueurId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const [partie] = await db.select().from(parties).where(and(eq(parties.id, id), eq(parties.joueurId, joueurId)));
  return partie;
}

export type Partie = {
  id: string;
  prereglage: IdPrereglage;
  nom: string;
  nbManches: number;
  dureeS: number;
  etat: "en_cours" | "terminee";
  total: number;
  /** Le meilleur total des autres Parties terminées avec ce Préréglage, ou null s'il n'y en a pas. */
  record: number | null;
  /** La Partie est terminée et bat (ou établit) le record de ce Préréglage. */
  nouveauRecord: boolean;
};

export async function lirePartie(db: Db, id: string, joueurId: string): Promise<Partie | undefined> {
  const partie = await trouverPartie(db, id, joueurId);
  if (!partie) return undefined;
  const prereglage = partie.prereglage as IdPrereglage;
  const autres = await db
    .select({ total: parties.total })
    .from(parties)
    .where(and(eq(parties.joueurId, joueurId), eq(parties.prereglage, prereglage), eq(parties.etat, "terminee"), ne(parties.id, id)));
  const record = autres.length ? Math.max(...autres.map((p) => p.total)) : null;
  return {
    id: partie.id,
    prereglage,
    nom: PREREGLAGES[prereglage].nom,
    nbManches: partie.nbManches,
    dureeS: partie.dureeS,
    etat: partie.etat,
    total: partie.total,
    record,
    nouveauRecord: partie.etat === "terminee" && (record === null || partie.total > record),
  };
}

/** Le meilleur total par Préréglage, sur les seules Parties terminées. */
export async function records(db: Db, joueurId: string): Promise<Partial<Record<IdPrereglage, number>>> {
  const lignes = await db
    .select({ prereglage: parties.prereglage, total: parties.total })
    .from(parties)
    .where(and(eq(parties.joueurId, joueurId), eq(parties.etat, "terminee")));
  const meilleurs: Partial<Record<IdPrereglage, number>> = {};
  for (const { prereglage, total } of lignes) {
    const id = prereglage as IdPrereglage;
    meilleurs[id] = Math.max(meilleurs[id] ?? 0, total);
  }
  return meilleurs;
}
