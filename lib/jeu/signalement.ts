import { asc, eq } from "drizzle-orm";
import { joueurs, manches, parties, reponses, signalementsReponses } from "@/db/schema";
import type { Db } from "@/db/types";

type Resultat = { ok: true; message: string } | { ok: false; erreur: string };

/**
 * En solo ou au Défi du jour, le Joueur signale la décision du Juge sur une de ses Réponses. Le Signalement part
 * pour être tranché dans /admin (ticket 22) : il ne change pas les points tout de suite. Entre amis, c'est la Contestation.
 */
export async function signalerDecision(db: Db, reponseId: string | null, joueurId: string): Promise<Resultat> {
  if (!reponseId || !/^[0-9a-f-]{36}$/i.test(reponseId)) return { ok: false, erreur: "Cette réponse n'existe pas." };
  const [ligne] = await db
    .select({ reponse: reponses, manche: manches, salonId: parties.salonId })
    .from(reponses)
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .leftJoin(parties, eq(parties.id, manches.partieId))
    .where(eq(reponses.id, reponseId));
  if (!ligne || ligne.manche.joueurId !== joueurId) return { ok: false, erreur: "Cette réponse n'est pas à toi." };
  if (ligne.salonId) return { ok: false, erreur: "Entre amis, on conteste la décision pendant la découverte des points." };
  if (ligne.manche.etat !== "jugee") return { ok: false, erreur: "Attends que le Juge ait corrigé ta grille." };
  if (ligne.reponse.saisie.trim() === "") return { ok: false, erreur: "Une case vide ne se signale pas." };
  const [cree] = await db
    .insert(signalementsReponses)
    .values({ reponseId, joueurId, valideParLeJuge: ligne.reponse.valide === true })
    .onConflictDoNothing()
    .returning({ id: signalementsReponses.id });
  if (!cree) return { ok: false, erreur: "Tu as déjà signalé cette réponse." };
  return { ok: true, message: "Signalement envoyé : la décision du Juge sera relue." };
}

/** Les Signalements de décisions, du plus ancien au plus récent, pour /admin (ticket 22). */
export async function signalementsDeReponses(db: Db) {
  return db
    .select({
      id: signalementsReponses.id,
      categorie: reponses.categorie,
      saisie: reponses.saisie,
      lettre: manches.lettre,
      valideParLeJuge: signalementsReponses.valideParLeJuge,
      pseudo: joueurs.pseudo,
      creeLe: signalementsReponses.creeLe,
    })
    .from(signalementsReponses)
    .innerJoin(reponses, eq(reponses.id, signalementsReponses.reponseId))
    .innerJoin(manches, eq(manches.id, reponses.mancheId))
    .innerJoin(joueurs, eq(joueurs.id, signalementsReponses.joueurId))
    .orderBy(asc(signalementsReponses.creeLe));
}
