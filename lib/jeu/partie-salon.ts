import { and, desc, eq, inArray } from "drizzle-orm";
import { joueurs, manches, parties, salonJoueurs, salons } from "@/db/schema";
import type { Db } from "@/db/types";
import { nombreDeReactions, nombreDeVotes } from "./decouverte";
import type { Juge } from "./juge/types";
import { jugerManche } from "./jugement";
import { LETTRES_EXCLUES_PAR_DEFAUT, tirerLettre } from "./lettres";
import { TRANSIT_S } from "./manches";
import { categoriesPour, PREREGLAGES, type IdPrereglage } from "./prereglages";
import { codeDepuisSaisie } from "./salons";

type Options = { maintenant?: Date; aleatoire?: () => number };
type Resultat = { ok: true } | { ok: false; erreur: string };

async function leSalon(db: Db, saisie: string) {
  const [salon] = await db.select().from(salons).where(eq(salons.code, codeDepuisSaisie(saisie)));
  return salon;
}

async function membres(db: Db, salonId: string) {
  return db.select({ joueurId: salonJoueurs.joueurId }).from(salonJoueurs).where(eq(salonJoueurs.salonId, salonId));
}

async function partieEnCours(db: Db, salonId: string) {
  const [partie] = await db.select().from(parties).where(eq(parties.salonId, salonId)).orderBy(desc(parties.creeLe)).limit(1);
  return partie;
}

async function mancheCourante(db: Db, partieId: string) {
  const lignes = await db.select().from(manches).where(eq(manches.partieId, partieId)).orderBy(desc(manches.numero));
  const numero = lignes[0]?.numero ?? 0;
  return { numero, grilles: lignes.filter((m) => m.numero === numero), lettres: [...new Set(lignes.map((m) => m.lettre))] };
}

/** Une Manche du Salon : une Grille par Joueur, même Lettre, mêmes Catégories, même heure de fin. */
async function lancerManche(db: Db, partie: typeof parties.$inferSelect, numero: number, dejaTirees: string[], maintenant: Date, aleatoire?: () => number) {
  const lettre = tirerLettre(aleatoire, [...LETTRES_EXCLUES_PAR_DEFAUT, ...dejaTirees]);
  const finitLe = new Date(maintenant.getTime() + partie.dureeS * 1000);
  const presents = await membres(db, partie.salonId!);
  await db.insert(manches).values(
    presents.map((p) => ({ joueurId: p.joueurId, partieId: partie.id, numero, lettre, categories: partie.categories, commenceeLe: maintenant, finitLe })),
  );
}

export async function lancerPartieSalon(db: Db, code: string, joueurId: string, prereglage: IdPrereglage, { maintenant = new Date(), aleatoire }: Options = {}): Promise<Resultat> {
  const salon = await leSalon(db, code);
  if (!salon) return { ok: false, erreur: "Ce salon n'existe pas." };
  if (salon.hoteId !== joueurId) return { ok: false, erreur: "Seul l'hôte lance la partie." };
  if ((await membres(db, salon.id)).length < 2) return { ok: false, erreur: "Il faut au moins 2 joueurs pour lancer la partie." };
  const enCours = await partieEnCours(db, salon.id);
  if (enCours?.etat === "en_cours") return { ok: false, erreur: "Une partie est déjà en cours." };
  const { nbManches, dureeS } = PREREGLAGES[prereglage];
  const [partie] = await db
    .insert(parties)
    .values({ joueurId, salonId: salon.id, prereglage, nbManches, dureeS, categories: categoriesPour(prereglage, aleatoire) })
    .returning();
  await db.update(salons).set({ prereglage }).where(eq(salons.id, salon.id));
  await lancerManche(db, partie, 1, [], maintenant, aleatoire);
  return { ok: true };
}

/**
 * Après l'heure de fin (et les quelques secondes de transit), ferme toutes les Grilles de la Manche, même celles
 * des Joueurs partis, et les fait juger. Sans effet avant l'heure. Après la dernière Manche, la Partie est terminée.
 */
