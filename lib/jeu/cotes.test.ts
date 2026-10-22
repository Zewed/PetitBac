import { describe, expect, it } from "vitest";
import { cotes } from "@/db/schema";
import type { Db } from "@/db/types";
import { recalculerCotes, SEUIL_COUPLE_JOUE } from "./cotes";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { choisirPseudo } from "./joueurs";
import { lireManche } from "./manches";
import { unJoueur, uneMancheEn } from "./test-outils";

/** Un nouveau Joueur joue une Manche en C et donne cette Réponse en Animal ; on rend son Palier. */
let numero = 0;
async function unJoueurDonne(db: Db, saisie: string) {
  const r = await choisirPseudo(db, `Joueur ${++numero}`);
  if (!r.ok) throw new Error(r.erreur);
  const m = await uneMancheEn("C", { Animal: saisie }, { db, joueur: r.joueur });
  await jugerManche(db, new FakeJuge(), m.id, r.joueur.id);
  return (await lireManche(db, m.id, r.joueur.id))!.reponses.find((x) => x.categorie === "Animal")!;
}

async function unePopulation(db: Db, chiens: number, autres: number) {
  for (let i = 0; i < chiens; i++) await unJoueurDonne(db, "chien");
  for (let i = 0; i < autres; i++) await unJoueurDonne(db, "chat");
}

describe("Les Paliers suivent les Réponses des Joueurs, recalculés chaque nuit", () => {
  it("pendant la journée, une même Réponse garde le même Palier pour tous les Joueurs", async () => {
    const { db } = await unJoueur();
    const premier = await unJoueurDonne(db, "chien");
    await unePopulation(db, SEUIL_COUPLE_JOUE, 0);
    expect((await unJoueurDonne(db, "chien")).palier).toBe(premier.palier);
  });

  it("après une journée où beaucoup ont donné « chien » en Animal + C, « chien » est Banal le lendemain", async () => {
    const { db } = await unJoueur();
    expect((await unJoueurDonne(db, "chien")).palier).not.toBe("Banal");
    await unePopulation(db, SEUIL_COUPLE_JOUE, 5);
    await recalculerCotes(db);
    expect(await unJoueurDonne(db, "chien")).toMatchObject({ palier: "Banal", points: 1 });
  });

  it("une Réponse jamais donnée est Légendaire, une fois le couple assez joué", async () => {
    const { db } = await unJoueur();
    await unePopulation(db, SEUIL_COUPLE_JOUE, 0);
    await recalculerCotes(db);
    expect(await unJoueurDonne(db, "cheval")).toMatchObject({ palier: "Légendaire", points: 12 });
  });

  it("un couple Catégorie + Lettre peu joué garde sa Cote de démarrage", async () => {
    const { db } = await unJoueur();
    const avant = await unJoueurDonne(db, "chien");
    await unePopulation(db, 3, 0);
    await recalculerCotes(db);
    expect((await unJoueurDonne(db, "chien")).palier).toBe(avant.palier);
  });

  it("si le recalcul de la nuit échoue, les Paliers de la veille restent en place et le jeu continue", async () => {
    const { db } = await unJoueur();
    const avant = await unJoueurDonne(db, "chien");
    await unePopulation(db, SEUIL_COUPLE_JOUE, 5);
    const coupure = async (tx: Db) => {
      await tx.delete(cotes); // la moitié du travail est faite quand ça casse
      throw new Error("coupure");
    };
    await expect(recalculerCotes(db, { ecrire: coupure })).rejects.toThrow("coupure");
    expect((await unJoueurDonne(db, "chien")).palier).toBe(avant.palier);
  });
});
