import { and, eq, inArray, sql } from "drizzle-orm";
import { contestations, manches, reponses, reponsesJugees, signalementsReponses } from "@/db/schema";
import type { Db } from "@/db/types";
import type { Juge } from "./juge/types";
import { normaliser } from "./texte";

/** Une Réponse à trancher dans /admin : toutes les saisies qui reviennent au même mot, dans une Catégorie et une Lettre. */
export type AArbitrer = {
  categorie: string;
  lettre: string;
  cle: string;
  /** La saisie telle qu'un Joueur l'a tapée la première fois. */
  saisie: string;
  valideParLeJuge: boolean;
  formeReference: string | null;
  /** Les Parties où la Réponse a été signalée ou contestée (une Manche du Défi compte pour une Partie). */
  parties: number;
  signalements: number;
  contestations: number;
  rejugee: boolean;
};

type Plainte = { categorie: string; saisie: string; lettre: string; partie: string; valideParLeJuge: boolean; creeLe: Date; signalement: boolean };

const cleDe = (categorie: string, lettre: string, cle: string) => `${categorie}\u0000${lettre}\u0000${cle}`;

/** Les Signalements en attente et les Contestations de Salon, avec leur Réponse et leur Partie. */
async function plaintes(db: Db): Promise<Plainte[]> {
  const partie = sql<string>`coalesce(${manches.partieId}::text, ${manches.id}::text)`;
  const champs = { categorie: reponses.categorie, saisie: reponses.saisie, lettre: manches.lettre, partie };
  const signales = await db
    .select({ ...champs, valideParLeJuge: signalementsReponses.valideParLeJuge, creeLe: signalementsReponses.creeLe })
    .from(signalementsReponses)
    .innerJoin(reponses, eq(reponses.id, signalementsReponses.reponseId))
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .where(eq(signalementsReponses.etat, "en_attente"));
  const contestees = await db
    .select({ ...champs, valideParLeJuge: contestations.valideParLeJuge, creeLe: contestations.creeLe })
    .from(contestations)
    .innerJoin(reponses, eq(reponses.id, contestations.reponseId))
    .innerJoin(manches, eq(manches.id, reponses.mancheId));
  return [...signales.map((s) => ({ ...s, signalement: true })), ...contestees.map((c) => ({ ...c, signalement: false }))].sort(
    (a, b) => a.creeLe.getTime() - b.creeLe.getTime(),
  );
}

/**
 * La file de /admin : les Réponses signalées ou contestées qu'Antoine n'a pas encore tranchées, la plus ancienne d'abord.
 * Une Réponse signalée ou contestée dans plusieurs Parties est d'abord rejugée par le Juge, une seule fois :
 * sa nouvelle décision remplace l'ancienne dans les Réponses jugées, et c'est elle que la file montre.
 */
