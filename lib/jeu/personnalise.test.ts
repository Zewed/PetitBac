import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { contester } from "./contestation";
import { decouverte } from "./decouverte";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { choisirPseudo } from "./joueurs";
import { lireManche, terminerManche } from "./manches";
import { choisirLettreSuivante, cloturerManche, etatPartieSalon, lancerPartieSalon, mancheSuivanteSalon } from "./partie-salon";
import { commencerPartieLibre, lirePartie, mancheSuivante } from "./parties";
import { REGLAGES_PAR_DEFAUT, SANS_LIMITE_S, type Reglages } from "./reglages";
import { creerSalon, rejoindreSalon } from "./salons";
import { direStop } from "./stop";
import { T0, plus, unJoueur } from "./test-outils";

const reglages = (r: Partial<Reglages>): Reglages => ({ ...REGLAGES_PAR_DEFAUT, ...r });
const juge = new FakeJuge();

async function nouveau(db: Db, pseudo: string) {
  const r = await choisirPseudo(db, pseudo);
  if (!r.ok) throw new Error(r.erreur);
  return r.joueur;
}

async function unSalonPersonnalise(r: Partial<Reglages>, options: { lettre?: string } = {}) {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "classique");
  const lea = await nouveau(db, "Léa");
  await rejoindreSalon(db, salon.code, lea.id);
  expect(await lancerPartieSalon(db, salon.code, juju.id, "personnalise", { maintenant: T0, reglages: reglages(r), ...options })).toEqual({ ok: true });
  const etat = async (id: string) => (await etatPartieSalon(db, salon.code, id, plus(1)))!;
  return { db, code: salon.code, juju, lea, etat };
}

