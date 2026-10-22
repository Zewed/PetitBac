import { describe, expect, it } from "vitest";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses, lireManche } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon, mancheSuivanteSalon } from "./partie-salon";
import { ABSENT_APRES_S, marquerPresent, partieEnCoursDuJoueur, quitterSalon, RELEVE_HOTE_APRES_S } from "./presence";
import { creerSalon, lireSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur } from "./test-outils";

async function nouveau(db: Parameters<typeof choisirPseudo>[0], pseudo: string) {
  const r = await choisirPseudo(db, pseudo);
  if (!r.ok) throw new Error(r.erreur);
  return r.joueur;
}

async function unSalonEnJeu() {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "express");
  const lea = await nouveau(db, "Léa");
  await rejoindreSalon(db, salon.code, lea.id);
  await lancerPartieSalon(db, salon.code, juju.id, "express", { maintenant: T0 });
  return { db, code: salon.code, juju, lea };
}

describe("Un Joueur qui arrive pendant une Manche", () => {
  it("la regarde sans jouer, et joue dès la Manche suivante", async () => {
    const { db, code, juju } = await unSalonEnJeu();
    const hugo = await nouveau(db, "Hugo");
    await rejoindreSalon(db, code, hugo.id);
    const pendant = await etatPartieSalon(db, code, hugo.id, plus(10));
    expect(pendant?.maMancheId).toBeNull();
    expect(pendant?.manche.numero).toBe(1);
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    await mancheSuivanteSalon(db, code, juju.id, { maintenant: plus(70) });
    expect((await etatPartieSalon(db, code, hugo.id, plus(71)))?.maMancheId).not.toBeNull();
  });
});

describe("Un Joueur qui perd la connexion", () => {
  it("revient au même endroit, avec sa Grille, depuis le même appareil", async () => {
    const { db, code, lea } = await unSalonEnJeu();
    const e = await etatPartieSalon(db, code, lea.id, plus(5));
    const m = await lireManche(db, e!.maMancheId!, lea.id, plus(5));
    await enregistrerReponses(db, m!.id, lea.id, { [m!.categories[0]]: "Avant la coupure" }, plus(8));
    const retour = await etatPartieSalon(db, code, lea.id, plus(30));
    expect(retour?.maMancheId).toBe(m!.id);
    expect((await lireManche(db, m!.id, lea.id, plus(30)))!.reponses[0].saisie).toBe("Avant la coupure");
  });

  it(`apparaît absent aux autres après ${ABSENT_APRES_S} s sans nouvelles, sans bloquer la Manche`, async () => {
    const { db, code, juju, lea } = await unSalonEnJeu();
    await marquerPresent(db, code, juju.id, plus(30));
    await marquerPresent(db, code, lea.id, plus(10));
    const vu = await lireSalon(db, code, juju.id, plus(30));
    expect(vu?.joueurs.find((j) => j.pseudo === "Léa")?.absent).toBe(true);
    expect(vu?.joueurs.find((j) => j.pseudo === "Juju")?.absent).toBe(false);
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    expect((await etatPartieSalon(db, code, juju.id, plus(61)))?.manche.close).toBe(true);
  });
});

describe("L'accueil d'un Joueur qui a une Partie en cours", () => {
  it("propose « Reprendre » avec le Salon et la Manche", async () => {
    const { db, code, lea } = await unSalonEnJeu();
    expect(await partieEnCoursDuJoueur(db, lea.id)).toMatchObject({ code, hote: "Juju", numero: 1, nbManches: 3 });
  });

  it("ne propose rien sans Partie en cours", async () => {
    const { db, joueur } = await unJoueur();
    expect(await partieEnCoursDuJoueur(db, joueur.id)).toBeNull();
  });
});

describe("Si l'Hôte s'en va", () => {
  it("quand il quitte le Salon, un autre Joueur devient Hôte, et tout le Salon le voit", async () => {
    const { db, code, juju, lea } = await unSalonEnJeu();
    await quitterSalon(db, code, juju.id);
    const vu = await lireSalon(db, code, lea.id);
    expect(vu?.joueurs).toEqual([expect.objectContaining({ pseudo: "Léa", hote: true, moi: true })]);
    expect(vu?.jeSuisHote).toBe(true);
    expect(await lireSalon(db, code, juju.id)).toBeUndefined();
  });

  it(`quand il ne donne plus de nouvelles depuis ${RELEVE_HOTE_APRES_S} s, le suivant prend la relève`, async () => {
    const { db, code, juju, lea } = await unSalonEnJeu();
    await marquerPresent(db, code, juju.id, plus(5));
    await marquerPresent(db, code, lea.id, plus(5 + RELEVE_HOTE_APRES_S + 1));
    expect((await lireSalon(db, code, lea.id, plus(5 + RELEVE_HOTE_APRES_S + 1)))?.jeSuisHote).toBe(true);
  });
});
