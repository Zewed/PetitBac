import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { manches } from "@/db/schema";
import type { Db } from "@/db/types";
import { positionAuDefi } from "./classement";
import { commencerDefi } from "./defi";
import { choisirPseudo } from "./joueurs";
import { unJoueur } from "./test-outils";

const MIDI = new Date("2026-10-22T10:00:00.000Z");

/** Un Joueur finit le Défi du jour avec ce total, en ce nombre de secondes. */
async function finit(db: Db, pseudo: string, total: number, secondes: number) {
  const r = await choisirPseudo(db, pseudo);
  if (!r.ok) throw new Error(r.erreur);
  const m = await commencerDefi(db, r.joueur.id, MIDI);
  await db
    .update(manches)
    .set({ etat: "jugee", total, termineeLe: new Date(MIDI.getTime() + secondes * 1000) })
    .where(eq(manches.id, m.id));
  return { joueurId: r.joueur.id, numero: m.defiNumero! };
}

describe("Le Joueur voit sa place au classement du Défi du jour", () => {
  it("après son Défi : « mieux que X % des joueurs »", async () => {
    const { db } = await unJoueur();
    const moi = await finit(db, "Juju", 40, 120);
    for (const [i, t] of [10, 20, 30, 50].entries()) await finit(db, `Autre ${i}`, t, 100);
    expect(await positionAuDefi(db, moi.joueurId, moi.numero)).toEqual({ joueurs: 5, mieuxQue: 75 });
  });

  it("la position se met à jour quand d'autres finissent le Défi du même jour", async () => {
    const { db } = await unJoueur();
    const moi = await finit(db, "Juju", 40, 120);
    await finit(db, "Léa", 10, 100);
    expect((await positionAuDefi(db, moi.joueurId, moi.numero))?.mieuxQue).toBe(100);
    await finit(db, "Hugo", 60, 100);
    expect(await positionAuDefi(db, moi.joueurId, moi.numero)).toEqual({ joueurs: 3, mieuxQue: 50 });
  });

  it("à égalité de points, le plus rapide passe devant", async () => {
    const { db } = await unJoueur();
    const rapide = await finit(db, "Rapide", 40, 60);
    const lent = await finit(db, "Lent", 40, 170);
    expect((await positionAuDefi(db, rapide.joueurId, rapide.numero))?.mieuxQue).toBe(100);
    expect((await positionAuDefi(db, lent.joueurId, lent.numero))?.mieuxQue).toBe(0);
  });

  it("le premier Joueur du jour n'a pas de pourcentage : il est seul", async () => {
    const { db } = await unJoueur();
    const moi = await finit(db, "Juju", 40, 120);
    expect(await positionAuDefi(db, moi.joueurId, moi.numero)).toEqual({ joueurs: 1, mieuxQue: null });
  });

  it("sans Défi fait, pas de position", async () => {
    const { db, joueur } = await unJoueur();
    expect(await positionAuDefi(db, joueur.id, 1)).toBeNull();
  });
});
