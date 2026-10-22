import { normaliser } from "../texte";
import { LISTES_FAKE } from "./liste-fake";
import type { Decision, Juge, ReponseAJuger } from "./types";

/**
 * Un faux Juge, en attendant le Juge IA (Claude Haiku via Vercel AI Gateway, sans clé pour l'instant).
 * Il ne connaît que les mots de LISTES_FAKE et refuse tout le reste ; il estime la part des joueurs
 * d'après le rang du mot dans sa liste, les premiers étant les plus donnés.
 */
export class FakeJuge implements Juge {
  async juger(lettre: string, reponses: ReponseAJuger[]): Promise<Decision[]> {
    return reponses.map(({ categorie, saisie }) => {
      const groupe = (LISTES_FAKE[categorie] ?? []).filter((mot) => normaliser(mot).startsWith(lettre.toLowerCase()));
      const rang = groupe.findIndex((mot) => normaliser(mot) === normaliser(saisie));
      if (rang < 0) return { valide: false, formeReference: null, partEstimee: null };
      const poids = groupe.map((_, i) => 1 / (i + 1) ** 1.5);
      const somme = poids.reduce((a, b) => a + b, 0) * 1.15;
      return { valide: true, formeReference: groupe[rang], partEstimee: poids[rang] / somme };
    });
  }
}
