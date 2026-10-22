import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { lireManche, terminerManche } from "./manches";
import { PACK_CLASSIQUE } from "./packs";
import { commencerPartieLibre, lirePartie, mancheSuivante, records } from "./parties";
import { T0, plus, unJoueur } from "./test-outils";

/** Joue une Manche jusqu'au bout : la première Réponse connue du FakeJuge dans chaque Catégorie. */
async function jouer(db: Db, joueurId: string, mancheId: string, saisies: Record<string, string> = {}) {
  await terminerManche(db, mancheId, joueurId, saisies, plus(20));
  await jugerManche(db, new FakeJuge(), mancheId, joueurId);
  return (await lireManche(db, mancheId, joueurId))!;
}

describe("Le Joueur choisit un Préréglage", () => {
  it.each([
    ["express", 4, 45, 3],
    ["classique", 6, 90, 5],
    ["marathon", 12, 180, 10],
  ] as const)("%s : %i Catégories, %i s de chrono, %i Manches", async (prereglage, nbCategories, dureeS, nbManches) => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { prereglage, maintenant: T0 });
    expect(manche.categories).toHaveLength(nbCategories);
    expect(new Set(manche.categories).size).toBe(nbCategories);
    for (const c of manche.categories) expect(PACK_CLASSIQUE).toContain(c);
    expect((manche.finitLe.getTime() - T0.getTime()) / 1000).toBe(dureeS);
    const partie = await lirePartie(db, manche.partieId!, joueur.id);
    expect(partie).toMatchObject({ prereglage, nbManches, dureeS });
  });

  it("Classique est le Préréglage par défaut, avec les 6 Catégories de toujours", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect(manche.categories).toEqual(["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"]);
    expect((await lirePartie(db, manche.partieId!, joueur.id))?.prereglage).toBe("classique");
  });
});

describe("Les Manches s'enchaînent", () => {
  it("le total de la Partie grimpe, et une Lettre ne revient pas deux fois", async () => {
    const { db, joueur } = await unJoueur();
    let manche = await commencerPartieLibre(db, joueur.id, { prereglage: "marathon", maintenant: T0, aleatoire: () => 0 });
    const lettres = [manche.lettre];
    let totalAttendu = 0;
    for (let n = 1; n <= 10; n++) {
      const jouee = await jouer(db, joueur.id, manche.id, { Animal: "chat", Pays: "France" });
      totalAttendu += jouee.total ?? 0;
      const partie = await lirePartie(db, manche.partieId!, joueur.id);
      expect(partie?.total).toBe(totalAttendu);
      expect(jouee.partie).toMatchObject({ numero: n, nbManches: 10 });
      if (n < 10) {
        manche = (await mancheSuivante(db, manche.partieId!, joueur.id, { maintenant: plus(30), aleatoire: () => 0 }))!;
        lettres.push(manche.lettre);
      }
    }
    expect(new Set(lettres).size).toBe(10);
  });

  it("la Manche suivante n'existe qu'une fois la précédente jugée", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { maintenant: T0 });
    expect(await mancheSuivante(db, manche.partieId!, joueur.id)).toBeUndefined();
    await jouer(db, joueur.id, manche.id);
    const suivante = await mancheSuivante(db, manche.partieId!, joueur.id);
    expect(suivante?.numero).toBe(2);
    expect(await mancheSuivante(db, manche.partieId!, joueur.id)).toBeUndefined();
  });
});

describe("À la fin de la Partie", () => {
  async function partieComplete(db: Db, joueurId: string, saisies: Record<string, string>) {
    let manche = await commencerPartieLibre(db, joueurId, { prereglage: "express", maintenant: T0 });
    for (let n = 1; n <= 3; n++) {
      await jouer(db, joueurId, manche.id, Object.fromEntries(manche.categories.map((c) => [c, saisies[c] ?? ""])));
      if (n < 3) manche = (await mancheSuivante(db, manche.partieId!, joueurId))!;
    }
    return (await lirePartie(db, manche.partieId!, joueurId))!;
  }

  it("le Joueur voit son total et son nouveau record s'il l'a battu", async () => {
    const { db, joueur } = await unJoueur();
    const premiere = await partieComplete(db, joueur.id, {});
    expect(premiere).toMatchObject({ etat: "terminee", total: 0, nouveauRecord: true });
    const moins = await partieComplete(db, joueur.id, {});
    expect(moins).toMatchObject({ etat: "terminee", nouveauRecord: false, record: 0 });
  });
});

describe("L'accueil affiche le record par Préréglage", () => {
  it("sans Partie terminée, aucun record (pas de « 0 pts »)", async () => {
    const { db, joueur } = await unJoueur();
    expect(await records(db, joueur.id)).toEqual({});
  });

  it("une Partie quittée en cours ne compte pas, et n'empêche pas d'en lancer une autre", async () => {
    const { db, joueur } = await unJoueur();
    const quittee = await commencerPartieLibre(db, joueur.id, { prereglage: "express", maintenant: T0 });
    await jouer(db, joueur.id, quittee.id);
    const autre = await commencerPartieLibre(db, joueur.id, { prereglage: "express", maintenant: T0 });
    expect(autre.partieId).not.toBe(quittee.partieId);
    expect(await records(db, joueur.id)).toEqual({});
  });
});
