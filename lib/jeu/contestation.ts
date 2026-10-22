import { and, eq, inArray, sql } from "drizzle-orm";
import { contestations, cotes, manches, reponses, salonJoueurs, votes } from "@/db/schema";
import type { Db } from "@/db/types";
import { mancheDuSalon } from "./decouverte";
import { palierPourPart } from "./paliers";
import { normaliser, sansArticle } from "./texte";
import { reglagesDe } from "./reglages";

type Resultat<T = object> = ({ ok: true } & T) | { ok: false; erreur: string };

/**
 * Un Joueur remet en cause la décision du Juge sur une Réponse de la Manche qu'on découvre. Le Salon vote, la majorité
 * tranche ; sans majorité, la décision du Juge reste. Le résultat ne vaut que pour cette Partie : la base commune
 * des Réponses jugées et la Cote ne bougent jamais.
 */
export async function contester(db: Db, code: string, reponseId: string, joueurId: string): Promise<Resultat<{ contestationId: string }>> {
  const m = await mancheDuSalon(db, code, joueurId);
  if (!m || !m.grilles.length || !m.grilles.every((g) => g.etat === "jugee")) return { ok: false, erreur: "On conteste pendant la découverte des points." };
  if (!reglagesDe(m.partie).contestation) return { ok: false, erreur: "La contestation est désactivée pour cette partie." };
  const [reponse] = await db.select().from(reponses).where(and(eq(reponses.id, reponseId), inArray(reponses.mancheId, m.grilles.map((g) => g.id))));
  if (!reponse) return { ok: false, erreur: "Cette réponse n'est pas dans la manche." };
  if (reponse.saisie.trim() === "") return { ok: false, erreur: "Une case vide ne se conteste pas." };
  const [creee] = await db
    .insert(contestations)
    .values({ reponseId, parJoueurId: joueurId, valideParLeJuge: reponse.valide === true })
    .onConflictDoNothing()
    .returning({ id: contestations.id });
  if (!creee) return { ok: false, erreur: "Cette réponse est déjà contestée." };
  await db.insert(votes).values({ contestationId: creee.id, joueurId, pour: true });
  await resoudre(db, creee.id, m.salon.id);
  return { ok: true, contestationId: creee.id };
}

export async function voter(db: Db, code: string, contestationId: string, joueurId: string, pour: boolean): Promise<Resultat> {
  const m = await mancheDuSalon(db, code, joueurId);
  if (!m) return { ok: false, erreur: "Tu n'es pas dans ce salon." };
  const [c] = await db
    .select({ c: contestations })
    .from(contestations)
    .innerJoin(reponses, eq(reponses.id, contestations.reponseId))
    .where(and(eq(contestations.id, contestationId), inArray(reponses.mancheId, m.grilles.map((g) => g.id))));
  if (!c) return { ok: false, erreur: "Cette contestation n'est pas dans la manche." };
  if (c.c.etat !== "en_cours") return { ok: false, erreur: "Le salon a déjà tranché." };
  await db
    .insert(votes)
    .values({ contestationId, joueurId, pour })
    .onConflictDoUpdate({ target: [votes.contestationId, votes.joueurId], set: { pour } });
  await resoudre(db, contestationId, m.salon.id);
  return { ok: true };
}

/** La majorité des Joueurs du Salon tranche ; quand elle ne peut plus être atteinte, la décision du Juge reste. */
async function resoudre(db: Db, contestationId: string, salonId: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(salonJoueurs).where(eq(salonJoueurs.salonId, salonId));
  const lesVotes = await db.select().from(votes).where(eq(votes.contestationId, contestationId));
  const pour = lesVotes.filter((v) => v.pour).length;
  const contre = lesVotes.length - pour;
  if (pour > n / 2) {
    const [c] = await db.update(contestations).set({ etat: "acceptee" }).where(and(eq(contestations.id, contestationId), eq(contestations.etat, "en_cours"))).returning();
    if (c) await renverser(db, c.reponseId, !c.valideParLeJuge);
  } else if (contre >= n / 2) {
    await db.update(contestations).set({ etat: "rejetee" }).where(and(eq(contestations.id, contestationId), eq(contestations.etat, "en_cours")));
  }
}

/** Le Salon renverse la décision du Juge, pour cette Partie seulement : la Réponse et le total de sa Manche changent. */
async function renverser(db: Db, reponseId: string, valide: boolean) {
  const [r] = await db
    .select({ r: reponses, lettre: manches.lettre })
    .from(reponses)
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .where(eq(reponses.id, reponseId));
  let palier: string | null = null;
  let points = 0;
  let formeReference = r.r.formeReference;
  if (valide) {
    formeReference ??= sansArticle(normaliser(r.r.saisie));
    const [cote] = await db
      .select()
      .from(cotes)
      .where(and(eq(cotes.categorie, r.r.categorie), eq(cotes.lettre, r.lettre), eq(cotes.formeReference, formeReference)));
    // Jamais validée ailleurs : pas de Cote, donc Légendaire.
    ({ nom: palier, points } = palierPourPart(cote?.part ?? null));
  }
  await db.update(reponses).set({ valide, formeReference, palier, points }).where(eq(reponses.id, reponseId));
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${reponses.points}), 0)::int` })
    .from(reponses)
    .where(eq(reponses.mancheId, r.r.mancheId));
  await db.update(manches).set({ total }).where(eq(manches.id, r.r.mancheId));
}
