import { CATEGORIES_DE_BASE, PACK_CLASSIQUE } from "./packs";

export type IdPrereglage = "express" | "classique" | "marathon" | "personnalise";
export type IdPrereglageFixe = Exclude<IdPrereglage, "personnalise">;

export const PREREGLAGES: Record<IdPrereglage, { nom: string; nbCategories: number; dureeS: number; nbManches: number }> = {
  express: { nom: "Express", nbCategories: 4, dureeS: 45, nbManches: 3 },
  classique: { nom: "Classique", nbCategories: 6, dureeS: 90, nbManches: 5 },
  marathon: { nom: "Marathon", nbCategories: 12, dureeS: 180, nbManches: 10 },
  // Ses vraies valeurs sont dans les Réglages de la Partie (reglages.ts) ; celles-ci sont celles qu'on propose au départ.
  personnalise: { nom: "Personnalisé", nbCategories: 6, dureeS: 90, nbManches: 5 },
};

export const ORDRE_PREREGLAGES: IdPrereglageFixe[] = ["express", "classique", "marathon"];

export function estPrereglage(x: unknown): x is IdPrereglage {
  return typeof x === "string" && x in PREREGLAGES;
}

/**
 * Les Catégories d'une Partie, fixées pour toutes ses Manches.
 * Classique : les six de toujours. Express : quatre d'entre elles, tirées au sort. Marathon : tout le Pack Classique.
 */
export function categoriesPour(id: IdPrereglage, aleatoire: () => number = Math.random): string[] {
  if (id === "marathon") return [...PACK_CLASSIQUE];
  if (id === "classique" || id === "personnalise") return [...CATEGORIES_DE_BASE];
  const melange = [...CATEGORIES_DE_BASE].sort(() => aleatoire() - 0.5);
  const choisies = new Set(melange.slice(0, PREREGLAGES.express.nbCategories));
  return CATEGORIES_DE_BASE.filter((c) => choisies.has(c));
}
