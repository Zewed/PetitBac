import { describe, expect, it } from "vitest";
import { finDePartie } from "./fin-partie";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { enregistrerReponses } from "./manches";
import { cloturerManche, etatPartieSalon, lancerPartieSalon, mancheSuivanteSalon } from "./partie-salon";
import { creerSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur } from "./test-outils";

/** Une Partie Express de trois Manches à trois, jouée jusqu'au bout. Lettres A, B, C (tirage au plus bas). */
async function unePartieFinie(saisiesParManche: Record<string, Record<string, string>>[]) {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "express");
  const joueurs = { Juju: juju } as Record<string, { id: string }>;
  for (const p of ["Léa", "Hugo"]) {
    const r = await choisirPseudo(db, p);
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    joueurs[p] = r.joueur;
  }
  await lancerPartieSalon(db, salon.code, juju.id, "express", { maintenant: T0, aleatoire: () => 0 });
  for (let n = 0; n < 3; n++) {
    const t = n * 100;
    for (const [pseudo, saisies] of Object.entries(saisiesParManche[n] ?? {})) {
      const e = await etatPartieSalon(db, salon.code, joueurs[pseudo].id, plus(t + 1));
      await enregistrerReponses(db, e!.maMancheId!, joueurs[pseudo].id, saisies, plus(t + 5));
    }
    await cloturerManche(db, new FakeJuge(), salon.code, plus(t + 60));
    if (n < 2) await mancheSuivanteSalon(db, salon.code, juju.id, { maintenant: plus(t + 100), aleatoire: () => 0 });
  }
  return { db, code: salon.code, joueurs };
}

describe("La Partie se termine sur un podium", () => {
  it("après la dernière Manche, tous voient le podium du Salon", async () => {
    const { db, code, joueurs } = await unePartieFinie([
      { Léa: { Prénom: "Adam", Pays: "Allemagne", Métier: "avocat", Objet: "assiette", Animal: "âne", "Fruit ou légume": "ananas" } },
      { Juju: { Prénom: "Bruno", Pays: "Belgique", Métier: "boulanger", Objet: "bol", Animal: "baleine", "Fruit ou légume": "banane" } },
    ]);
    const fin = await finDePartie(db, code, joueurs.Hugo.id);
    expect(fin?.podium.map((p) => p.pseudo)).toHaveLength(3);
    expect(fin!.podium[0].total).toBeGreaterThanOrEqual(fin!.podium[1].total);
    expect(fin!.podium.find((p) => p.pseudo === "Hugo")).toMatchObject({ total: 0, moi: true });
  });

  it("la Réponse la plus rare de la Partie est montrée, avec le Joueur qui l'a donnée", async () => {
    const { db, code, joueurs } = await unePartieFinie([
      { Léa: { Animal: "âne" } },
      {},
      { Hugo: { Animal: "colibri" } },
    ]);
    const fin = await finDePartie(db, code, joueurs.Juju.id);
    expect(fin?.plusRare).toMatchObject({ pseudo: "Hugo", reponse: "colibri", categorie: "Animal", lettre: "C" });
    expect(fin!.plusRare!.points).toBeGreaterThan(1);
  });

  it("sans aucune Réponse valable, il n'y a pas de Réponse la plus rare", async () => {
    const { db, code, joueurs } = await unePartieFinie([]);
    expect((await finDePartie(db, code, joueurs.Juju.id))?.plusRare).toBeNull();
  });

  it("rien tant que la Partie n'est pas finie", async () => {
    const { db, joueur: juju } = await unJoueur();
    const salon = await creerSalon(db, juju.id, "express");
    const r = await choisirPseudo(db, "Léa");
    if (!r.ok) throw new Error(r.erreur);
    await rejoindreSalon(db, salon.code, r.joueur.id);
    await lancerPartieSalon(db, salon.code, juju.id, "express", { maintenant: T0 });
    expect(await finDePartie(db, salon.code, juju.id)).toBeNull();
  });
});

describe("« Rejouer » garde le Salon", () => {
  it("une nouvelle Partie se lance dans le même Salon, avec les mêmes Joueurs", async () => {
    const { db, code, joueurs } = await unePartieFinie([]);
    expect((await lancerPartieSalon(db, code, joueurs.Juju.id, "classique", { maintenant: plus(1000) })).ok).toBe(true);
    const lea = await etatPartieSalon(db, code, joueurs.Léa.id, plus(1001));
    expect(lea?.partie).toMatchObject({ etat: "en_cours", nom: "Classique" });
    expect(lea?.classement.map((c) => c.pseudo).sort()).toEqual(["Hugo", "Juju", "Léa"]);
    expect(lea?.maMancheId).not.toBeNull();
  });
});
