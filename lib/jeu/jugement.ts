import { and, eq, inArray, sql } from "drizzle-orm";
import { cotes, manches, parties, reponses, reponsesJugees } from "@/db/schema";
import type { Db } from "@/db/types";
import { coupleJoue } from "./cotes";
import type { Decision, Juge } from "./juge/types";
import { lireManche } from "./manches";
import { palierPourPart } from "./paliers";
import { normaliser, sansArticle } from "./texte";

/**
 * Juge les Réponses d'une Manche terminée et compte ses points.
 * Les Réponses déjà jugées viennent du cache ; les autres partent au Juge en un seul appel.
 * Si le Juge ne répond pas, la Manche passe en « jugement_echoue » et garde sa Grille, prête à être relancée.
 */
export async function jugerManche(db: Db, juge: Juge, id: string, joueurId: string) {
  const manche = await lireManche(db, id, joueurId);
  if (!manche || (manche.etat !== "a_juger" && manche.etat !== "jugement_echoue")) return;
  const { lettre } = manche;
  const remplies = manche.reponses
    .map((r) => ({ categorie: r.categorie, saisie: r.saisie.trim(), cle: normaliser(r.saisie) }))
    .filter((r) => r.cle !== "");

  const decisions = new Map<string, Decision>();
  const cle = (categorie: string, c: string) => `${categorie}\u0000${c}`;
  for (const r of remplies) {
    if (!sansArticle(r.cle).startsWith(lettre.toLowerCase())) decisions.set(cle(r.categorie, r.cle), { valide: false, formeReference: null, partEstimee: null });
  }
  const aChercher = remplies.filter((r) => !decisions.has(cle(r.categorie, r.cle)));
  if (aChercher.length > 0) {
    const enCache = await db
      .select()
      .from(reponsesJugees)
      .where(and(eq(reponsesJugees.lettre, lettre), inArray(reponsesJugees.cle, aChercher.map((r) => r.cle))));
    for (const c of enCache) decisions.set(cle(c.categorie, c.cle), c);
  }

  const inconnues = remplies.filter((r) => !decisions.has(cle(r.categorie, r.cle)));
  if (inconnues.length > 0) {
    let nouvelles: Decision[];
    try {
      nouvelles = await juge.juger(lettre, inconnues.map(({ categorie, saisie }) => ({ categorie, saisie })));
    } catch {
      await db.update(manches).set({ etat: "jugement_echoue" }).where(eq(manches.id, id));
      return;
    }
    const lignes = inconnues.map((r, i) => ({ categorie: r.categorie, lettre, cle: r.cle, ...nouvelles[i] }));
    await db.insert(reponsesJugees).values(lignes).onConflictDoNothing();
    for (const l of lignes) decisions.set(cle(l.categorie, l.cle), l);
  }

  let total = 0;
  for (const categorie of manche.categories) {
    const r = remplies.find((x) => x.categorie === categorie);
    const decision = r ? decisions.get(cle(categorie, r.cle)) : undefined;
    let palier: string | null = null;
    let points = 0;
    if (decision?.valide && decision.formeReference) {
      const part = await partDe(db, categorie, lettre, decision);
      ({ nom: palier, points } = palierPourPart(part));
    }
    total += points;
    const valeurs = { valide: decision?.valide ?? null, formeReference: decision?.formeReference ?? null, palier, points };
    await db
      .insert(reponses)
      .values({ mancheId: id, categorie, saisie: r?.saisie ?? "", ...valeurs })
      .onConflictDoUpdate({ target: [reponses.mancheId, reponses.categorie], set: valeurs });
  }
  await db.update(manches).set({ etat: "jugee", total }).where(eq(manches.id, id));
  if (manche.partie) await compterPartie(db, manche.partie.id, manche.partie.numero === manche.partie.nbManches);
}

/** Le total de la Partie suit ses Manches jugées ; après la dernière, la Partie est terminée. */
async function compterPartie(db: Db, partieId: string, derniere: boolean) {
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${manches.total}), 0)::int` })
    .from(manches)
    .where(and(eq(manches.partieId, partieId), eq(manches.etat, "jugee")));
  await db
    .update(parties)
    .set(derniere ? { total, etat: "terminee", termineeLe: new Date() } : { total })
    .where(eq(parties.id, partieId));
}

/**
 * La Cote de la Réponse. Un couple assez joué ne connaît que les vraies Réponses : une Réponse qui n'y figure pas
 * n'a jamais été donnée, elle est Légendaire. Au démarrage, l'estimation du Juge fixe la Cote jusqu'au recalcul.
 */
async function partDe(db: Db, categorie: string, lettre: string, decision: Decision): Promise<number | null> {
  const formeReference = decision.formeReference!;
  const where = and(eq(cotes.categorie, categorie), eq(cotes.lettre, lettre), eq(cotes.formeReference, formeReference));
  const [cote] = await db.select().from(cotes).where(where);
  if (cote) return cote.part;
  if (await coupleJoue(db, categorie, lettre)) return 0;
  if (decision.partEstimee == null) return null;
  await db.insert(cotes).values({ categorie, lettre, formeReference, part: decision.partEstimee }).onConflictDoNothing();
  return decision.partEstimee;
}
