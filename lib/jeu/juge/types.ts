export type ReponseAJuger = { categorie: string; saisie: string };

/** Ce que le Juge décide d'une Réponse, une fois pour toutes. */
export type Decision = {
  valide: boolean;
  formeReference: string | null;
  /** Au démarrage, quand personne n'a encore joué ce couple Catégorie + Lettre : la part des joueurs qui donneraient cette Réponse. */
  partEstimee: number | null;
};

export interface Juge {
  /** Un seul appel par Manche, pour toutes les Réponses encore inconnues. */
  juger(lettre: string, reponses: ReponseAJuger[]): Promise<Decision[]>;
}

export class JugeIndisponible extends Error {
  constructor(cause?: unknown) {
    super("Le Juge ne répond pas.", { cause });
  }
}
