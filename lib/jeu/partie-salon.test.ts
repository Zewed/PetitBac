import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses, lireManche } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon, mancheSuivanteSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur } from "./test-outils";

async function unSalon(nb = 3) {
  const { db, joueur: hote } = await unJoueur();
  const salon = await creerSalon(db, hote.id, "classique");
  const autres = [];
  for (let i = 1; i < nb; i++) {
    const r = await choisirPseudo(db, ["Léa", "Hugo", "Inès", "Mehdi"][i - 1]);
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    autres.push(r.joueur);
  }
  return { db, code: salon.code, hote, autres };
}

async function mancheDe(db: Db, code: string, joueurId: string, maintenant: Date) {
  const etat = await etatPartieSalon(db, code, joueurId, maintenant);
  return (await lireManche(db, etat!.maMancheId!, joueurId, maintenant))!;
}

describe("L'Hôte choisit un Préréglage et lance la Partie", () => {
  it("les autres Joueurs ne peuvent pas la lancer", async () => {
    const { db, code, autres } = await unSalon();
    expect(await lancerPartieSalon(db, code, autres[0].id, "express", { maintenant: T0 })).toEqual({ ok: false, erreur: "Seul l'hôte lance la partie." });
  });

  it("il faut au moins un autre Joueur", async () => {
    const { db, code, hote } = await unSalon(1);
    expect(await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0 })).toEqual({ ok: false, erreur: "Il faut au moins 2 joueurs pour lancer la partie." });
  });
});

describe("Tous les Joueurs jouent la même Manche", () => {
  it("même Lettre, mêmes Catégories, même chrono, au même moment", async () => {
    const { db, code, hote, autres } = await unSalon();
    expect((await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0 })).ok).toBe(true);
    const grilles = await Promise.all([hote, ...autres].map((j) => mancheDe(db, code, j.id, plus(1))));
    expect(new Set(grilles.map((g) => g.lettre)).size).toBe(1);
    expect(new Set(grilles.map((g) => g.categories.join())).size).toBe(1);
    expect(new Set(grilles.map((g) => g.finitLe.getTime())).size).toBe(1);
    expect(grilles[0].categories).toHaveLength(4);
    expect(grilles[0].finitLe.getTime() - T0.getTime()).toBe(45_000);
  });

  it("à la fin du chrono, toutes les Grilles se ferment, même celle d'un Joueur qui tapait encore", async () => {
    const { db, code, hote, autres } = await unSalon();
    await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0 });
    const lea = await mancheDe(db, code, autres[0].id, plus(1));
    await enregistrerReponses(db, lea.id, autres[0].id, { [lea.categories[0]]: "Avant" }, plus(10));
    expect((await enregistrerReponses(db, lea.id, autres[0].id, { [lea.categories[0]]: "Après" }, plus(60))).ok).toBe(false);
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    for (const j of [hote, ...autres]) expect((await mancheDe(db, code, j.id, plus(61))).etat).toBe("jugee");
  });

  it("clôturer avant la fin du chrono ne ferme rien", async () => {
    const { db, code, hote } = await unSalon();
    await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0 });
    await cloturerManche(db, new FakeJuge(), code, plus(20));
    expect((await mancheDe(db, code, hote.id, plus(21))).etat).toBe("en_cours");
  });
});

describe("Après chaque Manche", () => {
  it("chaque Joueur voit ses points et le classement du Salon", async () => {
    const { db, code, hote, autres } = await unSalon();
    await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0, aleatoire: () => 0 });
    const m = await mancheDe(db, code, hote.id, plus(1));
    expect(m.lettre).toBe("A");
    const cat = m.categories.includes("Animal") ? "Animal" : m.categories.includes("Pays") ? "Pays" : m.categories[0];
    const bonne = { Animal: "âne", Pays: "Allemagne", Prénom: "Adam", Métier: "avocat", "Fruit ou légume": "ananas", Objet: "assiette" }[cat]!;
    await enregistrerReponses(db, m.id, hote.id, { [cat]: bonne }, plus(5));
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    const vu = await etatPartieSalon(db, code, autres[0].id, plus(61));
    expect(vu?.classement[0]).toMatchObject({ pseudo: "Juju", moi: false });
    expect(vu!.classement[0].total).toBeGreaterThan(0);
    expect(vu?.classement.map((c) => c.pseudo).sort()).toEqual(["Hugo", "Juju", "Léa"]);
    expect(vu?.manche).toMatchObject({ numero: 1, nbManches: 3, close: true });
  });
});

describe("La Manche suivante", () => {
  it("démarre quand l'Hôte la lance, une fois la précédente close, et le numéro suit", async () => {
    const { db, code, hote, autres } = await unSalon();
    await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0 });
    expect((await mancheSuivanteSalon(db, code, hote.id, { maintenant: plus(10) })).ok).toBe(false);
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    expect((await mancheSuivanteSalon(db, code, autres[0].id, { maintenant: plus(70) })).ok).toBe(false);
    expect((await mancheSuivanteSalon(db, code, hote.id, { maintenant: plus(70) })).ok).toBe(true);
    const vu = await etatPartieSalon(db, code, autres[1].id, plus(71));
    expect(vu?.manche).toMatchObject({ numero: 2, nbManches: 3, close: false });
  });

  it("la Partie s'arrête après le nombre de Manches du Préréglage, sans jamais reprendre une Lettre", async () => {
    const { db, code, hote } = await unSalon(2);
    await lancerPartieSalon(db, code, hote.id, "express", { maintenant: T0, aleatoire: () => 0 });
    const lettres = [];
    for (let n = 1; n <= 3; n++) {
      const t = plus(n * 100);
      lettres.push((await mancheDe(db, code, hote.id, t)).lettre);
      await cloturerManche(db, new FakeJuge(), code, plus(n * 100 + 60));
      if (n < 3) expect((await mancheSuivanteSalon(db, code, hote.id, { maintenant: plus(n * 100 + 70), aleatoire: () => 0 })).ok).toBe(true);
    }
    expect(new Set(lettres).size).toBe(3);
    expect((await mancheSuivanteSalon(db, code, hote.id, { maintenant: plus(500) })).ok).toBe(false);
    expect((await etatPartieSalon(db, code, hote.id, plus(501)))?.partie.etat).toBe("terminee");
  });
});
