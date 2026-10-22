import { describe, expect, it } from "vitest";
import { FakeJuge } from "./juge/fake-juge";
import { JugeIndisponible, type Decision, type Juge, type ReponseAJuger } from "./juge/types";
import { jugerManche } from "./jugement";
import { lireManche, terminerManche } from "./manches";
import { commencerPartieLibre } from "./parties";
import { PALIERS, palierPourPart } from "./paliers";
import { T0, plus, uneMancheEn } from "./test-outils";

/** Un Juge de test : il connaît quelques Réponses et compte ses appels. */
class JugeDeTest implements Juge {
  appels: ReponseAJuger[][] = [];
  constructor(private connues: Record<string, Decision>) {}
  async juger(_lettre: string, reponses: ReponseAJuger[]) {
    this.appels.push(reponses);
    return reponses.map((r) => this.connues[r.saisie] ?? { valide: false, formeReference: null, partEstimee: null });
  }
}

describe("Le Juge valide ou refuse chaque Réponse", () => {
  it("une Réponse refusée ou une case vide rapporte 0", async () => {
    const { db, joueur, id } = await uneMancheEn("C", { Animal: "Chacal", Pays: "Cassoulet", Objet: "" });
    const juge = new JugeDeTest({ Chacal: { valide: true, formeReference: "chacal", partEstimee: 0.002 } });
    await jugerManche(db, juge, id, joueur.id);
    const manche = await lireManche(db, id, joueur.id, plus(41));
    const parCat = Object.fromEntries(manche!.reponses.map((r) => [r.categorie, r]));
    expect(parCat.Animal).toMatchObject({ valide: true, points: 12 });
    expect(parCat.Pays).toMatchObject({ valide: false, points: 0 });
    expect(parCat.Objet).toMatchObject({ valide: null, points: 0 });
    expect(parCat.Prénom).toMatchObject({ saisie: "", points: 0 });
    expect(manche!.etat).toBe("jugee");
  });

  it("le Juge n'est appelé qu'une fois par Manche, et une Réponse déjà jugée n'y repasse pas", async () => {
    const juge = new JugeDeTest({ Chacal: { valide: true, formeReference: "chacal", partEstimee: 0.002 } });
    const premiere = await uneMancheEn("C", { Animal: "Chacal", Pays: "Cassoulet" });
    await jugerManche(premiere.db, juge, premiere.id, premiere.joueur.id);
    expect(juge.appels).toHaveLength(1);
    expect(juge.appels[0]).toHaveLength(2);
    const seconde = await commencerPartieLibre(premiere.db, premiere.joueur.id, { maintenant: T0, aleatoire: () => 2.5 / 20 });
    await terminerManche(premiere.db, seconde.id, premiere.joueur.id, { Animal: "chacal" }, plus(10));
    await jugerManche(premiere.db, juge, seconde.id, premiere.joueur.id);
    expect(juge.appels).toHaveLength(1);
    expect((await lireManche(premiere.db, seconde.id, premiere.joueur.id))!.reponses.find((r) => r.categorie === "Animal")?.points).toBe(12);
  });
});

describe("Chaque Réponse validée affiche son Palier et ses points", () => {
  it.each([
    [0.45, "Banal", 1],
    [0.3, "Courant", 3],
    [0.1, "Courant", 3],
    [0.05, "Rare", 5],
    [0.03, "Rare", 5],
    [0.01, "Très rare", 8],
    [0.005, "Très rare", 8],
    [0.004, "Légendaire", 12],
    [null, "Légendaire", 12],
  ])("une part de %s donne %s, %i points", (part, nom, points) => {
    expect(palierPourPart(part)).toEqual({ nom, points });
  });

  it("le barème a cinq Paliers", () => {
    expect(PALIERS.map((p) => `${p.nom} ${p.points}`)).toEqual(["Banal 1", "Courant 3", "Rare 5", "Très rare 8", "Légendaire 12"]);
  });

  it("le total de la Manche s'affiche ; en Animal + C, « Chacal » rapporte plus que « Chien »", async () => {
    const chacal = await uneMancheEn("C", { Animal: "Chacal", Pays: "Cambodge" });
    await jugerManche(chacal.db, new FakeJuge(), chacal.id, chacal.joueur.id);
    const chien = await uneMancheEn("C", { Animal: "Chien" });
    await jugerManche(chien.db, new FakeJuge(), chien.id, chien.joueur.id);
    const points = async (m: typeof chacal) =>
      (await lireManche(m.db, m.id, m.joueur.id))!.reponses.find((r) => r.categorie === "Animal")!.points!;
    expect(await points(chacal)).toBeGreaterThan(await points(chien));
    const manche = await lireManche(chacal.db, chacal.id, chacal.joueur.id);
    expect(manche!.total).toBe(manche!.reponses.reduce((s, r) => s + (r.points ?? 0), 0));
    expect(manche!.total).toBeGreaterThan(0);
  });
});

describe("Si le Juge ne répond pas", () => {
  it("le Joueur le voit et peut relancer le jugement sans perdre sa Grille", async () => {
    const { db, joueur, id } = await uneMancheEn("C", { Animal: "Chacal", Pays: "Cambodge" });
    const enPanne: Juge = { juger: async () => Promise.reject(new JugeIndisponible()) };
    await jugerManche(db, enPanne, id, joueur.id);
    let manche = await lireManche(db, id, joueur.id);
    expect(manche!.etat).toBe("jugement_echoue");
    expect(manche!.reponses.find((r) => r.categorie === "Animal")?.saisie).toBe("Chacal");

    await jugerManche(db, new FakeJuge(), id, joueur.id);
    manche = await lireManche(db, id, joueur.id);
    expect(manche!.etat).toBe("jugee");
    expect(manche!.reponses.find((r) => r.categorie === "Animal")?.valide).toBe(true);
  });
});
