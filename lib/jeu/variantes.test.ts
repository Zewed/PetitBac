import { describe, expect, it } from "vitest";
import { FakeJuge } from "./juge/fake-juge";
import type { Juge, ReponseAJuger } from "./juge/types";
import { jugerManche } from "./jugement";
import { lireManche } from "./manches";
import { unJoueur, uneMancheEn } from "./test-outils";

async function reponseJugee(lettre: string, categorie: string, saisie: string, juge: Juge = new FakeJuge(), base?: Awaited<ReturnType<typeof unJoueur>>) {
  const m = await uneMancheEn(lettre, { [categorie]: saisie }, base);
  await jugerManche(m.db, juge, m.id, m.joueur.id);
  return (await lireManche(m.db, m.id, m.joueur.id))!.reponses.find((r) => r.categorie === categorie)!;
}

describe("Le Juge range les variantes d'une Réponse sous une seule Forme de référence", () => {
  it("« les Chacals », « Chacal » et « chacal » donnent la même Réponse, avec le même Palier", async () => {
    const base = await unJoueur();
    const formes = [];
    for (const s of ["les Chacals", "Chacal", "chacal"]) formes.push(await reponseJugee("C", "Animal", s, new FakeJuge(), base));
    for (const r of formes) expect(r).toMatchObject({ valide: true, formeReference: "chacal" });
    expect(new Set(formes.map((r) => r.palier)).size).toBe(1);
  });

  it("une petite faute de frappe est corrigée à l'affichage : « chacla » s'affiche « chacal »", async () => {
    expect(await reponseJugee("C", "Animal", "chacla")).toMatchObject({ valide: true, formeReference: "chacal" });
  });

  it("une abréviation est reconnue : « hippo » compte comme « hippopotame »", async () => {
    expect(await reponseJugee("H", "Animal", "hippo")).toMatchObject({ valide: true, formeReference: "hippopotame" });
  });

  it("les accents et les majuscules ne changent rien : « Équateur » et « equateur » sont la même Réponse", async () => {
    expect(await reponseJugee("E", "Pays", "equateur")).toMatchObject({ valide: true, formeReference: "Équateur" });
    expect(await reponseJugee("E", "Pays", "ÉQUATEUR")).toMatchObject({ valide: true, formeReference: "Équateur" });
  });

  it("un mot trop loin de tout mot connu reste refusé", async () => {
    expect(await reponseJugee("C", "Animal", "chafrougne")).toMatchObject({ valide: false, points: 0 });
  });

  it("une Réponse déjà jugée ne fait plus attendre : rejouer « chacal » en Animal + C ne rappelle pas le Juge", async () => {
    const appels: ReponseAJuger[][] = [];
    const fake = new FakeJuge();
    const espion: Juge = { juger: (lettre, reponses) => (appels.push(reponses), fake.juger(lettre, reponses)) };
    const base = await unJoueur();
    await reponseJugee("C", "Animal", "chacal", espion, base);
    const encore = await reponseJugee("C", "Animal", "Chacal", espion, base);
    expect(appels).toHaveLength(1);
    expect(encore).toMatchObject({ valide: true, formeReference: "chacal", points: 12 });
  });
});

describe("L'article ne compte pas pour la Lettre", () => {
  it("« la Tortue » ne vaut pas en L, mais « Laos » ou « Lapin » si", async () => {
    expect(await reponseJugee("T", "Animal", "la Tortue")).toMatchObject({ valide: true, formeReference: "tortue" });
    expect((await reponseJugee("L", "Animal", "la Tortue")).valide).toBe(false);
    expect(await reponseJugee("L", "Animal", "Lapin")).toMatchObject({ valide: true, formeReference: "lapin" });
  });
});
