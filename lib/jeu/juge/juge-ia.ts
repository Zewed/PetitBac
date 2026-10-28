import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { JugeIndisponible, type Decision, type Juge, type ReponseAJuger } from "./types";

/** Claude Haiku 5.5, via Vercel AI Gateway (authentifié par le jeton OIDC de Vercel, ou AI_GATEWAY_API_KEY en local). */
export const MODELE_DU_JUGE = "anthropic/claude-haiku-5.5";

const schema = z.object({
  decisions: z.array(
    z.object({
      numero: z.number().int(),
      valide: z.boolean(),
      formeReference: z.string().nullable(),
      surCent: z.number(),
    }),
  ),
});

const CONSIGNES = `Tu es le Juge d'un petit bac en français. Pour une Lettre donnée, chaque joueur écrit une Réponse par Catégorie.

Pour chaque Réponse numérotée, décide :
- valide : true seulement si la Réponse est un vrai mot ou un vrai nom, qui appartient vraiment à la Catégorie, et qui commence par la Lettre une fois l'article retiré (le, la, les, l', un, une, des). Un mot inventé, une Réponse hors Catégorie ou une Réponse qui ne commence pas par la Lettre est refusée. Sois juste mais pas pédant : une faute de frappe légère, un accent oublié, un pluriel, un article ou une abréviation courante ne font pas refuser.
- formeReference : la forme sous laquelle on range toutes les variantes de la même Réponse (orthographe correcte, accents, singulier sauf nom toujours au pluriel, sans article, majuscule au début). « les chats », « Chat » et « chta » donnent « Chat ». null si la Réponse est refusée.
- surCent : sur 100 joueurs francophones qui doivent trouver une Réponse dans cette Catégorie avec cette Lettre, combien écriraient celle-ci ? Une Réponse évidente approche 30 à 50, une Réponse rare 1 ou 2, une Réponse que presque personne ne trouverait 0. 0 si la Réponse est refusée.

Rends une décision par Réponse, avec son numéro.`;

/**
 * Le vrai Juge : un seul appel à l'IA par Manche, pour toutes les Réponses encore inconnues.
 * Si l'IA ne répond pas, ou répond à côté, il lève JugeIndisponible : la Manche passe en « jugement_echoue » et se relance.
 */
export class JugeIA implements Juge {
  constructor(private readonly modele: LanguageModel = MODELE_DU_JUGE) {}

  async juger(lettre: string, reponses: ReponseAJuger[]): Promise<Decision[]> {
    const liste = reponses.map((r, i) => `${i + 1}. ${r.categorie} : ${r.saisie}`).join("\n");
    let decisions: z.infer<typeof schema>["decisions"];
    try {
      const { output } = await generateText({
        model: this.modele,
        system: CONSIGNES,
        prompt: `Lettre : ${lettre}\n\nRéponses :\n${liste}`,
        output: Output.object({ schema }),
        temperature: 0,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(25_000),
      });
      decisions = output.decisions;
    } catch (erreur) {
      throw new JugeIndisponible(erreur);
    }
    return reponses.map((r, i) => {
      const d = decisions.find((x) => x.numero === i + 1);
      if (!d) throw new JugeIndisponible(`Pas de décision pour la Réponse ${i + 1}.`);
      if (!d.valide) return { valide: false, formeReference: null, partEstimee: null };
      return { valide: true, formeReference: d.formeReference?.trim() || propre(r.saisie), partEstimee: Math.min(Math.max(d.surCent, 0), 100) / 100 };
    });
  }
}

/** « vietnam » devient « Vietnam ». */
function propre(saisie: string) {
  const s = saisie.trim().replace(/\s+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
