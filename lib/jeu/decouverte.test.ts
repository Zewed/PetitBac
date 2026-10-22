import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { decouverte, EMOJIS, reagir } from "./decouverte";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur } from "./test-outils";

/** Un Salon de trois en Classique, Lettre A (Prénom, Pays, Animal, Métier, Fruit ou légume, Objet), Manche jouée et close. */
async function uneMancheJouee() {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "classique");
  const [lea, hugo] = await Promise.all(["Léa", "Hugo"].map(async (p) => {
    const r = await choisirPseudo(db, p);
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    return r.joueur;
  }));
  await lancerPartieSalon(db, salon.code, juju.id, "classique", { maintenant: T0, aleatoire: () => 0 });
  const saisir = async (j: { id: string }, s: Record<string, string>) => {
    const e = await etatPartieSalon(db, salon.code, j.id, plus(1));
    await enregistrerReponses(db, e!.maMancheId!, j.id, s, plus(5));
  };
  await saisir(juju, { Animal: "âne", Pays: "Arrrgh" });
  await saisir(lea, { Animal: "autruche" });
  await cloturerManche(db, new FakeJuge(), salon.code, plus(100));
  return { db, code: salon.code, juju, lea, hugo };
}

const ligne = async (db: Db, code: string, vu: string, categorie: string, pseudo: string) =>
  (await decouverte(db, code, vu))!.categories.find((c) => c.categorie === categorie)!.reponses.find((r) => r.pseudo === pseudo)!;

describe("Les Joueurs découvrent les Réponses de chacun", () => {
  it("Catégorie par Catégorie, avec le Palier et les points de chacune", async () => {
    const { db, code, hugo } = await uneMancheJouee();
    const d = await decouverte(db, code, hugo.id);
    expect(d!.categories.map((c) => c.categorie)).toEqual(["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"]);
    const animal = d!.categories.find((c) => c.categorie === "Animal")!;
    expect(animal.reponses.map((r) => r.pseudo).sort()).toEqual(["Hugo", "Juju", "Léa"]);
    expect(animal.reponses.find((r) => r.pseudo === "Juju")).toMatchObject({ reponse: "âne", valide: true });
    expect(animal.reponses.find((r) => r.pseudo === "Juju")!.points).toBeGreaterThan(0);
    expect(animal.reponses.find((r) => r.pseudo === "Juju")!.palier).not.toBeNull();
  });

  it("une Réponse refusée par le Juge vaut 0", async () => {
    const { db, code, hugo } = await uneMancheJouee();
    expect(await ligne(db, code, hugo.id, "Pays", "Juju")).toMatchObject({ reponse: "Arrrgh", valide: false, points: 0 });
  });

  it("une case vide est vide, pas une erreur", async () => {
    const { db, code, hugo } = await uneMancheJouee();
    expect(await ligne(db, code, hugo.id, "Animal", "Hugo")).toMatchObject({ reponse: "", valide: null, points: 0 });
  });

  it("rien à découvrir tant que la Manche n'est pas close", async () => {
    const { db, joueur: juju } = await unJoueur();
    const salon = await creerSalon(db, juju.id, "classique");
    const r = await choisirPseudo(db, "Léa");
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    await lancerPartieSalon(db, salon.code, juju.id, "classique", { maintenant: T0 });
    expect(await decouverte(db, salon.code, juju.id)).toBeNull();
  });
});

describe("Les réactions emoji", () => {
  it("un Joueur pose une réaction sur la Réponse d'un autre, et tout le Salon la voit", async () => {
    const { db, code, juju, lea, hugo } = await uneMancheJouee();
    const cible = await ligne(db, code, lea.id, "Animal", "Juju");
    expect(await reagir(db, code, cible.id, lea.id, EMOJIS[0])).toEqual({ ok: true });
    expect(await reagir(db, code, cible.id, hugo.id, EMOJIS[0])).toEqual({ ok: true });
    expect((await ligne(db, code, juju.id, "Animal", "Juju")).reactions).toContainEqual({ emoji: EMOJIS[0], nombre: 2, moi: false });
    expect((await ligne(db, code, lea.id, "Animal", "Juju")).reactions).toContainEqual({ emoji: EMOJIS[0], nombre: 2, moi: true });
  });

  it("reposer la même réaction l'enlève", async () => {
    const { db, code, juju, lea } = await uneMancheJouee();
    const cible = await ligne(db, code, lea.id, "Animal", "Juju");
    await reagir(db, code, cible.id, lea.id, EMOJIS[1]);
    await reagir(db, code, cible.id, lea.id, EMOJIS[1]);
    expect((await ligne(db, code, juju.id, "Animal", "Juju")).reactions).toEqual([]);
  });

  it("on ne réagit pas à sa propre Réponse, ni avec un emoji hors de la palette", async () => {
    const { db, code, juju, lea } = await uneMancheJouee();
    const sienne = await ligne(db, code, juju.id, "Animal", "Juju");
    expect((await reagir(db, code, sienne.id, juju.id, EMOJIS[0])).ok).toBe(false);
    expect((await reagir(db, code, sienne.id, lea.id, "💩")).ok).toBe(false);
  });
});
