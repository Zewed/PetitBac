import { and, asc, eq, sql } from "drizzle-orm";
import { regles } from "@/db/schema";
import type { Db } from "@/db/types";
import { REGLAGES_PAR_DEFAUT, type Reglages } from "./reglages";

export const LONGUEUR_MAX_NOM_REGLE = 30;

type Resultat = { ok: true } | { ok: false; erreur: string };

export type RegleVue = { id: string; nom: string; resume: string };

function duree(s: number | null) {
  if (s === null) return "sans limite";
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

/** « 3 manches · 2 min · 8 catégories · sans STOP » : ce qu'on lit sous le nom d'une règle. */
export function resumeReglages(r: Reglages, { salon = true }: { salon?: boolean } = {}) {
  const manches = r.manches.mode === "nombre" ? `${r.manches.n} manche${r.manches.n > 1 ? "s" : ""}` : `premier à ${r.manches.objectif} pts`;
  const nb = r.categories.mode === "main" ? r.categories.liste.length : r.categories.nombre;
  return [manches, duree(r.dureeS), `${nb} catégorie${nb > 1 ? "s" : ""}`, salon && !r.stop.actif ? "sans STOP" : null].filter(Boolean).join(" · ");
}

/** Enregistre les Réglages sous un nom ; un nom déjà pris par ce Joueur (sans tenir compte des majuscules) est remplacé. */
export async function enregistrerRegle(db: Db, joueurId: string, saisie: string, reglages: Reglages, { salon }: { salon: boolean }): Promise<Resultat> {
  const nom = saisie.trim().replace(/\s+/g, " ");
  if (!nom) return { ok: false, erreur: "Donne un nom à tes règles." };
  if (nom.length > LONGUEUR_MAX_NOM_REGLE) return { ok: false, erreur: `${LONGUEUR_MAX_NOM_REGLE} caractères au plus pour le nom.` };
  const [deja] = await db
    .select({ id: regles.id })
    .from(regles)
    .where(and(eq(regles.joueurId, joueurId), sql`lower(${regles.nom}) = ${nom.toLowerCase()}`));
  if (deja) await db.update(regles).set({ nom, reglages, salon }).where(eq(regles.id, deja.id));
  else await db.insert(regles).values({ joueurId, nom, reglages, salon });
  return { ok: true };
}

/** « Mes règles » : celles du Joueur, dans l'ordre où il les a enregistrées. */
export async function mesRegles(db: Db, joueurId: string): Promise<RegleVue[]> {
  const lignes = await db.select().from(regles).where(eq(regles.joueurId, joueurId)).orderBy(asc(regles.creeLe));
  return lignes.map((l) => ({ id: l.id, nom: l.nom, resume: resumeReglages(l.reglages, { salon: l.salon }) }));
}

/**
 * Les Réglages d'une de ses règles, prêts pour une Partie libre ou un Salon. Une règle enregistrée en Partie libre
 * n'a ni STOP ni Contestation : dans un Salon, elle prend ceux par défaut.
 */
export async function regleDuJoueur(db: Db, joueurId: string, id: string, { salon }: { salon: boolean }): Promise<Reglages | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const [ligne] = await db.select().from(regles).where(and(eq(regles.id, id), eq(regles.joueurId, joueurId)));
  if (!ligne) return undefined;
  if (salon && !ligne.salon) return { ...ligne.reglages, stop: REGLAGES_PAR_DEFAUT.stop, contestation: REGLAGES_PAR_DEFAUT.contestation };
  return ligne.reglages;
}
