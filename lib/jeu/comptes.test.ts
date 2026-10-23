import { describe, expect, it } from "vitest";
import { choisirPseudo } from "./joueurs";
import { enregistrerRegle, mesRegles } from "./regles";
import { compteDuJoueur, pseudoPropose, rattacherCompte } from "./comptes";
import { REGLAGES_PAR_DEFAUT } from "./reglages";
import { T0, plus, unJoueur } from "./test-outils";

describe("Créer un Compte", () => {
  it("le Joueur qui crée un Compte garde ce qu'il avait sur l'appareil : c'est le même Joueur, rattaché", async () => {
    const { db, joueur } = await unJoueur();
    await enregistrerRegle(db, joueur.id, "Ciné", REGLAGES_PAR_DEFAUT, { salon: false });
    const r = await rattacherCompte(db, { compteId: "compte-1", joueurAppareilId: joueur.id, pseudo: "Juju", quinzeAns: true }, T0);
    expect(r).toEqual({ joueur: { id: joueur.id, pseudo: "Juju" }, nouveau: true });
    expect(await compteDuJoueur(db, joueur.id)).toEqual({ compteId: "compte-1", quinzeAnsConfirmeLe: T0 });
    expect((await mesRegles(db, joueur.id)).map((x) => x.nom)).toEqual(["Ciné"]);
  });

  it("connecté sur un autre appareil, il retrouve le Joueur de son Compte (Série, records, Mes règles)", async () => {
    const { db, joueur } = await unJoueur();
    await rattacherCompte(db, { compteId: "compte-1", joueurAppareilId: joueur.id, pseudo: "Juju", quinzeAns: true }, T0);
    const autreAppareil = await choisirPseudo(db, "Invité");
    if (!autreAppareil.ok) throw new Error();
    const r = await rattacherCompte(db, { compteId: "compte-1", joueurAppareilId: autreAppareil.joueur.id, pseudo: "Juju", quinzeAns: false }, plus(60));
    expect(r).toEqual({ joueur: { id: joueur.id, pseudo: "Juju" }, nouveau: false });
  });

  it("sur un appareil neuf, un Compte jamais vu crée son Joueur, avec un pseudo tiré de son nom", async () => {
    const { db } = await unJoueur();
    const r = await rattacherCompte(db, { compteId: "compte-2", joueurAppareilId: null, pseudo: "Léa Martin", quinzeAns: true }, T0);
    if ("erreur" in r) throw new Error(r.erreur);
    expect(r.nouveau).toBe(true);
    expect(r.joueur.pseudo).toBe("Léa Martin");
    expect(await compteDuJoueur(db, r.joueur.id)).toMatchObject({ compteId: "compte-2" });
  });

  it("le Joueur de l'appareil déjà rattaché à un autre Compte n'est pas pris : le nouveau Compte a son propre Joueur", async () => {
    const { db, joueur } = await unJoueur();
    await rattacherCompte(db, { compteId: "compte-1", joueurAppareilId: joueur.id, pseudo: "Juju", quinzeAns: true }, T0);
    const r = await rattacherCompte(db, { compteId: "compte-3", joueurAppareilId: joueur.id, pseudo: "Hugo", quinzeAns: true }, plus(10));
    if ("erreur" in r) throw new Error(r.erreur);
    expect(r.joueur.id).not.toBe(joueur.id);
    expect(r.joueur.pseudo).toBe("Hugo");
  });

  it("sans confirmer avoir 15 ans ou plus, pas de nouveau Compte", async () => {
    const { db, joueur } = await unJoueur();
    expect(await rattacherCompte(db, { compteId: "compte-4", joueurAppareilId: joueur.id, pseudo: "Juju", quinzeAns: false }, T0)).toEqual({
      erreur: "Le compte est réservé aux 15 ans et plus. Tu peux continuer à jouer sans compte.",
    });
    expect(await compteDuJoueur(db, joueur.id)).toEqual({ compteId: null, quinzeAnsConfirmeLe: null });
  });
});

describe("Le pseudo proposé pour un Compte sans Joueur", () => {
  it("vient du nom, sinon du début de l'adresse, et reste un pseudo valide", () => {
    expect(pseudoPropose("Léa Martin", "lea@example.com")).toBe("Léa Martin");
    expect(pseudoPropose("", "hugo.durand@example.com")).toBe("hugo durand");
    expect(pseudoPropose("Un nom beaucoup trop long pour un pseudo", "x@example.com")).toBe("Un nom beaucoup trop");
    expect(pseudoPropose("connard", "connard@example.com")).toBe("Joueur");
  });
});
