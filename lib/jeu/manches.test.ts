import { describe, expect, it } from "vitest";
import { commencerPartieLibre, enregistrerReponses, lireManche, terminerManche } from "./manches";
import { T0, plus, unJoueur } from "./test-outils";

describe("« Partie libre » lance une Manche", () => {
  it("tire une Lettre hors K, Q, W, X, Y et Z, prend les 6 Catégories du Pack Classique et un chrono de 1:30", async () => {
    const { db, joueur } = await unJoueur();
    const lettres = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
      lettres.add(manche.lettre);
      expect(manche.categories).toEqual(["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"]);
      expect(manche.finitLe.getTime() - T0.getTime()).toBe(90_000);
    }
    for (const exclue of ["K", "Q", "W", "X", "Y", "Z"]) expect(lettres).not.toContain(exclue);
    expect(lettres.size).toBeGreaterThan(5);
  });

  it("la Manche n'appartient qu'au Joueur qui l'a lancée", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect(await lireManche(db, manche.id, joueur.id, T0)).toBeDefined();
    expect(await lireManche(db, manche.id, "00000000-0000-0000-0000-000000000000", T0)).toBeUndefined();
  });
});

describe("Recharger la page ne remet pas le chrono à zéro", () => {
  it("le temps restant vient de l'horloge du serveur, pas du moment où la page s'ouvre", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect((await lireManche(db, manche.id, joueur.id, plus(20)))?.resteS).toBe(70);
    expect((await lireManche(db, manche.id, joueur.id, plus(21)))?.resteS).toBe(69);
    expect((await lireManche(db, manche.id, joueur.id, plus(120)))?.resteS).toBe(0);
  });
});

describe("La Manche s'arrête, et la Grille ne se modifie plus", () => {
  it("garde les Réponses écrites pendant le chrono", async () => {
    const { db, joueur } = await unJoueur();
    const { id } = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect(await enregistrerReponses(db, id, joueur.id, { Animal: "Chacal", Pays: "Cambodge" }, plus(10))).toEqual({ ok: true });
    const manche = await lireManche(db, id, joueur.id, plus(11));
    expect(manche?.reponses.find((r) => r.categorie === "Animal")?.saisie).toBe("Chacal");
    expect(manche?.reponses.find((r) => r.categorie === "Pays")?.saisie).toBe("Cambodge");
  });

  it("« J'ai fini » arrête la Manche, avec les dernières Réponses, puis plus rien ne change", async () => {
    const { db, joueur } = await unJoueur();
    const { id } = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    await terminerManche(db, id, joueur.id, { Animal: "Chacal" }, plus(30));
    expect((await lireManche(db, id, joueur.id, plus(31)))?.etat).toBe("a_juger");
    expect(await enregistrerReponses(db, id, joueur.id, { Animal: "Chien" }, plus(32))).toEqual({
      ok: false,
      erreur: "La manche est finie : ta grille ne peut plus changer.",
    });
    expect((await lireManche(db, id, joueur.id, plus(33)))?.reponses.find((r) => r.categorie === "Animal")?.saisie).toBe("Chacal");
  });

  it("à 0:00, plus aucune Réponse n'est acceptée, au-delà de quelques secondes de transit", async () => {
    const { db, joueur } = await unJoueur();
    const { id } = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect(await enregistrerReponses(db, id, joueur.id, { Animal: "Chacal" }, plus(91))).toEqual({ ok: true });
    expect((await enregistrerReponses(db, id, joueur.id, { Animal: "Chien" }, plus(95))).ok).toBe(false);
    await terminerManche(db, id, joueur.id, { Animal: "Chien" }, plus(120));
    expect((await lireManche(db, id, joueur.id, plus(121)))?.reponses.find((r) => r.categorie === "Animal")?.saisie).toBe("Chacal");
  });

  it("un autre Joueur ne peut pas écrire dans la Grille", async () => {
    const { db, joueur } = await unJoueur();
    const { id } = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect((await enregistrerReponses(db, id, "00000000-0000-0000-0000-000000000000", { Animal: "Chien" }, plus(5))).ok).toBe(false);
  });
});
