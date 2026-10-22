import { and, eq, isNotNull, sql } from "drizzle-orm";
import { cotes, couples, manches, reponses } from "@/db/schema";
import type { Db } from "@/db/types";

/**
 * Le nombre de Grilles à partir duquel un couple Catégorie + Lettre est assez joué pour que les vraies
 * Réponses des Joueurs remplacent la Cote de démarrage. À ajuster après les premières parties, comme les seuils des Paliers.
 */
export const SEUIL_COUPLE_JOUE = 30;

type Couple = { categorie: string; lettre: string; joues: number };
type Ligne = { categorie: string; lettre: string; formeReference: string; part: number };
type Ecrire = (tx: Db, couplesJoues: Couple[], lignes: Ligne[]) => Promise<void>;

/**
 * Le recalcul de la nuit. Pour chaque couple Catégorie + Lettre assez joué, la Cote d'une Réponse devient la part
 * des Grilles qui l'ont donnée parmi toutes celles qui ont joué ce couple, depuis toujours, toutes Parties confondues ;
 * seules les Réponses validées comptent. Tout s'écrit d'un coup : si quelque chose casse, la Cote de la veille reste.
 */
export async function recalculerCotes(db: Db, { ecrire = ecrireCotes, maintenant = new Date() }: { ecrire?: Ecrire; maintenant?: Date } = {}) {
  const parCouple = await db
    .select({ categorie: reponses.categorie, lettre: manches.lettre, joues: sql<number>`count(*)::int` })
    .from(reponses)
    .innerJoin(manches, eq(reponses.mancheId, manches.id))
    .where(eq(manches.etat, "jugee"))
    .groupBy(reponses.categorie, manches.lettre);
  const couplesJoues = parCouple.filter((c) => c.joues >= SEUIL_COUPLE_JOUE);
  const joues = new Map(couplesJoues.map((c) => [`${c.categorie}\u0000${c.lettre}`, c.joues]));

  const parForme = await db
    .select({ categorie: reponses.categorie, lettre: manches.lettre, formeReference: reponses.formeReference, n: sql<number>`count(*)::int` })
    .from(reponses)
    .innerJoin(manches, eq(reponses.mancheId, manches.id))
    .where(and(eq(manches.etat, "jugee"), eq(reponses.valide, true), isNotNull(reponses.formeReference)))
    .groupBy(reponses.categorie, manches.lettre, reponses.formeReference);
  const lignes = parForme.flatMap((f) => {
    const total = joues.get(`${f.categorie}\u0000${f.lettre}`);
    return total ? [{ categorie: f.categorie, lettre: f.lettre, formeReference: f.formeReference!, part: f.n / total }] : [];
  });

  await db.transaction(async (tx) => {
    await ecrire(tx as unknown as Db, couplesJoues, lignes);
    for (const c of couplesJoues) {
      await tx
        .insert(couples)
        .values({ categorie: c.categorie, lettre: c.lettre, joues: c.joues, recalculeLe: maintenant })
        .onConflictDoUpdate({ target: [couples.categorie, couples.lettre], set: { joues: c.joues, recalculeLe: maintenant } });
    }
  });
  return { couples: couplesJoues.length, cotes: lignes.length };
}

async function ecrireCotes(tx: Db, couplesJoues: Couple[], lignes: Ligne[]) {
  for (const c of couplesJoues) {
    await tx.delete(cotes).where(and(eq(cotes.categorie, c.categorie), eq(cotes.lettre, c.lettre)));
  }
  for (let i = 0; i < lignes.length; i += 500) await tx.insert(cotes).values(lignes.slice(i, i + 500));
}

/** Un couple dont la Cote vient des vraies Réponses : une Réponse qui n'y figure pas n'a jamais été donnée. */
export async function coupleJoue(db: Db, categorie: string, lettre: string): Promise<boolean> {
  const [c] = await db.select().from(couples).where(and(eq(couples.categorie, categorie), eq(couples.lettre, lettre)));
  return Boolean(c);
}
