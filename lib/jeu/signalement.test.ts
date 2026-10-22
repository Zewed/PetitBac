import { describe, expect, it } from "vitest";
import { commencerDefi } from "./defi";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { choisirPseudo } from "./joueurs";
import { lireManche, terminerManche } from "./manches";
import { signalerDecision, signalementsDeReponses } from "./signalement";
import { T0, plus, uneMancheEn } from "./test-outils";

async function mancheJugee() {
  const { db, joueur, id } = await uneMancheEn("C", { Prénom: "Camille", Pays: "Cambodje", Animal: "Chameau" });
  await jugerManche(db, new FakeJuge(), id, joueur.id);
  const manche = (await lireManche(db, id, joueur.id))!;
  const reponse = (categorie: string) => manche.reponses.find((r) => r.categorie === categorie)!;
  return { db, joueur, id, reponse };
}

describe("Signaler une décision du Juge en solo", () => {
  it("le Joueur signale une de ses Réponses et voit que c'est envoyé ; ses points ne bougent pas", async () => {
    const { db, joueur, id, reponse } = await mancheJugee();
    const avant = (await lireManche(db, id, joueur.id))!.total;
    expect(await signalerDecision(db, reponse("Animal").id, joueur.id)).toEqual({ ok: true, message: "Signalement envoyé : la décision du Juge sera relue." });
    const apres = (await lireManche(db, id, joueur.id))!;
    expect(apres.reponses.find((r) => r.categorie === "Animal")?.signalee).toBe(true);
    expect(apres.total).toBe(avant);
    expect((await signalementsDeReponses(db)).map((s) => [s.categorie, s.saisie])).toEqual([["Animal", "Chameau"]]);
  });

  it("ne signale pas deux fois la même Réponse", async () => {
    const { db, joueur, reponse } = await mancheJugee();
    await signalerDecision(db, reponse("Prénom").id, joueur.id);
    expect(await signalerDecision(db, reponse("Prénom").id, joueur.id)).toEqual({ ok: false, erreur: "Tu as déjà signalé cette réponse." });
  });

  it("seulement ses propres Réponses, une fois la Manche jugée, et pas une case vide", async () => {
    const { db, joueur, id, reponse } = await mancheJugee();
    const autre = await choisirPseudo(db, "Léa");
    if (!autre.ok) throw new Error();
    expect((await signalerDecision(db, reponse("Pays").id, autre.joueur.id)).ok).toBe(false);
    expect((await signalerDecision(db, reponse("Métier").id, joueur.id)).ok).toBe(false);
    expect(id).toBeTruthy();
  });

  it("marche aussi après le Défi du jour", async () => {
    const { db, joueur } = await uneMancheEn("C", {});
    const defi = await commencerDefi(db, joueur.id, plus(1000));
    await terminerManche(db, defi.id, joueur.id, { [defi.categories[0]]: `${defi.lettre}aaa` }, plus(1010));
    await jugerManche(db, new FakeJuge(), defi.id, joueur.id);
    const r = (await lireManche(db, defi.id, joueur.id))!.reponses[0];
    expect((await signalerDecision(db, r.id, joueur.id)).ok).toBe(true);
    expect(T0).toBeTruthy();
  });
});
