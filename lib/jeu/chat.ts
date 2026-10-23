import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { joueurs, manches, messages, parties, salonExclus, salonJoueurs, salons, signalementsMessages, type MessageDuContexte } from "@/db/schema";
import type { Db } from "@/db/types";
import { masquerGrossieretes } from "./grossieretes";
import { consommer, MESSAGES_D_ATTENTE } from "./limites";
import { codeDepuisSaisie } from "./salons";

export const LONGUEUR_MAX_MESSAGE = 280;
/** Les derniers messages montrés dans le chat. */
const MESSAGES_MONTRES = 60;
/** Les messages recopiés de part et d'autre d'un message signalé, pour le contexte. */
const CONTEXTE = 5;
/** Au-delà, le message d'un Salon où aucune Partie ne finit est effacé la nuit. */
const DUREE_DE_VIE_MESSAGE_MS = 24 * 3600 * 1000;

type Resultat = { ok: true } | { ok: false; erreur: string };

export type MessageVu = { id: string; pseudo: string; poste: string; texte: string; envoyeLe: string; moi: boolean; hote: boolean; muet: boolean; signale: boolean };
export type ChatVu = { ouvert: boolean; muet: boolean; jeSuisHote: boolean; messages: MessageVu[] };

async function leSalon(db: Db, code: string) {
  const [salon] = await db.select().from(salons).where(eq(salons.code, codeDepuisSaisie(code)));
  return salon;
}

async function membre(db: Db, salonId: string, joueurId: string) {
  const [ligne] = await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salonId), eq(salonJoueurs.joueurId, joueurId)));
  return ligne;
}

/** Le chat se ferme pendant la Manche, pour qu'on ne se souffle rien ; il rouvre quand toutes les Grilles sont jugées. */
async function chatOuvert(db: Db, salonId: string) {
  const [partie] = await db.select().from(parties).where(eq(parties.salonId, salonId)).orderBy(desc(parties.creeLe)).limit(1);
  if (!partie || partie.etat === "terminee") return true;
  const grilles = await db.select({ numero: manches.numero, etat: manches.etat }).from(manches).where(eq(manches.partieId, partie.id));
  const numero = Math.max(0, ...grilles.map((g) => g.numero));
  return grilles.filter((g) => g.numero === numero).every((g) => g.etat === "jugee");
}

async function lesMessages(db: Db, salonId: string) {
  const lignes = await db
    .select({ id: messages.id, joueurId: messages.joueurId, texte: messages.texte, envoyeLe: messages.envoyeLe, pseudo: joueurs.pseudo })
    .from(messages)
    .innerJoin(joueurs, eq(joueurs.id, messages.joueurId))
    .where(eq(messages.salonId, salonId))
    .orderBy(desc(messages.envoyeLe), desc(messages.id))
    .limit(MESSAGES_MONTRES);
  return lignes.reverse();
}

/** Le chat du Salon tel que le voit un de ses Joueurs ; rien pour qui n'y est pas. */
export async function lireChat(db: Db, code: string, joueurId: string): Promise<ChatVu | undefined> {
  const salon = await leSalon(db, code);
  const moi = salon && (await membre(db, salon.id, joueurId));
  if (!salon || !moi) return undefined;
  const liste = await lesMessages(db, salon.id);
  const postes = new Map(
    (await db.select({ joueurId: salonJoueurs.joueurId, poste: salonJoueurs.poste, muet: salonJoueurs.muet }).from(salonJoueurs).where(eq(salonJoueurs.salonId, salon.id))).map(
      (p) => [p.joueurId, p],
    ),
  );
  const signales = liste.length
    ? new Set(
        (
          await db
            .select({ messageId: signalementsMessages.messageId })
            .from(signalementsMessages)
            .where(and(eq(signalementsMessages.parJoueurId, joueurId), inArray(signalementsMessages.messageId, liste.map((m) => m.id))))
        ).map((s) => s.messageId),
      )
    : new Set<string>();
  return {
    ouvert: await chatOuvert(db, salon.id),
    muet: moi.muet,
    jeSuisHote: salon.hoteId === joueurId,
    messages: liste.map((m) => ({
      id: m.id,
      pseudo: m.pseudo,
      // Un Joueur parti ou exclu n'a plus de poste : ses messages restent, sans qu'on puisse le modérer.
      poste: postes.get(m.joueurId)?.poste ?? "",
      texte: m.texte,
      envoyeLe: m.envoyeLe.toISOString(),
      moi: m.joueurId === joueurId,
      hote: m.joueurId === salon.hoteId,
      muet: postes.get(m.joueurId)?.muet ?? false,
      signale: signales.has(m.id),
    })),
  };
}

