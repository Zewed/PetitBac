"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirDb } from "@/db/client";
import { commencerDefi } from "@/lib/jeu/defi";
import { contester, voter } from "@/lib/jeu/contestation";
import { reagir } from "@/lib/jeu/decouverte";
import { choisirPseudo } from "@/lib/jeu/joueurs";
import { obtenirJuge } from "@/lib/jeu/juge";
import { jugerManche } from "@/lib/jeu/jugement";
import { enregistrerReponses, lireManche, terminerManche, type Saisies } from "@/lib/jeu/manches";
import { commencerPartieLibre, mancheSuivante } from "@/lib/jeu/parties";
import { estPrereglage } from "@/lib/jeu/prereglages";
import { cloturerManche, lancerPartieSalon, mancheSuivanteSalon } from "@/lib/jeu/partie-salon";
import { creerSalon, rejoindreSalon, type ResultatRejoindre } from "@/lib/jeu/salons";
import { direStop } from "@/lib/jeu/stop";
import { joueurCourant, retenirJoueur } from "@/lib/session";

export type EtatPseudo = { erreur?: string; saisie?: string };

export async function choisirPseudoAction(_avant: EtatPseudo, form: FormData): Promise<EtatPseudo> {
  const saisie = String(form.get("pseudo") ?? "");
  const resultat = await choisirPseudo(await obtenirDb(), saisie);
  if (!resultat.ok) return { erreur: resultat.erreur, saisie };
  await retenirJoueur(resultat.joueur.id);
  refresh();
  return {};
}

export async function lancerPartieLibre(form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const choix = form.get("prereglage");
  const manche = await commencerPartieLibre(await obtenirDb(), joueur.id, { prereglage: estPrereglage(choix) ? choix : "classique" });
  redirect(`/manche/${manche.id}`);
}

/** Lance le Défi du jour, ou ramène à celui déjà lancé : un seul essai. */
export async function lancerDefi() {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const manche = await commencerDefi(await obtenirDb(), joueur.id);
  redirect(`/manche/${manche.id}`);
}

export async function mancheSuivanteAction(partieId: string) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const manche = await mancheSuivante(await obtenirDb(), partieId, joueur.id);
  if (!manche) refresh();
  else redirect(`/manche/${manche.id}`);
}

export async function enregistrerAction(id: string, saisies: Saisies) {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false as const, erreur: "Choisis d'abord un pseudo." };
  return enregistrerReponses(await obtenirDb(), id, joueur.id, saisies);
}

/** « J'ai fini », ou le chrono à 0:00 : la Grille se ferme et part au Juge. */
export async function terminerAction(id: string, saisies: Saisies) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const db = await obtenirDb();
  await terminerManche(db, id, joueur.id, saisies);
  await jugerManche(db, obtenirJuge(), id, joueur.id);
  // Entre amis, le chrono à 0:00 ferme aussi les Grilles des autres, même s'ils sont partis.
  const manche = await lireManche(db, id, joueur.id);
  if (manche?.salonCode) await cloturerManche(db, obtenirJuge(), manche.salonCode);
  refresh();
}

export async function relancerJugement(id: string) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  await jugerManche(await obtenirDb(), obtenirJuge(), id, joueur.id);
  refresh();
}

export async function creerSalonAction(form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const choix = form.get("prereglage");
  const salon = await creerSalon(await obtenirDb(), joueur.id, estPrereglage(choix) ? choix : "classique");
  redirect(`/salon/${salon.code}`);
}

/** Entrer dans un Salon dont on a ouvert le lien. */
export async function rejoindreAction(code: string): Promise<ResultatRejoindre | undefined> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, erreur: "Choisis d'abord un pseudo." };
  const resultat = await rejoindreSalon(await obtenirDb(), code, joueur.id);
  if (resultat.ok) refresh();
  return resultat;
}

export type EtatRejoindre = { erreur?: string; saisie?: string };

/** « Rejoindre » depuis l'accueil, avec le code ou le lien tapé. */
export async function rejoindreParCodeAction(_avant: EtatRejoindre, form: FormData): Promise<EtatRejoindre> {
  const saisie = String(form.get("code") ?? "");
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const resultat = await rejoindreSalon(await obtenirDb(), saisie, joueur.id);
  if (!resultat.ok) return { erreur: resultat.erreur, saisie };
  redirect(`/salon/${resultat.code}`);
}

export async function lancerPartieSalonAction(code: string, form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const choix = form.get("prereglage");
  const resultat = await lancerPartieSalon(await obtenirDb(), code, joueur.id, estPrereglage(choix) ? choix : "classique");
  if (!resultat.ok) return;
  refresh();
}

export async function mancheSuivanteSalonAction(code: string) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  await mancheSuivanteSalon(await obtenirDb(), code, joueur.id);
  refresh();
}

/** Ferme la Manche du Salon une fois l'heure passée ; sans effet avant. */
export async function cloturerAction(code: string) {
  await cloturerManche(await obtenirDb(), obtenirJuge(), code);
}

/** Entre amis, Grille complète : STOP. Les autres n'ont plus que le Temps de grâce. */
export async function direStopAction(id: string, saisies: Saisies) {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false as const, erreur: "Choisis d'abord un pseudo." };
  const resultat = await direStop(await obtenirDb(), id, joueur.id, saisies);
  if (resultat.ok) refresh();
  return resultat;
}

/** Pose ou retire une réaction emoji sur la Réponse d'un autre. */
export async function reagirAction(code: string, reponseId: string, emoji: string) {
  const joueur = await joueurCourant();
  if (!joueur) return;
  const resultat = await reagir(await obtenirDb(), code, reponseId, joueur.id, emoji);
  if (resultat.ok) refresh();
}

/** Remet en cause la décision du Juge sur une Réponse ; le Salon vote. */
export async function contesterAction(code: string, reponseId: string) {
  const joueur = await joueurCourant();
  if (!joueur) return;
  const resultat = await contester(await obtenirDb(), code, reponseId, joueur.id);
  if (resultat.ok) refresh();
}

export async function voterAction(code: string, contestationId: string, pour: boolean) {
  const joueur = await joueurCourant();
  if (!joueur) return;
  const resultat = await voter(await obtenirDb(), code, contestationId, joueur.id, pour);
  if (resultat.ok) refresh();
}
