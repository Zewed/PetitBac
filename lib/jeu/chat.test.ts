import { describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { couperLaParole, ecrire, effacerVieuxMessages, exclure, lireChat, signalementsDeMessages, signaler } from "./chat";
import { FakeJuge } from "./juge/fake-juge";
import { choisirPseudo } from "./joueurs";
import { LIMITES, MESSAGES_D_ATTENTE } from "./limites";
import { cloturerManche, lancerPartieSalon, mancheSuivanteSalon } from "./partie-salon";
import { creerSalon, lireSalon, rejoindreSalon } from "./salons";
import { T0, plus, unJoueur } from "./test-outils";

async function nouveau(db: Db, pseudo: string) {
  const r = await choisirPseudo(db, pseudo);
  if (!r.ok) throw new Error(r.erreur);
  return r.joueur;
}

async function unSalon() {
  const { db, joueur: juju } = await unJoueur();
  const salon = await creerSalon(db, juju.id, "express");
  const lea = await nouveau(db, "Léa");
  const hugo = await nouveau(db, "Hugo");
  await rejoindreSalon(db, salon.code, lea.id);
  await rejoindreSalon(db, salon.code, hugo.id);
  return { db, code: salon.code, juju, lea, hugo };
}

const posteDe = async (db: Db, code: string, vu: string, pseudo: string) => (await lireSalon(db, code, vu))!.joueurs.find((j) => j.pseudo === pseudo)!.poste;

describe("Le chat du Salon", () => {
  it("est ouvert dans le Salon d'attente, et vide il invite à écrire", async () => {
    const { db, code, lea, hugo } = await unSalon();
    expect(await lireChat(db, code, lea.id)).toMatchObject({ ouvert: true, messages: [] });
    expect(await ecrire(db, code, lea.id, "Salut la compagnie !", T0)).toEqual({ ok: true });
    expect((await lireChat(db, code, hugo.id))!.messages).toEqual([expect.objectContaining({ pseudo: "Léa", texte: "Salut la compagnie !", moi: false })]);
  });

  it("est fermé pendant la Manche, et rouvre à la découverte des points et entre les Manches", async () => {
    const { db, code, juju, lea } = await unSalon();
    await lancerPartieSalon(db, code, juju.id, "express", { maintenant: T0 });
    expect((await lireChat(db, code, lea.id))!.ouvert).toBe(false);
    expect(await ecrire(db, code, lea.id, "La réponse c'est…", plus(10))).toEqual({ ok: false, erreur: "Le chat est fermé pendant la manche." });
    await cloturerManche(db, new FakeJuge(), code, plus(60));
    expect((await lireChat(db, code, lea.id))!.ouvert).toBe(true);
    await mancheSuivanteSalon(db, code, juju.id, { maintenant: plus(70) });
    expect((await lireChat(db, code, lea.id))!.ouvert).toBe(false);
  });

  it("masque les grossièretés automatiquement", async () => {
    const { db, code, lea, hugo } = await unSalon();
    await ecrire(db, code, lea.id, "Hugo t'es un gros connard", T0);
    expect((await lireChat(db, code, hugo.id))!.messages[0].texte).toBe("Hugo t'es un gros *******");
  });

  it("masque aussi les grossièretés déguisées, et laisse passer les mots qui en contiennent une", async () => {
    const { db, code, lea, hugo } = await unSalon();
    await ecrire(db, code, lea.id, "Ta gueule, sale c0nnard ! Constance et Pascal sont là.", T0);
    expect((await lireChat(db, code, hugo.id))!.messages[0].texte).toBe("** ******, sale ******* ! Constance et Pascal sont là.");
  });

  it("refuse un message vide ou trop long", async () => {
    const { db, code, lea } = await unSalon();
    expect((await ecrire(db, code, lea.id, "   ", T0)).ok).toBe(false);
    expect((await ecrire(db, code, lea.id, "a".repeat(281), T0)).ok).toBe(false);
  });
});

describe("L'Hôte", () => {
  it("peut couper la parole à un Joueur", async () => {
    const { db, code, juju, hugo } = await unSalon();
    expect(await couperLaParole(db, code, juju.id, await posteDe(db, code, juju.id, "Hugo"), true)).toEqual({ ok: true });
    expect(await ecrire(db, code, hugo.id, "Hé !", T0)).toEqual({ ok: false, erreur: "L'hôte t'a coupé la parole." });
    expect((await lireChat(db, code, hugo.id))!.muet).toBe(true);
  });

  it("peut exclure un Joueur du Salon, qui ne peut plus revenir", async () => {
    const { db, code, juju, hugo } = await unSalon();
    expect(await exclure(db, code, juju.id, await posteDe(db, code, juju.id, "Hugo"))).toEqual({ ok: true });
    expect(await lireSalon(db, code, hugo.id)).toBeUndefined();
    expect(await rejoindreSalon(db, code, hugo.id)).toEqual({ ok: false, erreur: "L'hôte t'a exclu de ce salon." });
    expect((await ecrire(db, code, hugo.id, "Je reviens", T0)).ok).toBe(false);
  });

  it("est le seul à pouvoir le faire", async () => {
    const { db, code, juju, lea } = await unSalon();
    expect((await couperLaParole(db, code, lea.id, await posteDe(db, code, lea.id, "Juju"), true)).ok).toBe(false);
    expect((await exclure(db, code, lea.id, await posteDe(db, code, juju.id, "Hugo"))).ok).toBe(false);
  });
});

describe("Signaler un message", () => {
  it("le Joueur voit que son Signalement est envoyé ; le message garde les messages autour", async () => {
    const { db, code, lea, hugo } = await unSalon();
    await ecrire(db, code, hugo.id, "Premier", T0);
    await ecrire(db, code, lea.id, "Message limite", plus(1));
    await ecrire(db, code, hugo.id, "Après", plus(2));
    const cible = (await lireChat(db, code, hugo.id))!.messages.find((m) => m.texte === "Message limite")!;
    expect(await signaler(db, code, cible.id, hugo.id)).toEqual({ ok: true, message: "Signalement envoyé, merci." });
    expect((await lireChat(db, code, hugo.id))!.messages.find((m) => m.id === cible.id)?.signale).toBe(true);
    expect((await lireChat(db, code, lea.id))!.messages.find((m) => m.id === cible.id)?.signale).toBe(false);
    expect((await signaler(db, code, cible.id, lea.id)).ok).toBe(false);
  });
});

describe("Après la Partie", () => {
  it("rien du chat n'est gardé, sauf les messages signalés", async () => {
    const { db, code, juju, lea, hugo } = await unSalon();
    await ecrire(db, code, lea.id, "Bonne chance", T0);
    await ecrire(db, code, hugo.id, "À signaler", T0);
    const cible = (await lireChat(db, code, lea.id))!.messages.find((m) => m.texte === "À signaler")!;
    await signaler(db, code, cible.id, lea.id);
    await lancerPartieSalon(db, code, juju.id, "express", { maintenant: plus(1) });
    for (let n = 1; n <= 3; n++) {
      await cloturerManche(db, new FakeJuge(), code, plus(n * 100));
      if (n < 3) await mancheSuivanteSalon(db, code, juju.id, { maintenant: plus(n * 100 + 10) });
    }
    expect((await lireChat(db, code, lea.id))!.messages).toEqual([]);
    expect((await signalementsDeMessages(db)).map((s) => s.texte)).toEqual(["À signaler"]);
  });
});

describe("Un Joueur qui écrit en rafale", () => {
  it("est freiné au-delà de la limite dans la minute, avec un message d'attente, puis repart à la minute suivante", async () => {
    const { db, code, lea, hugo } = await unSalon();
    for (let i = 0; i < LIMITES.messages.parAppareil; i++) expect(await ecrire(db, code, lea.id, `Message ${i}`, plus(i))).toEqual({ ok: true });
    expect(await ecrire(db, code, lea.id, "Encore un", plus(30))).toEqual({ ok: false, erreur: MESSAGES_D_ATTENTE.messages });
    expect((await lireChat(db, code, hugo.id))!.messages.map((m) => m.texte)).not.toContain("Encore un");
    expect(await ecrire(db, code, lea.id, "Ça repart", plus(60))).toEqual({ ok: true });
  });

  it("ne freine pas les autres Joueurs du Salon", async () => {
    const { db, code, lea, hugo } = await unSalon();
    for (let i = 0; i <= LIMITES.messages.parAppareil; i++) await ecrire(db, code, lea.id, `Message ${i}`, plus(i));
    expect(await ecrire(db, code, hugo.id, "Calme-toi Léa", plus(30))).toEqual({ ok: true });
  });

  it("un message refusé (vide, trop long, chat fermé) ne compte pas dans la limite", async () => {
    const { db, code, lea } = await unSalon();
    for (let i = 0; i < 30; i++) await ecrire(db, code, lea.id, "   ", plus(i));
    expect(await ecrire(db, code, lea.id, "Enfin un vrai message", plus(31))).toEqual({ ok: true });
  });
});

describe("Le chat d'un Salon où aucune Partie ne finit", () => {
  const HEURE = 3600;

  it("la nuit, ses messages de plus de 24 h sont effacés ; les plus récents et les Signalements restent", async () => {
    const { db, code, lea, hugo } = await unSalon();
    await ecrire(db, code, lea.id, "Vieux message", T0);
    await ecrire(db, code, hugo.id, "Vieux et signalé", plus(1));
    const cible = (await lireChat(db, code, lea.id))!.messages.find((m) => m.texte === "Vieux et signalé")!;
    await signaler(db, code, cible.id, lea.id);
    await ecrire(db, code, lea.id, "Récent", plus(20 * HEURE));
    expect(await effacerVieuxMessages(db, plus(25 * HEURE))).toBe(2);
    expect((await lireChat(db, code, lea.id))!.messages.map((m) => m.texte)).toEqual(["Récent"]);
    expect((await signalementsDeMessages(db)).map((s) => s.texte)).toEqual(["Vieux et signalé"]);
  });

  it("un message d'il y a moins de 24 h n'est pas effacé", async () => {
    const { db, code, lea } = await unSalon();
    await ecrire(db, code, lea.id, "Hier soir", T0);
    expect(await effacerVieuxMessages(db, plus(24 * HEURE - 1))).toBe(0);
    expect((await lireChat(db, code, lea.id))!.messages.map((m) => m.texte)).toEqual(["Hier soir"]);
  });
});
