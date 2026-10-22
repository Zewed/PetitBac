import { describe, expect, it } from "vitest";
import { ouvrirPglite } from "@/db/pglite";
import { choisirPseudo, trouverJoueur } from "./joueurs";

describe("Le Joueur choisit un pseudo", () => {
  it("crée le Joueur avec son pseudo", async () => {
    const db = await ouvrirPglite();
    const resultat = await choisirPseudo(db, "  Juju ");
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    const joueur = await trouverJoueur(db, resultat.joueur.id);
    expect(joueur?.pseudo).toBe("Juju");
  });

  it.each(["connard", "Gros Con", "s4lope", "fdp", "pute_du_93"])(
    "refuse un pseudo grossier (%s) en disant pourquoi",
    async (pseudo) => {
      const db = await ouvrirPglite();
      const resultat = await choisirPseudo(db, pseudo);
      expect(resultat).toEqual({ ok: false, erreur: "Ce pseudo contient un gros mot. Choisis-en un autre." });
    },
  );

  it.each(["Constance", "Pascal", "Cunégonde", "Léa", "Mehdi_93"])("accepte un pseudo propre (%s)", async (pseudo) => {
    const db = await ouvrirPglite();
    expect((await choisirPseudo(db, pseudo)).ok).toBe(true);
  });

  it("refuse un pseudo trop court ou trop long", async () => {
    const db = await ouvrirPglite();
    expect(await choisirPseudo(db, "J")).toEqual({ ok: false, erreur: "Ton pseudo doit faire entre 2 et 20 caractères." });
    expect(await choisirPseudo(db, "J".repeat(21))).toEqual({
      ok: false,
      erreur: "Ton pseudo doit faire entre 2 et 20 caractères.",
    });
  });
});
