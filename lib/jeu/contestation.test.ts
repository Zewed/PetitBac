import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { contester, voter } from "./contestation";
import { decouverte } from "./decouverte";
import { FakeJuge } from "./juge/fake-juge";
import { jugerManche } from "./jugement";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses, lireManche } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur, uneMancheEn } from "./test-outils";

/** Un Salon de trois, Lettre A ; Juju écrit « Ardoise » en Animal, que le FakeJuge refuse. Manche close. */
async function unSalonApresManche(nb = 3) {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "classique");
  const autres = [];
  for (const p of ["Léa", "Hugo"].slice(0, nb - 1)) {
    const r = await choisirPseudo(db, p);
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    autres.push(r.joueur);
  }
  await lancerPartieSalon(db, salon.code, juju.id, "classique", { maintenant: T0, aleatoire: () => 0 });
  const e = await etatPartieSalon(db, salon.code, juju.id, plus(1));
  await enregistrerReponses(db, e!.maMancheId!, juju.id, { Animal: "Antilope rose", Pays: "Allemagne" }, plus(5));
  await cloturerManche(db, new FakeJuge(), salon.code, plus(100));
  return { db, code: salon.code, juju, lea: autres[0], hugo: autres[1], mancheJuju: e!.maMancheId! };
}

async function reponseDe(db: Db, code: string, vu: string, categorie: string, pseudo: string) {
  return (await decouverte(db, code, vu))!.categories.find((c) => c.categorie === categorie)!.reponses.find((r) => r.pseudo === pseudo)!;
}

describe("Un Joueur conteste une décision du Juge", () => {
  it("pendant la découverte des points, et le Salon vote", async () => {
    const { db, code, juju, lea } = await unSalonApresManche();
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    expect(r).toMatchObject({ valide: false, points: 0 });
    expect(await contester(db, code, r.id, juju.id)).toMatchObject({ ok: true });
    const vue = await reponseDe(db, code, lea.id, "Animal", "Juju");
    expect(vue.contestation).toMatchObject({ etat: "en_cours", pour: 1, contre: 0, par: "Juju", monVote: null });
  });

  it("la majorité tranche : une Réponse validée par le vote rapporte selon sa Cote, et le total se met à jour", async () => {
    const { db, code, juju, lea, mancheJuju } = await unSalonApresManche();
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    const { contestationId } = (await contester(db, code, r.id, juju.id)) as { contestationId: string };
    const avant = (await lireManche(db, mancheJuju, juju.id))!.total!;
    await voter(db, code, contestationId, lea.id, true);
    const apres = await reponseDe(db, code, lea.id, "Animal", "Juju");
    expect(apres).toMatchObject({ valide: true, points: 12, palier: "Légendaire" });
    expect(apres.contestation?.etat).toBe("acceptee");
    expect((await lireManche(db, mancheJuju, juju.id))!.total).toBe(avant + 12);
    expect((await etatPartieSalon(db, code, lea.id))!.classement.find((c) => c.pseudo === "Juju")!.total).toBe(avant + 12);
  });

  it("quand la majorité dit non, la décision du Juge reste", async () => {
    const { db, code, juju, lea, hugo } = await unSalonApresManche();
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    const { contestationId } = (await contester(db, code, r.id, juju.id)) as { contestationId: string };
    await voter(db, code, contestationId, lea.id, false);
    await voter(db, code, contestationId, hugo.id, false);
    expect(await reponseDe(db, code, juju.id, "Animal", "Juju")).toMatchObject({ valide: false, points: 0, contestation: { etat: "rejetee" } });
  });

  it("on peut aussi contester une Réponse validée : refusée par le vote, elle vaut 0", async () => {
    const { db, code, juju, lea, hugo } = await unSalonApresManche();
    const r = await reponseDe(db, code, lea.id, "Pays", "Juju");
    expect(r.valide).toBe(true);
    const { contestationId } = (await contester(db, code, r.id, lea.id)) as { contestationId: string };
    await voter(db, code, contestationId, hugo.id, true);
    expect(await reponseDe(db, code, juju.id, "Pays", "Juju")).toMatchObject({ valide: false, points: 0 });
  });

  it("à égalité, faute de majorité, la décision du Juge reste", async () => {
    const { db, code, juju, lea } = await unSalonApresManche(2);
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    const { contestationId } = (await contester(db, code, r.id, juju.id)) as { contestationId: string };
    await voter(db, code, contestationId, lea.id, false);
    expect(await reponseDe(db, code, juju.id, "Animal", "Juju")).toMatchObject({ valide: false, contestation: { etat: "rejetee" } });
  });

  it("le vote ne vaut que pour cette Partie : la même Réponse jouée ailleurs garde la décision du Juge", async () => {
    const { db, code, juju, lea } = await unSalonApresManche();
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    const { contestationId } = (await contester(db, code, r.id, juju.id)) as { contestationId: string };
    await voter(db, code, contestationId, lea.id, true);
    const ailleurs = await uneMancheEn("A", { Animal: "Antilope rose" });
    await jugerManche(ailleurs.db, new FakeJuge(), ailleurs.id, ailleurs.joueur.id);
    expect((await lireManche(ailleurs.db, ailleurs.id, ailleurs.joueur.id))!.reponses.find((x) => x.categorie === "Animal")).toMatchObject({ valide: false, points: 0 });
    const memeBase = await uneMancheEn("A", { Animal: "Antilope rose" }, { db, joueur: lea });
    await jugerManche(db, new FakeJuge(), memeBase.id, lea.id);
    expect((await lireManche(db, memeBase.id, lea.id))!.reponses.find((x) => x.categorie === "Animal")).toMatchObject({ valide: false, points: 0 });
  });

  it("on ne conteste pas avant la découverte, ni deux fois la même Réponse", async () => {
    const { db, code, juju, lea } = await unSalonApresManche();
    const r = await reponseDe(db, code, juju.id, "Animal", "Juju");
    await contester(db, code, r.id, juju.id);
    expect((await contester(db, code, r.id, lea.id)).ok).toBe(false);
  });
});