/** Écrit dans le chat ; un appareil (ou son adresse IP) qui écrit en rafale attend la minute suivante. */
export async function ecrire(db: Db, code: string, joueurId: string, saisie: string, maintenant = new Date(), ip: string | null = null): Promise<Resultat> {
  const salon = await leSalon(db, code);
  const moi = salon && (await membre(db, salon.id, joueurId));
  if (!salon || !moi) return { ok: false, erreur: "Tu n'es pas dans ce salon." };
  if (moi.muet) return { ok: false, erreur: "L'hôte t'a coupé la parole." };
  if (!(await chatOuvert(db, salon.id))) return { ok: false, erreur: "Le chat est fermé pendant la manche." };
  const texte = saisie.trim().replace(/\s+/g, " ");
  if (!texte) return { ok: false, erreur: "Écris quelque chose avant d'envoyer." };
  if (texte.length > LONGUEUR_MAX_MESSAGE) return { ok: false, erreur: `${LONGUEUR_MAX_MESSAGE} caractères au plus.` };
  if (!(await consommer(db, "messages", { joueurId, ip }, 1, maintenant))) return { ok: false, erreur: MESSAGES_D_ATTENTE.messages };
  await db.insert(messages).values({ salonId: salon.id, joueurId, texte: masquerGrossieretes(texte), envoyeLe: maintenant });
  return { ok: true };
}

/** La ligne du Joueur que l'Hôte désigne par son poste ; jamais l'Hôte lui-même. */
async function cibleDeLHote(db: Db, code: string, hoteId: string, poste: string) {
  const salon = await leSalon(db, code);
  if (!salon || salon.hoteId !== hoteId) return { erreur: "Seul l'hôte peut faire ça." } as const;
  const [cible] = poste ? await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.poste, poste))) : [];
  if (!cible || cible.joueurId === hoteId) return { erreur: "Ce joueur n'est plus dans le salon." } as const;
  return { salon, cible } as const;
}

export async function couperLaParole(db: Db, code: string, hoteId: string, poste: string, muet: boolean): Promise<Resultat> {
  const r = await cibleDeLHote(db, code, hoteId, poste);
  if ("erreur" in r) return { ok: false, erreur: r.erreur! };
  await db.update(salonJoueurs).set({ muet }).where(and(eq(salonJoueurs.salonId, r.salon.id), eq(salonJoueurs.joueurId, r.cible.joueurId)));
  return { ok: true };
}

export async function exclure(db: Db, code: string, hoteId: string, poste: string): Promise<Resultat> {
  const r = await cibleDeLHote(db, code, hoteId, poste);
  if ("erreur" in r) return { ok: false, erreur: r.erreur! };
  await db.insert(salonExclus).values({ salonId: r.salon.id, joueurId: r.cible.joueurId }).onConflictDoNothing();
  await db.delete(salonJoueurs).where(and(eq(salonJoueurs.salonId, r.salon.id), eq(salonJoueurs.joueurId, r.cible.joueurId)));
  return { ok: true };
}

export async function estExclu(db: Db, code: string, joueurId: string) {
  const salon = await leSalon(db, code);
  if (!salon) return false;
  const [ligne] = await db.select().from(salonExclus).where(and(eq(salonExclus.salonId, salon.id), eq(salonExclus.joueurId, joueurId)));
  return Boolean(ligne);
}

/** Le message part dans /admin, recopié avec les messages autour, et survit à l'effacement du chat. */
export async function signaler(db: Db, code: string, messageId: string, joueurId: string): Promise<{ ok: true; message: string } | { ok: false; erreur: string }> {
  const salon = await leSalon(db, code);
  if (!salon || !(await membre(db, salon.id, joueurId))) return { ok: false, erreur: "Tu n'es pas dans ce salon." };
  const liste = await lesMessages(db, salon.id);
  const i = liste.findIndex((m) => m.id === messageId);
  if (i < 0) return { ok: false, erreur: "Ce message n'existe plus." };
  const cible = liste[i];
  if (cible.joueurId === joueurId) return { ok: false, erreur: "Tu ne peux pas signaler ton propre message." };
  const contexte: MessageDuContexte[] = liste
    .slice(Math.max(0, i - CONTEXTE), i + CONTEXTE + 1)
    .map((m) => ({ pseudo: m.pseudo, texte: m.texte, envoyeLe: m.envoyeLe.toISOString(), signale: m.id === messageId }));
  await db
    .insert(signalementsMessages)
    .values({ messageId, salonCode: salon.code, auteurId: cible.joueurId, texte: cible.texte, parJoueurId: joueurId, contexte })
    .onConflictDoNothing();
  return { ok: true, message: "Signalement envoyé, merci." };
}

/** Rien du chat n'est gardé après la Partie : seuls les Signalements restent. */
export async function viderChat(db: Db, salonId: string) {
  await db.delete(messages).where(eq(messages.salonId, salonId));
}

/**
 * Le ménage de la nuit : un Salon où aucune Partie ne finit ne vide jamais son chat, alors on efface tout message de
 * plus de 24 h. Les Signalements sont des copies : ils restent pour /admin. Renvoie le nombre de messages effacés.
 */
export async function effacerVieuxMessages(db: Db, maintenant = new Date()) {
  const avant = new Date(maintenant.getTime() - DUREE_DE_VIE_MESSAGE_MS);
  const effaces = await db.delete(messages).where(lt(messages.envoyeLe, avant)).returning({ id: messages.id });
  return effaces.length;
}

/** Les messages signalés, du plus ancien au plus récent, pour /admin (ticket 24). */
export async function signalementsDeMessages(db: Db) {
  return db
    .select({ id: signalementsMessages.id, salonCode: signalementsMessages.salonCode, texte: signalementsMessages.texte, contexte: signalementsMessages.contexte, creeLe: signalementsMessages.creeLe })
    .from(signalementsMessages)
    .orderBy(asc(signalementsMessages.creeLe));
}
