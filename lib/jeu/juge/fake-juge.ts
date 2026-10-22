import { normaliser, sansArticle } from "../texte";
import { LISTES_FAKE } from "./liste-fake";
import type { Decision, Juge, ReponseAJuger } from "./types";

/**
 * Un faux Juge, en attendant le Juge IA (Claude Haiku via Vercel AI Gateway, sans clé pour l'instant).
 * Il ne connaît que les mots de LISTES_FAKE et refuse tout le reste ; il estime la part des joueurs
 * d'après le rang du mot dans sa liste, les premiers étant les plus donnés.
 * Comme le ferait le vrai Juge, il range les variantes sous une seule Forme de référence :
 * article, pluriel, petite faute de frappe, abréviation.
 */
export class FakeJuge implements Juge {
  async juger(lettre: string, reponses: ReponseAJuger[]): Promise<Decision[]> {
    return reponses.map(({ categorie, saisie }) => {
      const groupe = (LISTES_FAKE[categorie] ?? []).filter((mot) => normaliser(mot).startsWith(lettre.toLowerCase()));
      const rang = reconnaitre(groupe.map(normaliser), saisie);
      if (rang < 0) return { valide: false, formeReference: null, partEstimee: null };
      const poids = groupe.map((_, i) => 1 / (i + 1) ** 1.5);
      const somme = poids.reduce((a, b) => a + b, 0) * 1.15;
      return { valide: true, formeReference: groupe[rang], partEstimee: poids[rang] / somme };
    });
  }
}

/** Le rang du mot reconnu dans le groupe, ou -1. */
function reconnaitre(mots: string[], saisie: string): number {
  const brut = normaliser(saisie);
  const nu = sansArticle(brut);
  const formes = [...new Set([brut, nu, ...singuliers(nu)])];

  for (const f of formes) {
    const i = mots.indexOf(f);
    if (i >= 0) return i;
  }
  for (const f of formes) {
    if (f.length < 4) continue;
    const proches = mots.flatMap((m, i) => (distance(f, m) <= (f.length >= 8 ? 2 : 1) ? [i] : []));
    if (proches.length === 1) return proches[0];
  }
  for (const f of formes) {
    if (f.length < 4) continue;
    const prolonges = mots.flatMap((m, i) => (m.length > f.length && m.startsWith(f) ? [i] : []));
    if (prolonges.length === 1) return prolonges[0];
  }
  return -1;
}

function singuliers(f: string): string[] {
  const s: string[] = [];
  if (f.endsWith("aux")) s.push(f.slice(0, -3) + "al");
  if (/[sx]$/.test(f)) s.push(f.slice(0, -1));
  return s;
}

/** Distance de Damerau-Levenshtein : une lettre en trop, en moins, changée, ou deux lettres inversées comptent pour 1. */
function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cout);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
