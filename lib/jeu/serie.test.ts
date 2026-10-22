import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { commencerDefi } from "./defi";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { terminerManche } from "./manches";
import { dernierResultat, serie, texteDePartage } from "./serie";
import { unJoueur } from "./test-outils";

// Le jour n à 20 h à Paris (heure d'été jusqu'au 25 octobre 2026).
const jour = (n: number) => new Date(Date.UTC(2026, 9, 21 + n, 18, 0, 0));

async function faireLeDefi(db: Db, joueurId: string, n: number, saisies: Record<string, string> = {}) {
  const m = await commencerDefi(db, joueurId, jour(n));
  await terminerManche(db, m.id, joueurId, saisies, new Date(jour(n).getTime() + 60_000));
  await jugerManche(db, new FakeJuge(), m.id, joueurId);
  return m;
}

describe("Partager son résultat", () => {
  it("donne le numéro du Défi, la Lettre, une case par Palier obtenu et le total, sans les Réponses", () => {
    const texte = texteDePartage({
      numero: 22,
      lettre: "M",
      total: 26,
      cases: ["Banal", "Courant", "Rare", "Très rare", "Légendaire", null, "Rare", null, null, null, null, null],
    });
    expect(texte).toBe(["Petit Bac · Défi n°22 · Lettre M", "🟨🟩🟦🟧🟪⬜", "🟦⬜⬜⬜⬜⬜", "26 pts"].join("\n"));
  });

  it("le dernier résultat du Joueur porte les Paliers de ses 12 cases, sans ses Réponses", async () => {
    const { db, joueur } = await unJoueur();
    expect(await dernierResultat(db, joueur.id, jour(1))).toBeNull();
    const m = await faireLeDefi(db, joueur.id, 1);
    const r = await dernierResultat(db, joueur.id, jour(1));
    expect(r).toMatchObject({ numero: 1, lettre: m.lettre, total: 0 });
    expect(r!.cases).toHaveLength(12);
    expect(JSON.stringify(r)).not.toContain("saisie");
  });
});

describe("La Série", () => {
  it("augmente de 1 chaque jour où le Joueur fait le Défi", async () => {
    const { db, joueur } = await unJoueur();
    await faireLeDefi(db, joueur.id, 1);
    expect(await serie(db, joueur.id, jour(1))).toEqual({ jours: 1, enJeu: false });
    await faireLeDefi(db, joueur.id, 2);
    expect(await serie(db, joueur.id, jour(2))).toEqual({ jours: 2, enJeu: false });
  });

  it("tient encore le jour suivant tant que le Défi du jour n'est pas fait, puis retombe à 0 si on saute un jour", async () => {
    const { db, joueur } = await unJoueur();
    await faireLeDefi(db, joueur.id, 1);
    await faireLeDefi(db, joueur.id, 2);
    expect(await serie(db, joueur.id, jour(3))).toEqual({ jours: 2, enJeu: true });
    expect(await serie(db, joueur.id, jour(4))).toEqual({ jours: 0, enJeu: false });
  });

  it("la première fois, sans Série, elle vaut 0", async () => {
    const { db, joueur } = await unJoueur();
    expect(await serie(db, joueur.id, jour(1))).toEqual({ jours: 0, enJeu: false });
  });
});
