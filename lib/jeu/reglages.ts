import { ALPHABET, LETTRES_EXCLUES_PAR_DEFAUT } from "./lettres";
import { CATALOGUE, CATEGORIES_DE_BASE, PACKS, tirerCategories } from "./packs";
import { PREREGLAGES, type IdPrereglageFixe } from "./prereglages";

/** Les Réglages avancés d'une Partie. Ils ne changent jamais le barème : un Palier rapporte toujours ses points. */
export type Reglages = {
  /** Un nombre de Manches, ou « le premier à X points gagne ». */
  manches: { mode: "nombre"; n: number } | { mode: "points"; objectif: number };
  /** Les Lettres qui peuvent tomber ; aucune ne revient deux fois dans une Partie. */
  lettres: string[];
  /** Qui donne la Lettre de chaque Manche. */
  choixLettre: "hasard" | "hote" | "dernier";
  /** null : sans limite. */
  dureeS: number | null;
  stop: { actif: boolean; /** « complete », ou le nombre de cases remplies qui suffit. */ des: "complete" | number; graceS: number };
  contestation: boolean;
  /**
   * Les Catégories : choisies à la main, tirées au hasard dans les Packs cochés une fois pour la Partie,
   * ou retirées au sort à chaque Manche.
   */
  categories: { mode: "main"; liste: string[] } | { mode: "packs" | "chaque_manche"; packs: string[]; nombre: number };
};

export const MANCHES_MIN = 1;
export const MANCHES_MAX = 20;
export const OBJECTIF_MIN = 10;
export const OBJECTIF_MAX = 500;
export const DUREE_MIN_S = 30;
export const DUREE_MAX_S = 600;
export const GRACE_MAX_S = 30;
export const GRACE_PAR_DEFAUT_S = 10;
export const CATEGORIES_MIN = 1;
export const CATEGORIES_MAX = 20;
/** Les durées proposées dans les Réglages, de 30 s à 10 min. */
export const DUREES_S = [30, 45, 60, 90, 120, 180, 240, 300, 420, 600];
/** Sans limite, une Manche reste ouverte une journée : c'est le STOP ou « J'ai fini » qui la termine. */
export const SANS_LIMITE_S = 24 * 3600;

export function reglagesDuPrereglage(id: IdPrereglageFixe): Reglages {
  const p = PREREGLAGES[id];
  return {
    manches: { mode: "nombre", n: p.nbManches },
    lettres: ALPHABET.filter((l) => !LETTRES_EXCLUES_PAR_DEFAUT.includes(l)),
    choixLettre: "hasard",
    dureeS: p.dureeS,
    stop: { actif: true, des: "complete", graceS: GRACE_PAR_DEFAUT_S },
    contestation: true,
    // Le Pack Classique sert par défaut ; un Préréglage tire les siennes avec categoriesPour (prereglages.ts).
    categories: { mode: "main", liste: [...CATEGORIES_DE_BASE] },
  };
}

export const REGLAGES_PAR_DEFAUT = reglagesDuPrereglage("classique");

type Validation = { ok: true; reglages: Reglages } | { ok: false; erreur: string };

const entier = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? NaN : Number(v));

/**
 * Les Réglages depuis le formulaire. En Partie libre, ni STOP ni Contestation, et la Lettre est tirée au hasard
 * ou choisie par le Joueur. Dans un Salon, une Manche sans limite a besoin du STOP pour finir.
 */
export function lireReglages(form: FormData, { salon }: { salon: boolean }): Validation {
  const manches =
    form.get("manches_mode") === "points"
      ? ({ mode: "points", objectif: entier(form.get("objectif")) } as const)
      : ({ mode: "nombre", n: entier(form.get("nb_manches")) } as const);
  if (manches.mode === "nombre" && !(Number.isInteger(manches.n) && manches.n >= MANCHES_MIN && manches.n <= MANCHES_MAX)) {
    return { ok: false, erreur: `Le nombre de manches va de ${MANCHES_MIN} à ${MANCHES_MAX}.` };
  }
  if (manches.mode === "points" && !(Number.isInteger(manches.objectif) && manches.objectif >= OBJECTIF_MIN && manches.objectif <= OBJECTIF_MAX)) {
    return { ok: false, erreur: `L'objectif va de ${OBJECTIF_MIN} à ${OBJECTIF_MAX} points.` };
  }
  const cochees = new Set(form.getAll("lettres").map(String));
  const lettres = ALPHABET.filter((l) => cochees.has(l));
  const besoin = manches.mode === "nombre" ? manches.n : 1;
  if (lettres.length < besoin) {
    return { ok: false, erreur: `Coche au moins ${besoin} lettre${besoin > 1 ? "s" : ""} : une lettre ne revient pas deux fois dans une partie.` };
  }
  const choix = String(form.get("choix_lettre") ?? "hasard");
  const choixLettre = choix === "hote" || (choix === "dernier" && salon) ? choix : "hasard";
  const duree = String(form.get("duree") ?? "");
  const dureeS = duree === "sans" ? null : entier(duree);
  if (dureeS !== null && !(Number.isInteger(dureeS) && dureeS >= DUREE_MIN_S && dureeS <= DUREE_MAX_S)) {
    return { ok: false, erreur: "Le chrono va de 30 s à 10 min, ou sans limite." };
  }
  const stopActif = salon && form.get("stop") === "on";
  const des = form.get("stop_des") === "cases" ? entier(form.get("stop_cases")) : "complete";
  if (stopActif && des !== "complete" && !(Number.isInteger(des) && des >= 1)) {
    return { ok: false, erreur: "Indique dès combien de cases remplies on peut dire STOP." };
  }
  const graceS = salon ? entier(form.get("grace")) : GRACE_PAR_DEFAUT_S;
  if (!(Number.isInteger(graceS) && graceS >= 0 && graceS <= GRACE_MAX_S)) {
    return { ok: false, erreur: `Le temps de grâce va de 0 à ${GRACE_MAX_S} s.` };
  }
  if (salon && dureeS === null && !stopActif) {
    return { ok: false, erreur: "Sans limite de temps, il faut le STOP pour finir une manche." };
  }
  const categories = lireCategories(form);
  if (typeof categories === "string") return { ok: false, erreur: categories };
  return {
    ok: true,
    reglages: { manches, lettres, choixLettre, dureeS, stop: { actif: stopActif, des, graceS }, contestation: salon && form.get("contestation") === "on", categories },
  };
}

