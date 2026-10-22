import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses, lireManche } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { direStop, TEMPS_DE_GRACE_S } from "./stop";
import { T0, plus, unJoueur } from "./test-outils";

async function unSalonEnJeu() {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "express");
  const autres = [];
  for (const p of ["Léa", "Hugo"]) {
    const r = await choisirPseudo(db, p);
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    autres.push(r.joueur);
  }
  await lancerPartieSalon(db, salon.code, juju.id, "express", { maintenant: T0, aleatoire: () => 0 });
  return { db, code: salon.code, juju, lea: autres[0], hugo: autres[1] };
}

async function grille(db: Db, code: string, joueurId: string, t: Date) {
  const etat = await etatPartieSalon(db, code, joueurId, t);
  return (await lireManche(db, etat!.maMancheId!, joueurId, t))!;
}

const remplie = (categories: string[]) => Object.fromEntries(categories.map((c) => [c, `A${c}`]));

describe("Le STOP", () => {
  it("reste inactif tant que la Grille n'est pas complète, et dit combien de cases il manque", async () => {
    const { db, code, lea } = await unSalonEnJeu();
    const g = await grille(db, code, lea.id, plus(5));
    const deux = Object.fromEntries(g.categories.slice(0, 2).map((c) => [c, "Abc"]));
    expect(await direStop(db, g.id, lea.id, deux, plus(10))).toEqual({ ok: false, erreur: "Encore 2 cases à remplir pour dire STOP." });
  });

  it("Grille complète : le STOP compte, tout le Salon voit qui l'a dit", async () => {
    const { db, code, juju, lea } = await unSalonEnJeu();
    const g = await grille(db, code, lea.id, plus(5));
    expect(await direStop(db, g.id, lea.id, remplie(g.categories), plus(10))).toEqual({ ok: true });
    expect((await etatPartieSalon(db, code, juju.id, plus(11)))?.manche.stopPar).toBe("Léa");
  });

  it(`les autres ont ${TEMPS_DE_GRACE_S} secondes de Temps de grâce, puis leur Grille se ferme`, async () => {
    const { db, code, lea, hugo } = await unSalonEnJeu();
    const g = await grille(db, code, lea.id, plus(5));
    await direStop(db, g.id, lea.id, remplie(g.categories), plus(10));
    const h = await grille(db, code, hugo.id, plus(11));
    expect(h.finitLe.getTime()).toBe(plus(10 + TEMPS_DE_GRACE_S).getTime());
    expect((await lireManche(db, g.id, lea.id, plus(11)))?.etat).not.toBe("en_cours");
    expect((await enregistrerReponses(db, h.id, hugo.id, { [h.categories[0]]: "Avion" }, plus(15))).ok).toBe(true);
    expect((await enregistrerReponses(db, h.id, hugo.id, { [h.categories[0]]: "Abeille" }, plus(25))).ok).toBe(false);
    await cloturerManche(db, new FakeJuge(), code, plus(25));
    expect((await grille(db, code, hugo.id, plus(26))).etat).toBe("jugee");
  });

  it("si deux Joueurs disent STOP presque en même temps, un seul STOP compte", async () => {
    const { db, code, juju, lea, hugo } = await unSalonEnJeu();
    const gl = await grille(db, code, lea.id, plus(5));
    const gh = await grille(db, code, hugo.id, plus(5));
    const [a, b] = await Promise.all([
      direStop(db, gl.id, lea.id, remplie(gl.categories), plus(10)),
      direStop(db, gh.id, hugo.id, remplie(gh.categories), plus(10)),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const perdant = a.ok ? b : a;
    expect(perdant).toMatchObject({ ok: false });
    const gj = await grille(db, code, juju.id, plus(12));
    expect(gj.finitLe.getTime()).toBe(plus(10 + TEMPS_DE_GRACE_S).getTime());
  });

  it("dire STOP ne rapporte aucun point de plus", async () => {
    const { db, code, lea, hugo } = await unSalonEnJeu();
    const gl = await grille(db, code, lea.id, plus(5));
    const gh = await grille(db, code, hugo.id, plus(5));
    await enregistrerReponses(db, gh.id, hugo.id, remplie(gh.categories), plus(6));
    await direStop(db, gl.id, lea.id, remplie(gl.categories), plus(10));
    await cloturerManche(db, new FakeJuge(), code, plus(30));
    const [tl, th] = [(await grille(db, code, lea.id, plus(31))).total, (await grille(db, code, hugo.id, plus(31))).total];
    expect(tl).toBe(th);
  });
});

describe("Après un STOP", () => {
  it("le chrono affiche toujours sa durée d'origine, seule l'heure de fin avance", async () => {
    const { db, code, lea, hugo } = await unSalonEnJeu();
    const g = await grille(db, code, lea.id, plus(5));
    await direStop(db, g.id, lea.id, remplie(g.categories), plus(10));
    const h = await grille(db, code, hugo.id, plus(11));
    expect(h.dureeS).toBe(45);
    expect(h.resteS).toBe(TEMPS_DE_GRACE_S - 1);
  });
});
