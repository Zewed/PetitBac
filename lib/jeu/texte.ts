/** Minuscules, sans accents, espaces resserrés : la clé sous laquelle on compare deux saisies. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const ARTICLE = /^(?:(?:les|le|la|un|une|des|du|de la)\s+|(?:l|de l)['’]\s*)/;

/** La saisie normalisée sans son article : « les Chacals » commence par un C. */
export function sansArticle(cle: string): string {
  return cle.replace(ARTICLE, "");
}
