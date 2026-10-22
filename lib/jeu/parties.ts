import { and, desc, eq, ne } from "drizzle-orm";
import { manches, parties } from "@/db/schema";
import type { Db } from "@/db/types";
import { categoriesPour, PREREGLAGES, type IdPrereglage } from "./prereglages";
import { dureeStockeeS, lettrePour, lettresRestantes, nbManchesPour, objectifDe, reglagesDe, reglagesDuPrereglage, type Reglages } from "./reglages";

type Options = { prereglage?: IdPrereglage; reglages?: Reglages; lettre?: string; maintenant?: Date; aleatoire?: () => number };

/** Une Partie libre : un Préréglage, ou des Réglages Personnalisés, et sa première Manche lancée tout de suite. */
export async function commencerPartieLibre(db: Db, joueurId: string, { prereglage = "classique", reglages, lettre, maintenant = new Date(), aleatoire }: Options = {}) {
  const r = prereglage === "personnalise" ? (reglages ?? reglagesDuPrereglage("classique")) : reglagesDuPrereglage(prereglage);
  const [partie] = await db
    .insert(parties)
    .values({
      joueurId,
      prereglage,
      nbManches: nbManchesPour(r),
      dureeS: dureeStockeeS(r),
      categories: categoriesPour(prereglage, aleatoire),
      reglages: prereglage === "personnalise" ? r : null,
    })
    .returning();
  return lancerManche(db, partie, 1, [], maintenant, { lettre, aleatoire });
}

/** La Manche suivante, une fois la précédente jugée ; rien quand la Partie est finie ou la Manche en cours. */
export async function mancheSuivante(db: Db, partieId: string, joueurId: string, { maintenant = new Date(), aleatoire, lettre }: Omit<Options, "prereglage" | "reglages"> = {}) {
  const partie = await trouverPartie(db, partieId, joueurId);
  if (!partie || partie.etat !== "en_cours") return undefined;
  const jouees = await db.select().from(manches).where(eq(manches.partieId, partieId)).orderBy(desc(manches.numero));
  const derniere = jouees[0];
  if (!derniere || derniere.etat !== "jugee" || derniere.numero >= partie.nbManches) return undefined;
  return lancerManche(db, partie, derniere.numero + 1, jouees.map((m) => m.lettre), maintenant, { lettre, aleatoire });
}

async function lancerManche(
  db: Db,
  partie: typeof parties.$inferSelect,
  numero: number,
  dejaTirees: string[],
  maintenant: Date,
  { lettre, aleatoire }: { lettre?: string; aleatoire?: () => number },
) {
  const reglages = reglagesDe(partie);
  const [manche] = await db
    .insert(manches)
    .values({
      joueurId: partie.joueurId,
      partieId: partie.id,
      numero,
      // En Partie libre, « choisie par l'Hôte », c'est le Joueur qui choisit.
      lettre: lettrePour(reglages, dejaTirees, { lettre: reglages.choixLettre === "hote" ? lettre : undefined, aleatoire }),
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
  /** Les Réglages d'une Partie Personnalisée ; null pour un Préréglage. */
  reglages: Reglages | null;
  /** Les Lettres qui peuvent encore tomber, pour choisir celle de la Manche suivante. */
  lettresRestantes: string[];
  /** « Le premier à X points gagne » : l'objectif ; null pour un nombre de Manches. */
  objectif: number | null;
  /** Le meilleur total des autres Parties terminées avec ce Préréglage, ou null s'il n'y en a pas (ni en Personnalisé). */
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
  // Des Réglages Personnalisés ne se comparent pas d'une Partie à l'autre : pas de record.
  const record = autres.length && prereglage !== "personnalise" ? Math.max(...autres.map((p) => p.total)) : null;
  const personnalise = prereglage === "personnalise";
  return {
    id: partie.id,
    prereglage,
    nom: PREREGLAGES[prereglage].nom,
    nbManches: partie.nbManches,
    dureeS: partie.dureeS,
    etat: partie.etat,
    total: partie.total,
    record,
    objectif: objectifDe(reglagesDe(partie)),
    reglages: partie.reglages,
    lettresRestantes: lettresRestantes(reglagesDe(partie), (await db.select({ lettre: manches.lettre }).from(manches).where(eq(manches.partieId, partie.id))).map((m) => m.lettre)),
    nouveauRecord: !personnalise && partie.etat === "terminee" && (record === null || partie.total > record),
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
    if (id === "personnalise") continue;
    meilleurs[id] = Math.max(meilleurs[id] ?? 0, total);
  }
  return meilleurs;
}
