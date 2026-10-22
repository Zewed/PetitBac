import { describe, expect, it } from "vitest";
import { choisirPseudo } from "./joueurs";
import { enregistrerRegle, mesRegles, regleDuJoueur, resumeReglages } from "./regles";
import { REGLAGES_PAR_DEFAUT, type Reglages } from "./reglages";
import { unJoueur } from "./test-outils";

const perso: Reglages = {
  ...REGLAGES_PAR_DEFAUT,
  manches: { mode: "nombre", n: 3 },
  dureeS: 120,
  stop: { actif: false, des: "complete", graceS: 10 },
  categories: { mode: "packs", packs: ["cinema", "sport-jeux"], nombre: 8 },
};

describe("« Mes règles »", () => {
  it("sans règle enregistrée, la liste est vide", async () => {
    const { db, joueur } = await unJoueur();
    expect(await mesRegles(db, joueur.id)).toEqual([]);
  });

  it("le Joueur enregistre ses Réglages sous un nom, et les retrouve", async () => {
    const { db, joueur } = await unJoueur();
    expect(await enregistrerRegle(db, joueur.id, "  Ciné du dimanche ", perso, { salon: true })).toEqual({ ok: true });
    const [regle] = await mesRegles(db, joueur.id);
    expect(regle).toMatchObject({ nom: "Ciné du dimanche", resume: "3 manches · 2 min · 8 catégories · sans STOP" });
    expect(await regleDuJoueur(db, joueur.id, regle.id, { salon: true })).toEqual(perso);
  });

  it("un nom déjà pris remplace la règle au lieu d'en faire une deuxième", async () => {
    const { db, joueur } = await unJoueur();
    await enregistrerRegle(db, joueur.id, "Rapide", perso, { salon: true });
    await enregistrerRegle(db, joueur.id, "rapide", { ...perso, dureeS: 45 }, { salon: true });
    const regles = await mesRegles(db, joueur.id);
    expect(regles).toHaveLength(1);
    expect((await regleDuJoueur(db, joueur.id, regles[0].id, { salon: true }))?.dureeS).toBe(45);
  });

  it("refuse un nom vide ou trop long", async () => {
    const { db, joueur } = await unJoueur();
    expect(await enregistrerRegle(db, joueur.id, "   ", perso, { salon: false })).toEqual({ ok: false, erreur: "Donne un nom à tes règles." });
    expect((await enregistrerRegle(db, joueur.id, "x".repeat(31), perso, { salon: false })).ok).toBe(false);
  });

  it("reste au Joueur : un autre ne la voit pas et ne peut pas la lancer", async () => {
    const { db, joueur } = await unJoueur();
    await enregistrerRegle(db, joueur.id, "À moi", perso, { salon: false });
    const autre = await choisirPseudo(db, "Léa");
    if (!autre.ok) throw new Error();
    expect(await mesRegles(db, autre.joueur.id)).toEqual([]);
    const [regle] = await mesRegles(db, joueur.id);
    expect(await regleDuJoueur(db, autre.joueur.id, regle.id, { salon: false })).toBeUndefined();
  });

  it("enregistrée en Partie libre, elle garde le STOP et la Contestation par défaut dans un Salon", async () => {
    const { db, joueur } = await unJoueur();
    const solo: Reglages = { ...perso, stop: { actif: false, des: "complete", graceS: 10 }, contestation: false, dureeS: null };
    await enregistrerRegle(db, joueur.id, "Seul", solo, { salon: false });
    const [regle] = await mesRegles(db, joueur.id);
    expect(await regleDuJoueur(db, joueur.id, regle.id, { salon: true })).toMatchObject({ stop: { actif: true, des: "complete", graceS: 10 }, contestation: true });
  });

  it("se résume en une ligne", () => {
    expect(resumeReglages({ ...perso, manches: { mode: "points", objectif: 100 }, dureeS: null, stop: REGLAGES_PAR_DEFAUT.stop })).toBe("premier à 100 pts · sans limite · 8 catégories");
  });
});
