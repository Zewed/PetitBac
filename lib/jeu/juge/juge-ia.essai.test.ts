import { describe, expect, it } from "vitest";
import { JugeIA } from "./juge-ia";

/**
 * Un essai contre le vrai modèle, à lancer à la main : il coûte des crédits AI Gateway et demande un accès.
 * PETIT_BAC_ESSAI_IA=1 AI_GATEWAY_API_KEY=… (ou VERCEL_OIDC_TOKEN=…) pnpm vitest run lib/jeu/juge/juge-ia.essai.test.ts
 */
describe.runIf(process.env.PETIT_BAC_ESSAI_IA)("Le vrai Juge, contre Claude Haiku", () => {
  it("valide une Réponse juste et rare, refuse un mot inventé et une Réponse hors Catégorie, range les variantes", async () => {
    const [caracal, chafrougne, chili, chats] = await new JugeIA().juger("C", [
      { categorie: "Animal", saisie: "caracal" },
      { categorie: "Animal", saisie: "chafrougne" },
      { categorie: "Animal", saisie: "Chili" },
      { categorie: "Animal", saisie: "les chats" },
    ]);
    console.log({ caracal, chafrougne, chili, chats });
    expect(caracal).toMatchObject({ valide: true, formeReference: "Caracal" });
    expect(caracal.partEstimee).toBeLessThan(0.1);
    expect(chafrougne.valide).toBe(false);
    expect(chili.valide).toBe(false);
    expect(chats).toMatchObject({ valide: true, formeReference: "Chat" });
    expect(chats.partEstimee).toBeGreaterThan(caracal.partEstimee!);
  }, 30_000);
});
