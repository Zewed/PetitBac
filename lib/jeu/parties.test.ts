import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { FakeJuge } from "./juge/fake-juge";
import { LISTES_FAKE } from "./juge/liste-fake";
import { jugerManche } from "./jugement";
import { lireManche, terminerManche, type Saisies } from "./manches";
import { PACK_CLASSIQUE } from "./packs";
import { commencerPartieLibre, lirePartie, mancheSuivante, records } from "./parties";
import { normaliser } from "./texte";
import { T0, plus, unJoueur } from "./test-outils";

/** Joue une Manche jusqu'au bout : la première Réponse connue du FakeJuge dans chaque Catégorie. */
async function jouer(db: Db, joueurId: string, mancheId: string, saisies: Saisies = {}) {
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

/** Une Partie Express jouée jusqu'au bout ; `remplir` donne les Réponses de chaque Manche (aucune par défaut : 0 point). */
async function partieExpress(db: Db, joueurId: string, remplir: (manche: { lettre: string; categories: string[] }) => Saisies = () => ({})) {
  let manche = await commencerPartieLibre(db, joueurId, { prereglage: "express", maintenant: T0 });
  for (let n = 1; n <= 3; n++) {
    await jouer(db, joueurId, manche.id, remplir(manche));
    if (n < 3) manche = (await mancheSuivante(db, manche.partieId!, joueurId))!;
  }
  return (await lirePartie(db, manche.partieId!, joueurId))!;
}

/** Des Réponses que le FakeJuge valide, dans la Lettre de la Manche : de quoi marquer des points. */
const valables = ({ lettre, categories }: { lettre: string; categories: string[] }): Saisies =>
  Object.fromEntries(categories.map((c) => [c, (LISTES_FAKE[c] ?? [`${lettre}abcd`]).find((mot) => normaliser(mot).startsWith(lettre.toLowerCase())) ?? ""]));

describe("À la fin de la Partie", () => {
  it("le Joueur voit son total et son nouveau record s'il l'a battu", async () => {
    const { db, joueur } = await unJoueur();
    const premiere = await partieExpress(db, joueur.id, valables);
    expect(premiere.total).toBeGreaterThan(0);
    expect(premiere).toMatchObject({ etat: "terminee", nouveauRecord: true, record: null });
    const moins = await partieExpress(db, joueur.id);
    expect(moins).toMatchObject({ etat: "terminee", total: 0, nouveauRecord: false, record: premiere.total });
  });

  it("une Partie finie à 0 point n'est pas un record", async () => {
    const { db, joueur } = await unJoueur();
    expect(await partieExpress(db, joueur.id)).toMatchObject({ etat: "terminee", total: 0, nouveauRecord: false, record: null });
    expect(await partieExpress(db, joueur.id)).toMatchObject({ total: 0, nouveauRecord: false, record: null });
  });
});

describe("L'accueil affiche le record par Préréglage", () => {
  it("sans Partie terminée, aucun record (pas de « 0 pts »)", async () => {
    const { db, joueur } = await unJoueur();
    expect(await records(db, joueur.id)).toEqual({});
  });

  it("une Partie finie à 0 point ne donne pas de « Record 0 pts »", async () => {
    const { db, joueur } = await unJoueur();
    await partieExpress(db, joueur.id);
    expect(await records(db, joueur.id)).toEqual({});
  });

  it("le record apparaît dès que le meilleur total dépasse 0", async () => {
    const { db, joueur } = await unJoueur();
    await partieExpress(db, joueur.id);
    const marquee = await partieExpress(db, joueur.id, valables);
    expect(await records(db, joueur.id)).toEqual({ express: marquee.total });
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
