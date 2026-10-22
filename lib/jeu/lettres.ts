export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const LETTRES_EXCLUES_PAR_DEFAUT = ["K", "Q", "W", "X", "Y", "Z"];

export function tirerLettre(aleatoire: () => number = Math.random, exclues = LETTRES_EXCLUES_PAR_DEFAUT): string {
  const possibles = ALPHABET.filter((l) => !exclues.includes(l));
  return possibles[Math.floor(aleatoire() * possibles.length)];
}
