import { and, desc, eq, inArray } from "drizzle-orm";
import { contestations, joueurs, manches, parties, reactions, reponses, salonJoueurs, salons, votes } from "@/db/schema";
import type { Db } from "@/db/types";
import { codeDepuisSaisie } from "./salons";
import { reglagesDe } from "./reglages";

/** La palette des réactions : de quoi chambrer, sans pouvoir écrire n'importe quoi. */
export const EMOJIS = ["😂", "🔥", "👏", "🤯", "🤔"] as const;

export type ReponseDecouverte = {
  id: string;
  pseudo: string;
  moi: boolean;
  reponse: string;
  valide: boolean | null;
  palier: string | null;
  points: number;
  reactions: { emoji: string; nombre: number; moi: boolean }[];
  contestation: { id: string; etat: "en_cours" | "acceptee" | "rejetee"; par: string; pour: number; contre: number; monVote: boolean | null } | null;
};

export async function mancheDuSalon(db: Db, code: string, joueurId: string) {
  const [salon] = await db.select().from(salons).where(eq(salons.code, codeDepuisSaisie(code)));
  if (!salon) return undefined;
  const [membre] = await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, joueurId)));
  if (!membre) return undefined;
  const [partie] = await db.select().from(parties).where(eq(parties.salonId, salon.id)).orderBy(desc(parties.creeLe)).limit(1);
  if (!partie) return undefined;
  const grilles = await db.select().from(manches).where(eq(manches.partieId, partie.id)).orderBy(desc(manches.numero));
  const numero = grilles[0]?.numero;
  return { salon, partie, grilles: grilles.filter((g) => g.numero === numero) };
}

/**
 * La découverte des points : une fois la Manche close pour tout le monde, les Réponses de chacun,
 * Catégorie par Catégorie, avec leur Palier, leurs points et les réactions qu'elles ont reçues.
 */
export async function decouverte(db: Db, code: string, joueurId: string) {
  const m = await mancheDuSalon(db, code, joueurId);
  if (!m || m.grilles.length === 0 || !m.grilles.every((g) => g.etat === "jugee")) return null;
  const lignes = await db
    .select({ reponse: reponses, pseudo: joueurs.pseudo, joueurId: manches.joueurId })
    .from(reponses)
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .innerJoin(joueurs, eq(joueurs.id, manches.joueurId))
    .where(inArray(reponses.mancheId, m.grilles.map((g) => g.id)));
  const ids = lignes.map((l) => l.reponse.id);
  const toutes = ids.length ? await db.select().from(reactions).where(inArray(reactions.reponseId, ids)) : [];
  const contestees = ids.length
    ? await db
        .select({ c: contestations, par: joueurs.pseudo })
        .from(contestations)
        .innerJoin(joueurs, eq(joueurs.id, contestations.parJoueurId))
        .where(inArray(contestations.reponseId, ids))
    : [];
  const lesVotes = contestees.length
    ? await db.select().from(votes).where(inArray(votes.contestationId, contestees.map((x) => x.c.id)))
    : [];
  return {
    /** La Contestation est-elle activée dans les Réglages de la Partie ? */
    contestation: reglagesDe(m.partie).contestation,
    categories: m.partie.categories.map((categorie) => ({
      categorie,
      reponses: lignes
        .filter((l) => l.reponse.categorie === categorie)
        .map((l): ReponseDecouverte => {
          const siennes = toutes.filter((r) => r.reponseId === l.reponse.id);
          return {
            id: l.reponse.id,
            pseudo: l.pseudo,
            moi: l.joueurId === joueurId,
            reponse: l.reponse.formeReference ?? l.reponse.saisie,
            valide: l.reponse.saisie.trim() === "" ? null : l.reponse.valide,
            palier: l.reponse.palier,
            points: l.reponse.points ?? 0,
            contestation: (() => {
              const x = contestees.find((y) => y.c.reponseId === l.reponse.id);
              if (!x) return null;
              const siens = lesVotes.filter((v) => v.contestationId === x.c.id);
              return {
                id: x.c.id,
                etat: x.c.etat,
                par: x.par,
                pour: siens.filter((v) => v.pour).length,
                contre: siens.filter((v) => !v.pour).length,
                monVote: siens.find((v) => v.joueurId === joueurId)?.pour ?? null,
              };
            })(),
            reactions: EMOJIS.flatMap((emoji) => {
              const de = siennes.filter((r) => r.emoji === emoji);
              return de.length ? [{ emoji, nombre: de.length, moi: de.some((r) => r.joueurId === joueurId) }] : [];
            }),
          };
        })
        .sort((a, b) => b.points - a.points || a.pseudo.localeCompare(b.pseudo)),
    })),
  };
}

type Resultat = { ok: true } | { ok: false; erreur: string };

/** Pose une réaction sur la Réponse d'un autre Joueur du Salon ; la reposer l'enlève. */
export async function reagir(db: Db, code: string, reponseId: string, joueurId: string, emoji: string): Promise<Resultat> {
  if (!(EMOJIS as readonly string[]).includes(emoji)) return { ok: false, erreur: "Cette réaction n'existe pas." };
  const m = await mancheDuSalon(db, code, joueurId);
  if (!m || !m.grilles.every((g) => g.etat === "jugee")) return { ok: false, erreur: "La découverte des points n'a pas commencé." };
  const [cible] = await db
    .select({ id: reponses.id, auteur: manches.joueurId })
    .from(reponses)
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .where(and(eq(reponses.id, reponseId), inArray(reponses.mancheId, m.grilles.map((g) => g.id))));
  if (!cible) return { ok: false, erreur: "Cette réponse n'est pas dans la manche." };
  if (cible.auteur === joueurId) return { ok: false, erreur: "On ne réagit pas à sa propre réponse." };
  const cle = and(eq(reactions.reponseId, reponseId), eq(reactions.joueurId, joueurId), eq(reactions.emoji, emoji));
  const [deja] = await db.select().from(reactions).where(cle);
  if (deja) await db.delete(reactions).where(cle);
  else await db.insert(reactions).values({ reponseId, joueurId, emoji }).onConflictDoNothing();
  return { ok: true };
}

/** Le nombre de réactions de la Manche : quand il change, les autres rafraîchissent leur découverte. */
export async function nombreDeReactions(db: Db, mancheIds: string[]) {
  if (!mancheIds.length) return 0;
  const lignes = await db
    .select({ id: reactions.reponseId })
    .from(reactions)
    .innerJoin(reponses, eq(reponses.id, reactions.reponseId))
    .where(inArray(reponses.mancheId, mancheIds));
  return lignes.length;
}

/** Le nombre de votes de Contestation de la Manche : quand il change, les autres rafraîchissent leur découverte. */
export async function nombreDeVotes(db: Db, mancheIds: string[]) {
  if (!mancheIds.length) return 0;
  const lignes = await db
    .select({ id: votes.joueurId })
    .from(votes)
    .innerJoin(contestations, eq(contestations.id, votes.contestationId))
    .innerJoin(reponses, eq(reponses.id, contestations.reponseId))
    .where(inArray(reponses.mancheId, mancheIds));
  return lignes.length;
}
