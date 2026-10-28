import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { JugeIA } from "./juge-ia";
import { JugeIndisponible } from "./types";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** Un modèle qui répond toujours ce JSON, et garde le dernier prompt reçu. */
function modele(reponse: unknown) {
  const vu: { prompt?: string } = {};
  const model = new MockLanguageModelV4({
    doGenerate: async (options) => {
      vu.prompt = JSON.stringify(options.prompt);
      return { content: [{ type: "text", text: JSON.stringify(reponse) }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
    },
  });
  return { model, vu };
}

describe("Le vrai Juge", () => {
  it("juge toutes les Réponses d'une Manche en un seul appel, dans l'ordre, avec leur Forme de référence et leur part estimée", async () => {
    const { model, vu } = modele({
      decisions: [
        { numero: 1, valide: true, formeReference: "Caracal", surCent: 2 },
        { numero: 2, valide: false, formeReference: null, surCent: 0 },
        { numero: 3, valide: true, formeReference: "Chat", surCent: 45 },
      ],
    });
    const decisions = await new JugeIA(model).juger("C", [
      { categorie: "Animal", saisie: "caracal" },
      { categorie: "Animal", saisie: "chafrougne" },
      { categorie: "Animal", saisie: "les chats" },
    ]);
    expect(decisions).toEqual([
      { valide: true, formeReference: "Caracal", partEstimee: 0.02 },
      { valide: false, formeReference: null, partEstimee: null },
      { valide: true, formeReference: "Chat", partEstimee: 0.45 },
    ]);
    expect(model.doGenerateCalls).toHaveLength(1);
    expect(vu.prompt).toContain("chafrougne");
    expect(vu.prompt).toContain("Animal");
  });

  it("une Réponse validée sans Forme de référence garde sa saisie, propre ; la part reste entre 0 et 1", async () => {
    const { model } = modele({ decisions: [{ numero: 1, valide: true, formeReference: "", surCent: 140 }] });
    expect(await new JugeIA(model).juger("V", [{ categorie: "Pays", saisie: "  vietnam " }])).toEqual([
      { valide: true, formeReference: "Vietnam", partEstimee: 1 },
    ]);
  });

  it("si l'IA ne répond pas, ou répond à côté, le Juge est indisponible : la Manche se relancera", async () => {
    const enPanne = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("503");
      },
    });
    await expect(new JugeIA(enPanne).juger("C", [{ categorie: "Animal", saisie: "chat" }])).rejects.toBeInstanceOf(JugeIndisponible);
    const { model } = modele({ decisions: [] });
    await expect(new JugeIA(model).juger("C", [{ categorie: "Animal", saisie: "chat" }])).rejects.toBeInstanceOf(JugeIndisponible);
  });
});