/** Les Catégories depuis le formulaire, ou ce qui ne va pas. Sans champ, les six de toujours. */
function lireCategories(form: FormData): Reglages["categories"] | string {
  const mode = String(form.get("categories_mode") ?? "main");
  if (mode === "packs" || mode === "chaque_manche") {
    const coches = new Set(form.getAll("packs").map(String));
    const packs = PACKS.filter((p) => coches.has(p.id));
    if (!packs.length) return "Coche au moins un pack.";
    const nombre = entier(form.get("nb_categories"));
    const disponibles = packs.reduce((n, p) => n + p.categories.length, 0);
    if (!(Number.isInteger(nombre) && nombre >= CATEGORIES_MIN && nombre <= Math.min(CATEGORIES_MAX, disponibles))) {
      return `Choisis de ${CATEGORIES_MIN} à ${Math.min(CATEGORIES_MAX, disponibles)} catégories pour ces packs.`;
    }
    return { mode, packs: packs.map((p) => p.id), nombre };
  }
  if (!form.has("categories_mode")) return { mode: "main", liste: [...CATEGORIES_DE_BASE] };
  const cochees = new Set(form.getAll("categories").map(String));
  const liste = CATALOGUE.filter((c) => cochees.has(c));
  if (liste.length !== cochees.size || liste.length < CATEGORIES_MIN || liste.length > CATEGORIES_MAX) return "Choisis de 1 à 20 catégories.";
  return { mode: "main", liste };
}

/** Les Catégories de la première Manche d'une Partie Personnalisée. */
export function categoriesInitiales(reglages: Reglages, aleatoire: () => number = Math.random): string[] {
  const c = reglages.categories;
  return c.mode === "main" ? [...c.liste] : tirerCategories(c.packs, c.nombre, aleatoire);
}

/** Les Catégories d'une Manche : celles de la Partie, ou un nouveau tirage quand elles se retirent à chaque Manche. */
export function categoriesDeLaManche(reglages: Reglages, dePartie: string[], numero: number, aleatoire: () => number = Math.random): string[] {
  const c = reglages.categories;
  return c.mode === "chaque_manche" && numero > 1 ? tirerCategories(c.packs, c.nombre, aleatoire) : dePartie;
}

/** Les Réglages d'une Partie : les siens si elle est Personnalisée, sinon ceux de son Préréglage. */
export function reglagesDe(partie: { prereglage: string; reglages: Reglages | null; categories?: string[] }): Reglages {
  if (!partie.reglages) return reglagesDuPrereglage(partie.prereglage as IdPrereglageFixe);
  // Les Parties Personnalisées d'avant le choix des Catégories gardaient celles de la Partie.
  const stockes: Omit<Reglages, "categories"> & { categories?: Reglages["categories"] } = partie.reglages;
  return { ...stockes, categories: stockes.categories ?? { mode: "main", liste: partie.categories ?? [...CATEGORIES_DE_BASE] } };
}

/** Le plafond de Manches : le nombre réglé, ou, pour « le premier à X points », une par Lettre cochée. */
export function nbManchesPour(reglages: Reglages) {
  return reglages.manches.mode === "nombre" ? reglages.manches.n : reglages.lettres.length;
}

/** La durée gardée avec la Partie : sans limite, une journée. */
export function dureeStockeeS(reglages: Reglages) {
  return reglages.dureeS ?? SANS_LIMITE_S;
}

export const estSansLimite = (dureeS: number) => dureeS >= SANS_LIMITE_S;

/** Les Lettres qui peuvent encore tomber dans la Partie. */
export function lettresRestantes(reglages: Reglages, dejaTirees: string[]) {
  return reglages.lettres.filter((l) => !dejaTirees.includes(l));
}

/** La Lettre de la Manche : celle qu'on a choisie si elle est encore libre, sinon tirée au hasard parmi les restantes. */
export function lettrePour(reglages: Reglages, dejaTirees: string[], { lettre, aleatoire = Math.random }: { lettre?: string | null; aleatoire?: () => number } = {}) {
  const possibles = lettresRestantes(reglages, dejaTirees);
  if (lettre && possibles.includes(lettre)) return lettre;
  return possibles[Math.floor(aleatoire() * possibles.length)];
}

/** « Le premier à X points gagne » : un des totaux a atteint l'objectif. */
export function objectifAtteint(reglages: Reglages, totaux: number[]) {
  return reglages.manches.mode === "points" && totaux.some((t) => t >= (reglages.manches as { objectif: number }).objectif);
}

export const objectifDe = (reglages: Reglages) => (reglages.manches.mode === "points" ? reglages.manches.objectif : null);

/** Ce que dit la pastille de la Manche : « Manche 3/5 », ou « Manche 3 · objectif 100 » pour le premier à X points. */
export function etiquetteManche(numero: number, nbManches: number, reglages: Reglages) {
  return reglages.manches.mode === "points" ? `Manche ${numero} · objectif ${reglages.manches.objectif}` : `Manche ${numero}/${nbManches}`;
}