describe("Une Partie libre Personnalisée", () => {
  it("joue le nombre de Manches et le chrono réglés, dans les Lettres cochées", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, {
      prereglage: "personnalise",
      reglages: reglages({ manches: { mode: "nombre", n: 2 }, dureeS: 120, lettres: ["B", "M"] }),
      maintenant: T0,
    });
    expect(["B", "M"]).toContain(manche.lettre);
    const vue = (await lireManche(db, manche.id, joueur.id, T0))!;
    expect([vue.dureeS, vue.resteS, vue.partie?.nbManches, vue.partie?.nom]).toEqual([120, 120, 2, "Personnalisé"]);
    await terminerManche(db, manche.id, joueur.id, {}, plus(10));
    await jugerManche(db, juge, manche.id, joueur.id);
    const seconde = (await mancheSuivante(db, manche.partieId!, joueur.id, { maintenant: plus(20) }))!;
    expect(seconde.lettre).toBe(manche.lettre === "B" ? "M" : "B");
  });

  it("sans limite, le chrono ne s'arrête pas : c'est « J'ai fini » qui termine la Manche", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { prereglage: "personnalise", reglages: reglages({ dureeS: null }), maintenant: T0 });
    const vue = (await lireManche(db, manche.id, joueur.id, plus(3600)))!;
    expect(vue.sansLimite).toBe(true);
    expect(vue.resteS).toBeGreaterThan(0);
    expect(vue.dureeS).toBe(SANS_LIMITE_S);
  });

  it("la Lettre peut être choisie par le Joueur", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { prereglage: "personnalise", reglages: reglages({ choixLettre: "hote" }), lettre: "R", maintenant: T0 });
    expect(manche.lettre).toBe("R");
    await terminerManche(db, manche.id, joueur.id, {}, plus(10));
    await jugerManche(db, juge, manche.id, joueur.id);
    expect((await mancheSuivante(db, manche.partieId!, joueur.id, { lettre: "R", maintenant: plus(20) }))?.lettre).not.toBe("R");
  });

  it("« le premier à X points » s'arrête dès que l'objectif est atteint", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, {
      prereglage: "personnalise",
      reglages: reglages({ manches: { mode: "points", objectif: 10 }, choixLettre: "hote" }),
      lettre: "C",
      maintenant: T0,
    });
    await terminerManche(db, manche.id, joueur.id, { Prénom: "Camille", Pays: "Cambodge", Animal: "Chacal", "Fruit ou légume": "Clémentine" }, plus(10));
    await jugerManche(db, juge, manche.id, joueur.id);
    const partie = (await lirePartie(db, manche.partieId!, joueur.id))!;
    expect(partie.total).toBeGreaterThanOrEqual(10);
    expect(partie.etat).toBe("terminee");
    expect(partie.objectif).toBe(10);
    expect(await mancheSuivante(db, manche.partieId!, joueur.id, { maintenant: plus(20) })).toBeUndefined();
  });

  it("ne change jamais le barème : mêmes Réponses, mêmes points qu'en Classique", async () => {
    const saisies = { Prénom: "Camille", Pays: "Cambodge", Animal: "Chacal", Métier: "Cuisinier", "Fruit ou légume": "Clémentine", Objet: "Crayon" };
    const { db, joueur } = await unJoueur();
    const classique = await commencerPartieLibre(db, joueur.id, { maintenant: T0, aleatoire: () => 2.5 / 20 });
    expect(classique.lettre).toBe("C");
    await terminerManche(db, classique.id, joueur.id, saisies, plus(10));
    await jugerManche(db, juge, classique.id, joueur.id);
    const perso = await commencerPartieLibre(db, joueur.id, {
      prereglage: "personnalise",
      reglages: reglages({ dureeS: null, choixLettre: "hote", manches: { mode: "nombre", n: 1 } }),
      lettre: "C",
      maintenant: plus(100),
    });
    await terminerManche(db, perso.id, joueur.id, saisies, plus(110));
    await jugerManche(db, juge, perso.id, joueur.id);
    const points = async (id: string) => (await lireManche(db, id, joueur.id))!.reponses.map((r) => r.points);
    expect(await points(perso.id)).toEqual(await points(classique.id));
  });

  it("n'a pas de record : ses Réglages ne se comparent pas", async () => {
    const { db, joueur } = await unJoueur();
    const manche = await commencerPartieLibre(db, joueur.id, { prereglage: "personnalise", reglages: reglages({ manches: { mode: "nombre", n: 1 } }), maintenant: T0 });
    await terminerManche(db, manche.id, joueur.id, {}, plus(10));
    await jugerManche(db, juge, manche.id, joueur.id);
    expect(await lirePartie(db, manche.partieId!, joueur.id)).toMatchObject({ etat: "terminee", record: null, nouveauRecord: false });
  });
});

