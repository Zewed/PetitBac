import { describe, expect, it } from "vitest";
import { defiDuJour } from "./defi";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { lireManche, terminerManche } from "./manches";
import { CATALOGUE, PACK_CLASSIQUE, PACKS } from "./packs";
import { commencerPartieLibre, mancheSuivante } from "./parties";
import { lireReglages, REGLAGES_PAR_DEFAUT, type Reglages } from "./reglages";
import { T0, plus, unJoueur } from "./test-outils";
import { ouvrirPglite } from "@/db/pglite";

const reglages = (r: Partial<Reglages>): Reglages => ({ ...REGLAGES_PAR_DEFAUT, ...r });

function formulaire(champs: Record<string, string | string[]>) {
  const f = new FormData();
  const base = { manches_mode: "nombre", nb_manches: "3", lettres: "ABCDEFGHIJLMNOPRSTUV".split(""), choix_lettre: "hasard", duree: "120", grace: "10", stop_des: "complete" };
  for (const [k, v] of Object.entries({ ...base, ...champs })) for (const x of [v].flat()) f.append(k, x);
  return f;
}

describe("Le Catalogue", () => {
  it("propose une dizaine de Packs, soit 100 à 150 Catégories, chacune dans un seul Pack", () => {
    expect(PACKS.length).toBeGreaterThanOrEqual(9);
    expect(PACKS.length).toBeLessThanOrEqual(12);
    expect(CATALOGUE.length).toBeGreaterThanOrEqual(100);
    expect(CATALOGUE.length).toBeLessThanOrEqual(150);
    expect(new Set(CATALOGUE).size).toBe(CATALOGUE.length);
    for (const p of PACKS) expect(p.categories.length).toBeGreaterThanOrEqual(10);
    expect(PACKS[0]).toMatchObject({ id: "classique", nom: "Classique", categories: PACK_CLASSIQUE });
  });

  it("le Pack Classique sert par défaut", () => {
    expect(REGLAGES_PAR_DEFAUT.categories).toEqual({ mode: "main", liste: ["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"] });
  });
});

describe("Les Catégories d'une Partie Personnalisée", () => {
  it("se choisissent à la main, de 1 à 20", () => {
    const r = lireReglages(formulaire({ categories_mode: "main", categories: ["Dessert", "Capitale", "Jouet"] }), { salon: false });
    expect(r.ok && r.reglages.categories).toEqual({ mode: "main", liste: ["Dessert", "Capitale", "Jouet"] });
    expect(lireReglages(formulaire({ categories_mode: "main", categories: [] }), { salon: false })).toEqual({ ok: false, erreur: "Choisis de 1 à 20 catégories." });
    expect(lireReglages(formulaire({ categories_mode: "main", categories: CATALOGUE.slice(0, 21) }), { salon: false }).ok).toBe(false);
    expect(lireReglages(formulaire({ categories_mode: "main", categories: ["Gros mot"] }), { salon: false }).ok).toBe(false);
  });

  it("se tirent au hasard dans les Packs cochés, une fois pour la Partie", async () => {
    const { db, joueur } = await unJoueur();
    const lus = lireReglages(formulaire({ categories_mode: "packs", packs: ["cinema", "sport-jeux"], nb_categories: "8" }), { salon: false });
    expect(lus.ok && lus.reglages.categories).toEqual({ mode: "packs", packs: ["cinema", "sport-jeux"], nombre: 8 });
    const permises = PACKS.filter((p) => ["cinema", "sport-jeux"].includes(p.id)).flatMap((p) => p.categories);
    const premiere = await commencerPartieLibre(db, joueur.id, { prereglage: "personnalise", reglages: lus.ok ? lus.reglages : REGLAGES_PAR_DEFAUT, maintenant: T0 });
    expect(premiere.categories).toHaveLength(8);
    expect(premiere.categories.every((c) => permises.includes(c))).toBe(true);
    await terminerManche(db, premiere.id, joueur.id, {}, plus(10));
    await jugerManche(db, new FakeJuge(), premiere.id, joueur.id);
    const seconde = (await mancheSuivante(db, premiere.partieId!, joueur.id, { maintenant: plus(20) }))!;
    expect(seconde.categories).toEqual(premiere.categories);
  });

  it("se retirent au sort à chaque Manche", async () => {
    const { db, joueur } = await unJoueur();
    let n = 0;
    const aleatoire = () => ((n = (n * 7 + 3) % 97) + 0.5) / 97;
    const r = reglages({ categories: { mode: "chaque_manche", packs: ["nature", "cuisine", "geographie"], nombre: 6 } });
    const premiere = await commencerPartieLibre(db, joueur.id, { prereglage: "personnalise", reglages: r, maintenant: T0, aleatoire });
    await terminerManche(db, premiere.id, joueur.id, {}, plus(10));
    await jugerManche(db, new FakeJuge(), premiere.id, joueur.id);
    const seconde = (await mancheSuivante(db, premiere.partieId!, joueur.id, { maintenant: plus(20), aleatoire }))!;
    expect(seconde.categories).toHaveLength(6);
    expect(seconde.categories).not.toEqual(premiere.categories);
    expect((await lireManche(db, seconde.id, joueur.id))!.reponses.map((x) => x.categorie)).toEqual(seconde.categories);
  });

  it("il faut assez de Catégories dans les Packs cochés", () => {
    expect(lireReglages(formulaire({ categories_mode: "packs", packs: [], nb_categories: "8" }), { salon: false })).toEqual({
      ok: false,
      erreur: "Coche au moins un pack.",
    });
    expect(lireReglages(formulaire({ categories_mode: "packs", packs: ["voyages"], nb_categories: "15" }), { salon: false }).ok).toBe(false);
  });
});

describe("Le Défi du jour", () => {
  it("tire ses 12 Catégories dans tout le Catalogue", async () => {
    const db = await ouvrirPglite();
    let n = 0;
    const defi = await defiDuJour(db, T0, () => ((n = (n * 31 + 11) % 101) + 0.5) / 101);
    expect(defi.categories).toHaveLength(12);
    expect(defi.categories.every((c) => CATALOGUE.includes(c))).toBe(true);
    expect(defi.categories.some((c) => !PACK_CLASSIQUE.includes(c))).toBe(true);
  });
});

describe("Le FakeJuge", () => {
  it("sans liste pour une Catégorie, accepte une Réponse qui commence par la Lettre", async () => {
    const [ok, non] = await new FakeJuge().juger("D", [
      { categorie: "Dessert", saisie: "Diplomate" },
      { categorie: "Dessert", saisie: "Tarte" },
    ]);
    expect(ok).toMatchObject({ valide: true, formeReference: "Diplomate" });
    expect(non.valide).toBe(false);
  });
});
