import { describe, expect, it } from "vitest";
import { ouvrirPglite } from "@/db/pglite";
import { consommer, freine, LIMITES } from "./limites";
import { T0, plus } from "./test-outils";

const appareil = { joueurId: "11111111-1111-4111-8111-111111111111", ip: "203.0.113.7" };

describe("Les limites anti-abus", () => {
  it("un appareil qui envoie des Réponses en rafale est freiné, puis repart à la minute suivante", async () => {
    const db = await ouvrirPglite();
    let acceptes = 0;
    for (let i = 0; i < 20; i++) if (await consommer(db, "reponses", appareil, 12, plus(i))) acceptes++;
    expect(acceptes).toBe(Math.floor(LIMITES.reponses.parAppareil / 12));
    expect(await freine(db, "reponses", appareil, plus(20))).toBe(true);
    expect(await consommer(db, "reponses", appareil, 12, plus(60))).toBe(true);
    expect(await freine(db, "reponses", appareil, plus(61))).toBe(false);
  });

  it("un appareil qui crée trop de Salons en une minute est freiné de la même façon", async () => {
    const db = await ouvrirPglite();
    const resultats = [];
    for (let i = 0; i < 7; i++) resultats.push(await consommer(db, "salons", appareil, 1, plus(i)));
    expect(resultats).toEqual([true, true, true, true, true, false, false]);
    expect(await freine(db, "salons", appareil, plus(10))).toBe(true);
  });

  it("un Joueur qui enchaîne des Manches de Marathon ne rencontre jamais la limite", async () => {
    const db = await ouvrirPglite();
    // 12 Catégories par Manche, une Grille rendue toutes les 15 secondes, ce qui est déjà très rapide.
    for (let i = 0; i < 40; i++) expect(await consommer(db, "reponses", appareil, 12, plus(i * 15))).toBe(true);
  });

  it("une adresse IP partagée par plusieurs appareils a sa propre limite, plus large", async () => {
    const db = await ouvrirPglite();
    const ip = "198.51.100.4";
    let refuse = false;
    for (let i = 0; i < 50 && !refuse; i++) {
      const autre = { joueurId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, ip };
      refuse = !(await consommer(db, "reponses", autre, 12, T0));
    }
    expect(refuse).toBe(true);
  });
});
