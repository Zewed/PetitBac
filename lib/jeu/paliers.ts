export type NomPalier = "Banal" | "Courant" | "Rare" | "Très rare" | "Légendaire";

/** Du plus banal au plus rare : `min` est la plus petite part des joueurs qui garde la Réponse dans ce Palier. */
export const PALIERS: { nom: NomPalier; points: number; min: number }[] = [
  { nom: "Banal", points: 1, min: 0.3 },
  { nom: "Courant", points: 3, min: 0.1 },
  { nom: "Rare", points: 5, min: 0.03 },
  { nom: "Très rare", points: 8, min: 0.005 },
  { nom: "Légendaire", points: 12, min: 0 },
];

/** Plus de 30 % : Banal. De 10 à 30 % : Courant. De 3 à 10 % : Rare. De 0,5 à 3 % : Très rare. Moins, ou jamais donnée : Légendaire. */
export function palierPourPart(part: number | null): { nom: NomPalier; points: number } {
  const p = part ?? 0;
  const palier = p > 0.3 ? PALIERS[0] : PALIERS.slice(1).find((x) => p >= x.min) ?? PALIERS[4];
  return { nom: palier.nom, points: palier.points };
}