export async function fileDArbitrage(db: Db, juge: Juge, maintenant = new Date()): Promise<AArbitrer[]> {
  const groupes = new Map<string, { premiere: Plainte; cle: string; parties: Set<string>; signalements: number; contestations: number }>();
  for (const p of await plaintes(db)) {
    const cle = normaliser(p.saisie);
    const k = cleDe(p.categorie, p.lettre, cle);
    const g = groupes.get(k) ?? { premiere: p, cle, parties: new Set<string>(), signalements: 0, contestations: 0 };
    g.parties.add(p.partie);
    if (p.signalement) g.signalements++;
    else g.contestations++;
    groupes.set(k, g);
  }
  if (groupes.size === 0) return [];

  const lignes = await db
    .select()
    .from(reponsesJugees)
    .where(inArray(reponsesJugees.cle, [...new Set([...groupes.values()].map((g) => g.cle))]));
  const jugees = new Map(lignes.map((l) => [cleDe(l.categorie, l.lettre, l.cle), l]));
  for (const [k, l] of jugees) if (l.trancheeLe) groupes.delete(k);

  // Rejugées par lettre : un seul appel au Juge pour toutes les Réponses d'une même Lettre.
  const aRejuger = [...groupes.entries()].filter(([k, g]) => g.parties.size >= 2 && !jugees.get(k)?.rejugeeLe);
  for (const lettre of new Set(aRejuger.map(([, g]) => g.premiere.lettre))) {
    const deLaLettre = aRejuger.filter(([, g]) => g.premiere.lettre === lettre);
    try {
      const decisions = await juge.juger(lettre, deLaLettre.map(([, g]) => ({ categorie: g.premiere.categorie, saisie: g.premiere.saisie.trim() })));
      for (const [i, [k, g]] of deLaLettre.entries()) {
        const valeurs = { ...decisions[i], rejugeeLe: maintenant };
        const [ligne] = await db
          .insert(reponsesJugees)
          .values({ categorie: g.premiere.categorie, lettre, cle: g.cle, ...valeurs })
          .onConflictDoUpdate({ target: [reponsesJugees.categorie, reponsesJugees.lettre, reponsesJugees.cle], set: valeurs })
          .returning();
        jugees.set(k, ligne);
      }
    } catch {
      // Le Juge ne répond pas : la Réponse arrive quand même dans la file, avec la décision d'avant. On réessaiera au prochain passage.
    }
  }

  return [...groupes.entries()].map(([k, g]) => {
    const jugee = jugees.get(k);
    return {
      categorie: g.premiere.categorie,
      lettre: g.premiere.lettre,
      cle: g.cle,
      saisie: g.premiere.saisie.trim(),
      valideParLeJuge: jugee?.valide ?? g.premiere.valideParLeJuge,
      formeReference: jugee?.formeReference ?? null,
      parties: g.parties.size,
      signalements: g.signalements,
      contestations: g.contestations,
      rejugee: Boolean(jugee?.rejugeeLe),
    };
  });
}

/**
 * Antoine valide ou refuse la Réponse. Sa décision remplace celle du Juge dans les Réponses jugées : toutes les Parties
 * suivantes la reprennent. Les points des Parties déjà jouées ne bougent pas. Les Signalements de la Réponse sont tranchés.
 */
export async function trancher(
  db: Db,
  { categorie, lettre, cle, saisie }: Pick<AArbitrer, "categorie" | "lettre" | "cle" | "saisie">,
  { valide, formeReference }: { valide: boolean; formeReference?: string },
  maintenant = new Date(),
) {
  const ou = and(eq(reponsesJugees.categorie, categorie), eq(reponsesJugees.lettre, lettre), eq(reponsesJugees.cle, cle));
  const [avant] = await db.select().from(reponsesJugees).where(ou);
  const forme = valide ? formeReference?.trim() || avant?.formeReference || propre(saisie) : null;
  const valeurs = { valide, formeReference: forme, trancheeLe: maintenant };
  await db
    .insert(reponsesJugees)
    .values({ categorie, lettre, cle, partEstimee: avant?.partEstimee ?? null, ...valeurs })
    .onConflictDoUpdate({ target: [reponsesJugees.categorie, reponsesJugees.lettre, reponsesJugees.cle], set: valeurs });

  const enAttente = await db
    .select({ id: signalementsReponses.id, saisie: reponses.saisie })
    .from(signalementsReponses)
    .innerJoin(reponses, eq(reponses.id, signalementsReponses.reponseId))
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .where(and(eq(signalementsReponses.etat, "en_attente"), eq(reponses.categorie, categorie), eq(manches.lettre, lettre)));
  const ids = enAttente.filter((s) => normaliser(s.saisie) === cle).map((s) => s.id);
  if (ids.length > 0) await db.update(signalementsReponses).set({ etat: "tranche" }).where(inArray(signalementsReponses.id, ids));
}

/** « caraïbes  » devient « Caraïbes » : la Forme de référence d'une Réponse que le Juge ne connaissait pas. */
function propre(saisie: string) {
  const s = saisie.trim().replace(/\s+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