export async function cloturerManche(db: Db, juge: Juge, code: string, maintenant = new Date()) {
  const salon = await leSalon(db, code);
  const partie = salon && (await partieEnCours(db, salon.id));
  if (!partie || partie.etat !== "en_cours") return;
  const { numero, grilles } = await mancheCourante(db, partie.id);
  if (!grilles.length || maintenant.getTime() < grilles[0].finitLe.getTime() + TRANSIT_S * 1000) return;
  const ouvertes = grilles.filter((g) => g.etat === "en_cours").map((g) => g.id);
  if (ouvertes.length) {
    await db.update(manches).set({ etat: "a_juger", termineeLe: grilles[0].finitLe }).where(and(inArray(manches.id, ouvertes), eq(manches.etat, "en_cours")));
  }
  for (const g of grilles) await jugerManche(db, juge, g.id, g.joueurId);
  const rejugees = (await mancheCourante(db, partie.id)).grilles;
  if (numero >= partie.nbManches && rejugees.every((g) => g.etat === "jugee")) {
    await db.update(parties).set({ etat: "terminee", termineeLe: maintenant }).where(eq(parties.id, partie.id));
  }
}

export async function mancheSuivanteSalon(db: Db, code: string, joueurId: string, { maintenant = new Date(), aleatoire }: Options = {}): Promise<Resultat> {
  const salon = await leSalon(db, code);
  if (!salon) return { ok: false, erreur: "Ce salon n'existe pas." };
  if (salon.hoteId !== joueurId) return { ok: false, erreur: "Seul l'hôte lance la manche suivante." };
  const partie = await partieEnCours(db, salon.id);
  if (!partie || partie.etat !== "en_cours") return { ok: false, erreur: "La partie est finie." };
  const { numero, grilles, lettres } = await mancheCourante(db, partie.id);
  if (!grilles.every((g) => g.etat === "jugee")) return { ok: false, erreur: "La manche n'est pas encore finie." };
  if (numero >= partie.nbManches) return { ok: false, erreur: "La partie est finie." };
  await lancerManche(db, partie, numero + 1, lettres, maintenant, aleatoire);
  return { ok: true };
}

export type EtatPartieSalon = {
  partie: { id: string; nom: string; nbManches: number; etat: "en_cours" | "terminee" };
  manche: { numero: number; nbManches: number; close: boolean; finitLe: string; stopPar: string | null; reactions: number; votes: number };
  maMancheId: string | null;
  classement: { pseudo: string; total: number; moi: boolean }[];
  jeSuisHote: boolean;
};

/** La Partie en cours du Salon vue par un de ses Joueurs : sa Grille de la Manche courante et le classement du Salon. */
export async function etatPartieSalon(db: Db, code: string, joueurId: string, maintenant = new Date()): Promise<EtatPartieSalon | undefined> {
  const salon = await leSalon(db, code);
  if (!salon) return undefined;
  const partie = await partieEnCours(db, salon.id);
  if (!partie) return undefined;
  const { numero, grilles } = await mancheCourante(db, partie.id);
  const toutes = await db
    .select({ joueurId: manches.joueurId, total: manches.total, pseudo: joueurs.pseudo })
    .from(manches)
    .innerJoin(joueurs, eq(joueurs.id, manches.joueurId))
    .where(eq(manches.partieId, partie.id));
  const parJoueur = new Map<string, { pseudo: string; total: number; moi: boolean }>();
  for (const l of toutes) {
    const c = parJoueur.get(l.joueurId) ?? { pseudo: l.pseudo, total: 0, moi: l.joueurId === joueurId };
    c.total += l.total ?? 0;
    parJoueur.set(l.joueurId, c);
  }
  const ma = grilles.find((g) => g.joueurId === joueurId);
  const stopParId = grilles.find((g) => g.stopParId)?.stopParId;
  const [stoppeur] = stopParId ? await db.select({ pseudo: joueurs.pseudo }).from(joueurs).where(eq(joueurs.id, stopParId)) : [];
  return {
    partie: { id: partie.id, nom: PREREGLAGES[partie.prereglage as IdPrereglage].nom, nbManches: partie.nbManches, etat: partie.etat },
    manche: {
      numero,
      nbManches: partie.nbManches,
      close: grilles.length > 0 && grilles.every((g) => g.etat === "jugee"),
      finitLe: (grilles[0]?.finitLe ?? maintenant).toISOString(),
      stopPar: stoppeur?.pseudo ?? null,
      reactions: await nombreDeReactions(db, grilles.map((g) => g.id)),
      votes: await nombreDeVotes(db, grilles.map((g) => g.id)),
    },
    maMancheId: ma?.id ?? null,
    classement: [...parJoueur.values()].sort((a, b) => b.total - a.total || a.pseudo.localeCompare(b.pseudo)),
    jeSuisHote: salon.hoteId === joueurId,
  };
}