describe("Une Partie Personnalisée dans un Salon", () => {
  it("seul l'Hôte la règle", async () => {
    const { db, joueur: juju } = await unJoueur();
    const salon = await creerSalon(db, juju.id, "classique");
    const lea = await nouveau(db, "Léa");
    await rejoindreSalon(db, salon.code, lea.id);
    expect((await lancerPartieSalon(db, salon.code, lea.id, "personnalise", { reglages: REGLAGES_PAR_DEFAUT })).ok).toBe(false);
  });

  it("sans STOP, personne ne peut le dire", async () => {
    const { db, lea, etat } = await unSalonPersonnalise({ stop: { actif: false, des: "complete", graceS: 10 } });
    const manche = (await etat(lea.id)).maMancheId!;
    const tout = { Prénom: "Camille", Pays: "Cambodge", Animal: "Chacal", Métier: "Cuisinier", "Fruit ou légume": "Clémentine", Objet: "Crayon" };
    expect(await direStop(db, manche, lea.id, tout, plus(5))).toEqual({ ok: false, erreur: "Le STOP est désactivé pour cette partie." });
    expect((await etat(lea.id)).reglages.stop.actif).toBe(false);
  });

  it("le STOP est possible dès N cases remplies, avec le Temps de grâce réglé", async () => {
    const { db, juju, lea, etat } = await unSalonPersonnalise({ stop: { actif: true, des: 2, graceS: 0 }, choixLettre: "hote" }, { lettre: "C" });
    const manche = (await etat(lea.id)).maMancheId!;
    expect((await direStop(db, manche, lea.id, { Prénom: "Camille" }, plus(5))).ok).toBe(false);
    expect(await direStop(db, manche, lea.id, { Prénom: "Camille", Pays: "Cambodge" }, plus(5))).toEqual({ ok: true });
    const autre = (await lireManche(db, (await etat(juju.id)).maMancheId!, juju.id, plus(5)))!;
    expect(autre.resteS).toBe(0);
  });

  it("sans Contestation, on ne peut pas contester", async () => {
    const { db, code, juju, lea, etat } = await unSalonPersonnalise({ contestation: false, choixLettre: "hote" }, { lettre: "C" });
    await terminerManche(db, (await etat(lea.id)).maMancheId!, lea.id, { Prénom: "Camille" }, plus(5));
    await cloturerManche(db, juge, code, plus(200));
    const vue = (await decouverte(db, code, juju.id))!;
    expect(vue.contestation).toBe(false);
    const reponse = vue.categories.find((c) => c.categorie === "Prénom")!.reponses.find((r) => r.pseudo === "Léa")!;
    expect(await contester(db, code, reponse.id, juju.id)).toEqual({ ok: false, erreur: "La contestation est désactivée pour cette partie." });
  });

  it("la Lettre est choisie par l'Hôte à chaque Manche", async () => {
    const { db, code, juju, etat } = await unSalonPersonnalise({ choixLettre: "hote" }, { lettre: "P" });
    expect((await lireManche(db, (await etat(juju.id)).maMancheId!, juju.id))!.lettre).toBe("P");
    await cloturerManche(db, juge, code, plus(200));
    expect(await mancheSuivanteSalon(db, code, juju.id, { maintenant: plus(210), lettre: "T" })).toEqual({ ok: true });
    expect((await lireManche(db, (await etat(juju.id)).maMancheId!, juju.id))!.lettre).toBe("T");
  });

  it("la Lettre est choisie par le dernier de la Manche précédente", async () => {
    const { db, code, juju, lea, etat } = await unSalonPersonnalise({ choixLettre: "dernier", lettres: ["B", "C", "M", "P", "T"] });
    const lettre1 = (await lireManche(db, (await etat(lea.id)).maMancheId!, lea.id))!.lettre;
    const bonne = { B: "Bernard", C: "Camille", M: "Marie", P: "Paul", T: "Thomas" }[lettre1]!;
    await terminerManche(db, (await etat(juju.id)).maMancheId!, juju.id, { Prénom: bonne }, plus(5));
    await cloturerManche(db, juge, code, plus(200));
    expect((await etat(lea.id)).choixLettre).toMatchObject({ par: "Léa", moi: true });
    expect((await choisirLettreSuivante(db, code, juju.id, "M")).ok).toBe(false);
    const libre = ["B", "C", "M", "P", "T"].find((l) => l !== lettre1)!;
    expect(await choisirLettreSuivante(db, code, lea.id, libre)).toEqual({ ok: true });
    await mancheSuivanteSalon(db, code, juju.id, { maintenant: plus(210) });
    expect((await lireManche(db, (await etat(lea.id)).maMancheId!, lea.id))!.lettre).toBe(libre);
  });

  it("« le premier à X points » termine la Partie quand un Joueur l'atteint", async () => {
    const { db, code, juju, lea, etat } = await unSalonPersonnalise({ manches: { mode: "points", objectif: 10 }, choixLettre: "hote" }, { lettre: "C" });
    await terminerManche(db, (await etat(lea.id)).maMancheId!, lea.id, { Prénom: "Camille", Pays: "Cambodge", Animal: "Chacal", "Fruit ou légume": "Clémentine" }, plus(5));
    await cloturerManche(db, juge, code, plus(200));
    expect((await etat(juju.id)).partie.etat).toBe("terminee");
  });
});
