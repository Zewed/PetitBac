import { and, eq, lt, sql } from "drizzle-orm";
import { compteurs } from "@/db/schema";
import type { Db } from "@/db/types";

/**
 * Les limites anti-abus, par minute, pour protéger le budget du Juge : par appareil (le Joueur de son cookie),
 * et plus large par adresse IP, qui peut être partagée par toute une école ou une famille.
 * Un Joueur qui enchaîne des Manches de Marathon envoie au plus une cinquantaine de Réponses par minute.
 */
export const LIMITES = {
  reponses: { parAppareil: 100, parIp: 400 },
  salons: { parAppareil: 5, parIp: 20 },
} as const;

export type Limite = keyof typeof LIMITES;

const fenetre = (maintenant: Date) => new Date(Math.floor(maintenant.getTime() / 60_000) * 60_000);

async function ajouter(db: Db, cle: string, quantite: number, maintenant: Date) {
  const debut = fenetre(maintenant);
  const [ligne] = await db
    .insert(compteurs)
    .values({ cle, fenetre: debut, n: quantite })
    .onConflictDoUpdate({ target: [compteurs.cle, compteurs.fenetre], set: { n: sql`${compteurs.n} + ${quantite}` } })
    .returning({ n: compteurs.n });
  // Les minutes passées ne servent plus à rien.
  await db.delete(compteurs).where(and(eq(compteurs.cle, cle), lt(compteurs.fenetre, debut)));
  return ligne.n;
}

/**
 * Compte `quantite` envois de l'appareil (et de son adresse IP) dans la minute en cours. Faux quand la limite est
 * dépassée : l'envoi doit attendre la minute suivante.
 */
export async function consommer(db: Db, limite: Limite, { joueurId, ip }: { joueurId: string; ip?: string | null }, quantite = 1, maintenant = new Date()) {
  const { parAppareil, parIp } = LIMITES[limite];
  const appareil = await ajouter(db, `${limite}:joueur:${joueurId}`, quantite, maintenant);
  const reseau = ip ? await ajouter(db, `${limite}:ip:${ip}`, quantite, maintenant) : 0;
  return appareil <= parAppareil && reseau <= parIp;
}

/** L'appareil (ou son adresse IP) a dépassé la limite dans la minute en cours : on lui dit d'attendre. */
export async function freine(db: Db, limite: Limite, { joueurId, ip }: { joueurId: string; ip?: string | null }, maintenant = new Date()) {
  const lire = async (cle: string) => {
    const [ligne] = await db.select({ n: compteurs.n }).from(compteurs).where(and(eq(compteurs.cle, cle), eq(compteurs.fenetre, fenetre(maintenant))));
    return ligne?.n ?? 0;
  };
  const { parAppareil, parIp } = LIMITES[limite];
  return (await lire(`${limite}:joueur:${joueurId}`)) > parAppareil || (ip ? (await lire(`${limite}:ip:${ip}`)) > parIp : false);
}

export const MESSAGES_D_ATTENTE: Record<Limite, string> = {
  reponses: "Trop de réponses envoyées en une minute : attends un peu, puis relance la correction.",
  salons: "Trop de salons créés en une minute : attends un peu avant d'en créer un autre.",
};
