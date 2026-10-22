import { normaliser } from "./texte";

// Mots entiers : ils ne sont refusés que seuls, pour laisser passer « Constance » ou « Pascal ».
const MOTS = new Set([
  "con", "cons", "conne", "connard", "connards", "connasse", "connasses", "pute", "putes", "putain", "salope",
  "salopes", "salaud", "encule", "enculer", "enculee", "merde", "merdeux", "bite", "bites", "couille", "couilles",
  "chier", "nique", "niquer", "batard", "batards", "pd", "pede", "pedes", "tapette", "fdp", "ntm", "tg", "ta gueule",
  "bouffon", "abruti", "debile", "cul", "nazi", "nazis", "hitler", "negre", "negro", "bougnoule", "youpin",
  "branleur", "branleuse", "foutre", "pouffiasse", "petasse", "trouduc", "zizi", "fion",
]);
// Racines assez longues pour être cherchées à l'intérieur d'un mot collé (« grosconnard »).
const RACINES = ["connard", "connasse", "salope", "encule", "putain", "batard", "pouffiasse", "petasse", "bougnoule", "enfoire", "hitler"];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

export function contientUneGrossierete(texte: string): boolean {
  const clair = normaliser(texte).replace(/[013457@$]/g, (c) => LEET[c] ?? c);
  const mots = clair.split(/[^a-z]+/).filter(Boolean);
  if (mots.some((m) => MOTS.has(m))) return true;
  const colle = mots.join("");
  return RACINES.some((r) => colle.includes(r));
}
