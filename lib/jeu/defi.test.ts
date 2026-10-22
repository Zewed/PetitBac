import { describe, expect, it } from "vitest";
import { choisirPseudo } from "./joueurs";
import { commencerDefi, defiDuJour, DUREE_DEFI_S, monDefi } from "./defi";
import { lireManche, terminerManche } from "./manches";
import { CATALOGUE } from "./packs";
import { unJoueur } from "./test-outils";

// Jeudi 22 octobre 2026, 20 h à Paris (heure d'été, UTC+2).
const JOUR_1 = new Date("2026-10-22T18:00:00.000Z");
const a = (iso: string) => new Date(iso);

async function deuxJoueurs() {
  const { db, joueur } = await unJoueur();
  const autre = await choisirPseudo(db, "Léa");
  if (!autre.ok) throw new Error(autre.erreur);
  return { db, juju: joueur, lea: autre.joueur };
}

describe("L'accueil montre le Défi du jour", () => {
  it("avec son numéro, le même toute la journée", async () => {
    const { db } = await unJoueur();
    const matin = await defiDuJour(db, a("2026-10-22T06:00:00.000Z"));
    const soir = await defiDuJour(db, JOUR_1);
    expect(matin.numero).toBe(1);
    expect(soir).toEqual(matin);
  });
});

describe("Le Défi est le même pour tous", () => {
  it("12 Catégories tirées dans le Catalogue et la même Lettre pour tous les Joueurs ce jour-là", async () => {
    const { db, juju, lea } = await deuxJoueurs();
    const m1 = await commencerDefi(db, juju.id, JOUR_1);
    const m2 = await commencerDefi(db, lea.id, a("2026-10-22T19:30:00.000Z"));
    expect(m1.categories).toHaveLength(12);
    for (const c of m1.categories) expect(CATALOGUE).toContain(c);
    expect(m2.lettre).toBe(m1.lettre);
    expect(m2.categories).toEqual(m1.categories);
    expect(["K", "Q", "W", "X", "Y", "Z"]).not.toContain(m1.lettre);
  });
});

describe("Le chrono du Défi", () => {
  it("dure 3 minutes, et « J'ai fini » arrête la Manche avant", async () => {
    const { db, joueur } = await unJoueur();
    const m = await commencerDefi(db, joueur.id, JOUR_1);
    expect(DUREE_DEFI_S).toBe(180);
    expect(m.finitLe.getTime() - JOUR_1.getTime()).toBe(180_000);
    await terminerManche(db, m.id, joueur.id, {}, a("2026-10-22T18:01:00.000Z"));
    expect((await lireManche(db, m.id, joueur.id))?.etat).not.toBe("en_cours");
  });
});

describe("Un seul essai par jour", () => {
  it("une fois le Défi fait, le Joueur ne peut pas le refaire : il retrouve son résultat", async () => {
    const { db, joueur } = await unJoueur();
    const m = await commencerDefi(db, joueur.id, JOUR_1);
    await terminerManche(db, m.id, joueur.id, {}, a("2026-10-22T18:01:00.000Z"));
    const encore = await commencerDefi(db, joueur.id, a("2026-10-22T18:30:00.000Z"));
    expect(encore.id).toBe(m.id);
    expect((await monDefi(db, joueur.id, a("2026-10-22T18:31:00.000Z")))?.mancheId).toBe(m.id);
  });

  it("recharger pendant le Défi ne donne pas un deuxième essai et ne remet pas le chrono à zéro", async () => {
    const { db, joueur } = await unJoueur();
    const m = await commencerDefi(db, joueur.id, JOUR_1);
    const encore = await commencerDefi(db, joueur.id, a("2026-10-22T18:01:00.000Z"));
    expect(encore.id).toBe(m.id);
    expect(encore.finitLe).toEqual(m.finitLe);
  });
});

describe("À minuit, heure de Paris", () => {
  it("un nouveau Défi apparaît avec le numéro suivant ; le n°1 est celui du jour du lancement", async () => {
    const { db } = await unJoueur();
    const veille = await defiDuJour(db, a("2026-10-22T21:59:00.000Z")); // 23 h 59 à Paris
    const lendemain = await defiDuJour(db, a("2026-10-22T22:00:00.000Z")); // minuit à Paris
    expect(veille.numero).toBe(1);
    expect(lendemain.numero).toBe(2);
    expect(lendemain.date).toBe("2026-10-23");
    const dans3Jours = await defiDuJour(db, a("2026-10-25T10:00:00.000Z"));
    expect(dans3Jours.numero).toBe(4);
  });
});
