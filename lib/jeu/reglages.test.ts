import { describe, expect, it } from "vitest";
import { LETTRES_EXCLUES_PAR_DEFAUT } from "./lettres";
import { lireReglages, REGLAGES_PAR_DEFAUT } from "./reglages";

function formulaire(champs: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) for (const x of [v].flat()) f.append(k, x);
  return f;
}

const TOUTES_SAUF_RARES = "ABCDEFGHIJLMNOPRSTUV".split("");
const base = { manches_mode: "nombre", nb_manches: "3", lettres: TOUTES_SAUF_RARES, choix_lettre: "hasard", duree: "120", grace: "10", stop_des: "complete" };

describe("Les Réglages d'une Partie Personnalisée", () => {
  it("par défaut, K, Q, W, X, Y et Z sont décochées", () => {
    expect(REGLAGES_PAR_DEFAUT.lettres.some((l) => LETTRES_EXCLUES_PAR_DEFAUT.includes(l))).toBe(false);
    expect(REGLAGES_PAR_DEFAUT.lettres).toHaveLength(20);
  });

  it("« 3 manches de 2 minutes, sans STOP » dans un Salon", () => {
    const r = lireReglages(formulaire({ ...base, contestation: "on" }), { salon: true });
    expect(r).toEqual({
      ok: true,
      reglages: {
        manches: { mode: "nombre", n: 3 },
        lettres: TOUTES_SAUF_RARES,
        choixLettre: "hasard",
        dureeS: 120,
        stop: { actif: false, des: "complete", graceS: 10 },
        contestation: true,
        categories: { mode: "main", liste: ["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"] },
      },
    });
  });

  it("les Manches vont de 1 à 20, ou « le premier à X points gagne »", () => {
    expect(lireReglages(formulaire({ ...base, nb_manches: "21" }), { salon: false }).ok).toBe(false);
    expect(lireReglages(formulaire({ ...base, nb_manches: "0" }), { salon: false }).ok).toBe(false);
    const r = lireReglages(formulaire({ ...base, manches_mode: "points", objectif: "100" }), { salon: false });
    expect(r.ok && r.reglages.manches).toEqual({ mode: "points", objectif: 100 });
  });

  it("le chrono va de 30 s à 10 min, ou sans limite", () => {
    expect(lireReglages(formulaire({ ...base, duree: "20" }), { salon: false }).ok).toBe(false);
    expect(lireReglages(formulaire({ ...base, duree: "601" }), { salon: false }).ok).toBe(false);
    const r = lireReglages(formulaire({ ...base, duree: "sans" }), { salon: false });
    expect(r.ok && r.reglages.dureeS).toBeNull();
  });

  it("dans un Salon, une Manche sans limite a besoin du STOP pour finir", () => {
    expect(lireReglages(formulaire({ ...base, duree: "sans" }), { salon: true })).toEqual({ ok: false, erreur: "Sans limite de temps, il faut le STOP pour finir une manche." });
    expect(lireReglages(formulaire({ ...base, duree: "sans", stop: "on" }), { salon: true }).ok).toBe(true);
  });

  it("le STOP est possible dès N cases remplies, avec un Temps de grâce de 0 à 30 s", () => {
    const r = lireReglages(formulaire({ ...base, stop: "on", stop_des: "cases", stop_cases: "4", grace: "0" }), { salon: true });
    expect(r.ok && r.reglages.stop).toEqual({ actif: true, des: 4, graceS: 0 });
    expect(lireReglages(formulaire({ ...base, stop: "on", grace: "31" }), { salon: true }).ok).toBe(false);
  });

  it("il faut assez de Lettres pour toutes les Manches, aucune ne revenant deux fois", () => {
    expect(lireReglages(formulaire({ ...base, lettres: ["A", "B"] }), { salon: false })).toEqual({
      ok: false,
      erreur: "Coche au moins 3 lettres : une lettre ne revient pas deux fois dans une partie.",
    });
  });

  it("en Partie libre, ni STOP, ni Contestation, ni Lettre choisie par le dernier", () => {
    const r = lireReglages(formulaire({ ...base, stop: "on", contestation: "on", choix_lettre: "dernier" }), { salon: false });
    expect(r.ok && [r.reglages.stop.actif, r.reglages.contestation, r.reglages.choixLettre]).toEqual([false, false, "hasard"]);
  });
});
