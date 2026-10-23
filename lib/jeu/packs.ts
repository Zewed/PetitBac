/** Les six Catégories de toujours, celles du Préréglage Classique. */
export const CATEGORIES_DE_BASE = ["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"];

/** Le Pack Classique, qui sert par défaut. */
export const PACK_CLASSIQUE = [...CATEGORIES_DE_BASE, "Ville", "Couleur", "Sport", "Vêtement", "Plat", "Instrument de musique"];

export type Pack = { id: string; nom: string; categories: string[] };

/**
 * Le Catalogue : au lancement, le seul Pack Classique et ses 12 Catégories, relues par Antoine. Les autres Catégories
 * s'ajoutent une par une, une fois relues (propositions.ts garde celles écrites par l'IA et pas encore relues) ;
 * leur gestion dans /admin arrive au ticket 23. Une Catégorie n'apparaît que dans un seul Pack : sa Cote se calcule sous son nom.
 */
export const PACKS: Pack[] = [{ id: "classique", nom: "Classique", categories: PACK_CLASSIQUE }];

/** Toutes les Catégories du Catalogue, dans l'ordre des Packs. */
export const CATALOGUE = PACKS.flatMap((p) => p.categories);

export function packDe(categorie: string): Pack | undefined {
  return PACKS.find((p) => p.categories.includes(categorie));
}

/** `nombre` Catégories tirées au hasard dans les Packs donnés, sans doublon. */
export function tirerCategories(packs: string[], nombre: number, aleatoire: () => number = Math.random): string[] {
  const possibles = PACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.categories);
  const melange = [...possibles];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [melange[i], melange[j]] = [melange[j], melange[i]];
  }
  return melange.slice(0, nombre);
}
