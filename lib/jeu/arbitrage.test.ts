import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { estAdmin } from "@/lib/auth/admin";
import { fileDArbitrage, trancher } from "./arbitrage";
import { contester } from "./contestation";
import { decouverte } from "./decouverte";
import { FakeJuge } from "./juge/fake-juge";
import type { Juge } from "./juge/types";
import { jugerManche } from "./jugement";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses, lireManche } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { signalerDecision } from "./signalement";
import { T0, plus, uneMancheEn, unJoueur } from "./test-outils";

/** Un Juge qui compte ses appels. */
function jugeCompteur() {
  const vrai = new FakeJuge();
  const juge: Juge & { appels: number } = {
    appels: 0,
    async juger(lettre, reponses) {
      juge.appels++;
      return vrai.juger(lettre, reponses);
    },
  };
  return juge;
}

/** Un Joueur joue seul une Manche dans la Lettre, la fait juger, et signale sa Réponse dans la Catégorie. */
async function signale(db: Db, pseudo: string, lettre: string, categorie: string, saisie: string) {
  const j = await choisirPseudo(db, pseudo);
  if (!j.ok) throw new Error(j.erreur);
  const { id } = await uneMancheEn(lettre, { [categorie]: saisie }, { db, joueur: j.joueur });
  await jugerManche(db, new FakeJuge(), id, j.joueur.id);
  const reponse = (await lireManche(db, id, j.joueur.id))!.reponses.find((r) => r.categorie === categorie)!;
  expect((await signalerDecision(db, reponse.id, j.joueur.id)).ok).toBe(true);
}

const signaleEnPays = (db: Db, pseudo: string, pays: string) => signale(db, pseudo, "C", "Pays", pays);

describe("/admin est réservé au Compte d'Antoine", () => {
  it("seules les adresses de ADMIN_EMAILS ouvrent /admin, sans tenir compte des majuscules", () => {
    const avant = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "antoine@example.com, autre@example.com";
    expect(estAdmin("Antoine@Example.com")).toBe(true);
    expect(estAdmin("intrus@example.com")).toBe(false);
    expect(estAdmin(null)).toBe(false);
    process.env.ADMIN_EMAILS = "";
    expect(estAdmin("antoine@example.com")).toBe(false);
    process.env.ADMIN_EMAILS = avant;
  });
});

describe("La file des Réponses à trancher", () => {
  it("vide, elle n'a rien à montrer", async () => {
    const { db } = await unJoueur();
    expect(await fileDArbitrage(db, jugeCompteur())).toEqual([]);
  });

  it("montre une Réponse signalée avec sa Catégorie, sa Lettre, la décision du Juge et le nombre de Parties", async () => {
    const { db } = await unJoueur();
    await signaleEnPays(db, "Léa", "Cambodje");
    const juge = jugeCompteur();
    const [item] = await fileDArbitrage(db, juge);
    expect(item).toMatchObject({ categorie: "Pays", lettre: "C", saisie: "Cambodje", parties: 1, signalements: 1, contestations: 0, rejugee: false });
    expect(typeof item.valideParLeJuge).toBe("boolean");
    expect(juge.appels).toBe(0);
  });

  it("une Réponse signalée dans plusieurs Parties est rejugée par le Juge, une seule fois, avant d'arriver dans la file", async () => {
    const { db } = await unJoueur();
    await signaleEnPays(db, "Léa", "Cambodje");
    await signaleEnPays(db, "Hugo", "cambodje");
    const juge = jugeCompteur();
    const [item] = await fileDArbitrage(db, juge);
    expect(item).toMatchObject({ categorie: "Pays", parties: 2, signalements: 2, rejugee: true });
    await fileDArbitrage(db, juge);
    expect(juge.appels).toBe(1);
  });

  it("une Contestation de Salon compte aussi : contestée entre amis puis signalée en solo, la Réponse touche deux Parties", async () => {
    const { db, joueur: juju } = await unJoueur();
    const lea = await choisirPseudo(db, "Léa");
    if (!lea.ok) throw new Error();
    const salon = await creerSalon(db, juju.id, "classique");
    await rejoindreSalon(db, salon.code, lea.joueur.id);
    await lancerPartieSalon(db, salon.code, juju.id, "classique", { maintenant: T0, aleatoire: () => 0 });
    const e = await etatPartieSalon(db, salon.code, juju.id, plus(1));
    await enregistrerReponses(db, e!.maMancheId!, juju.id, { Animal: "Antilope rose" }, plus(5));
    await cloturerManche(db, new FakeJuge(), salon.code, plus(100));
    const r = (await decouverte(db, salon.code, juju.id))!.categories.find((c) => c.categorie === "Animal")!.reponses.find((x) => x.pseudo === "Juju")!;
    expect(await contester(db, salon.code, r.id, juju.id)).toMatchObject({ ok: true });
    await signale(db, "Hugo", "A", "Animal", "antilope rose");
    const juge = jugeCompteur();
    expect(await fileDArbitrage(db, juge)).toMatchObject([{ categorie: "Animal", lettre: "A", saisie: "Antilope rose", parties: 2, signalements: 1, contestations: 1, rejugee: true }]);
    expect(juge.appels).toBe(1);
  });

  it("Antoine tranche : la Réponse sort de la file, et sa décision vaut pour les Parties suivantes", async () => {
    const { db } = await unJoueur();
    await signaleEnPays(db, "Léa", "Congo");
    const [item] = await fileDArbitrage(db, jugeCompteur());
    expect(item.valideParLeJuge).toBe(true);
    await trancher(db, item, { valide: false }, plus(100));
    expect(await fileDArbitrage(db, jugeCompteur())).toEqual([]);
    const j = await choisirPseudo(db, "Inès");
    if (!j.ok) throw new Error();
    const { id } = await uneMancheEn("C", { Pays: "congo" }, { db, joueur: j.joueur });
    await jugerManche(db, new FakeJuge(), id, j.joueur.id);
    expect((await lireManche(db, id, j.joueur.id))!.reponses.find((r) => r.categorie === "Pays")?.valide).toBe(false);
  });

  it("Antoine peut aussi valider une Réponse que le Juge refusait", async () => {
    const { db } = await unJoueur();
    await signaleEnPays(db, "Léa", "Caraïbes");
    const [item] = await fileDArbitrage(db, jugeCompteur());
    expect(item.valideParLeJuge).toBe(false);
    await trancher(db, item, { valide: true }, plus(100));
    const j = await choisirPseudo(db, "Inès");
    if (!j.ok) throw new Error();
    const { id } = await uneMancheEn("C", { Pays: "caraibes" }, { db, joueur: j.joueur });
    await jugerManche(db, new FakeJuge(), id, j.joueur.id);
    const r = (await lireManche(db, id, j.joueur.id))!.reponses.find((x) => x.categorie === "Pays")!;
    expect(r.valide).toBe(true);
    expect(r.formeReference).toBe("Caraïbes");
  });
});
