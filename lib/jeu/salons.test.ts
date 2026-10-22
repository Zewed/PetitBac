import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { choisirPseudo } from "./joueurs";
import { codeDepuisSaisie, creerSalon, lireSalon, MAX_JOUEURS_SALON, rejoindreSalon } from "./salons";
import { unJoueur } from "./test-outils";

async function nouveau(db: Db, pseudo: string) {
  const r = await choisirPseudo(db, pseudo);
  if (!r.ok) throw new Error(r.erreur);
  return r.joueur;
}

describe("L'Hôte crée un Salon", () => {
  it("le Salon a un code court et un lien, et l'Hôte y est déjà", async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    expect(salon.code).toMatch(/^[A-Z2-9]{6}$/);
    const vu = await lireSalon(db, salon.code, joueur.id);
    expect(vu?.joueurs).toEqual([{ pseudo: "Juju", poste: expect.any(String), hote: true, moi: true, absent: false }]);
  });

  it("seul dans son Salon, l'Hôte voit qu'il attend au moins un autre Joueur", async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    expect((await lireSalon(db, salon.code, joueur.id))?.enAttente).toBe(true);
  });
});

describe("Un ami rejoint le Salon par le lien ou le code", () => {
  it("il entre dans le Salon et tous voient la liste des présents, avec l'Hôte marqué", async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    const lea = await nouveau(db, "Léa");
    expect(await rejoindreSalon(db, salon.code, lea.id)).toEqual({ ok: true, code: salon.code });
    expect((await lireSalon(db, salon.code, joueur.id))?.joueurs).toEqual([
      { pseudo: "Juju", poste: expect.any(String), hote: true, moi: true, absent: false },
      { pseudo: "Léa", poste: expect.any(String), hote: false, moi: false, absent: false },
    ]);
    expect((await lireSalon(db, salon.code, lea.id))?.enAttente).toBe(false);
  });

  it("rejoindre deux fois ne compte qu'une fois", async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    expect(await rejoindreSalon(db, salon.code, joueur.id)).toEqual({ ok: true, code: salon.code });
    expect((await lireSalon(db, salon.code, joueur.id))?.joueurs).toHaveLength(1);
  });

  it.each([
    ["le code tel quel", (c: string) => c],
    ["en minuscules avec des espaces", (c: string) => ` ${c.toLowerCase().slice(0, 3)} ${c.toLowerCase().slice(3)} `],
    ["le lien complet", (c: string) => `https://petitbac.app/salon/${c}`],
  ])("le code se reconnaît depuis %s", async (_, saisie) => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    expect(codeDepuisSaisie(saisie(salon.code))).toBe(salon.code);
  });

  it(`un ${MAX_JOUEURS_SALON + 1}e Joueur ne peut pas entrer : le Salon est plein`, async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    for (let i = 2; i <= MAX_JOUEURS_SALON; i++) await rejoindreSalon(db, salon.code, (await nouveau(db, `Ami ${i}`)).id);
    const onzieme = await nouveau(db, "Onzième");
    expect(await rejoindreSalon(db, salon.code, onzieme.id)).toEqual({ ok: false, erreur: "Ce salon est plein : 10 joueurs au maximum." });
  });

  it("un code qui n'existe pas dit de vérifier le code", async () => {
    const { db, joueur } = await unJoueur();
    expect(await rejoindreSalon(db, "ZZZZZZ", joueur.id)).toEqual({ ok: false, erreur: "Aucun salon avec ce code. Vérifie-le auprès de celui qui t'a invité." });
  });

  it("un Joueur hors du Salon ne voit pas qui est dedans", async () => {
    const { db, joueur } = await unJoueur();
    const salon = await creerSalon(db, joueur.id, "classique");
    const curieux = await nouveau(db, "Curieux");
    expect(await lireSalon(db, salon.code, curieux.id)).toBeUndefined();
  });
});
