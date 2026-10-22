"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obtenirDb } from "@/db/client";
import { couperLaParole, ecrire, exclure, signaler } from "@/lib/jeu/chat";
import { commencerDefi } from "@/lib/jeu/defi";
import { contester, voter } from "@/lib/jeu/contestation";
import { reagir } from "@/lib/jeu/decouverte";
import { choisirPseudo } from "@/lib/jeu/joueurs";
import { obtenirJuge } from "@/lib/jeu/juge";
import { jugerManche } from "@/lib/jeu/jugement";
import { enregistrerReponses, lireManche, terminerManche, type Saisies } from "@/lib/jeu/manches";
import { commencerPartieLibre, lirePartie, mancheSuivante } from "@/lib/jeu/parties";
import { estPrereglage } from "@/lib/jeu/prereglages";
import { lireReglages } from "@/lib/jeu/reglages";
import { enregistrerRegle, regleDuJoueur } from "@/lib/jeu/regles";
import { signalerDecision } from "@/lib/jeu/signalement";
import { consommer } from "@/lib/jeu/limites";
import { choisirLettreSuivante, cloturerManche, lancerPartieSalon, mancheSuivanteSalon } from "@/lib/jeu/partie-salon";
import { quitterSalon } from "@/lib/jeu/presence";
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

/** Le Préréglage choisi, et pour « Personnalisé » ses Réglages ; undefined quand les Réglages ne tiennent pas. */
async function prereglageDuFormulaire(form: FormData, salon: boolean, joueurId: string) {
  const choix = form.get("prereglage");
  const lettre = String(form.get("lettre") ?? "") || undefined;
  // « Mes règles » : une Partie Personnalisée avec les Réglages enregistrés.
  if (typeof choix === "string" && choix.startsWith("regle:")) {
    const reglages = await regleDuJoueur(await obtenirDb(), joueurId, choix.slice("regle:".length), { salon });
    return reglages ? { prereglage: "personnalise" as const, reglages } : undefined;
  }
  const prereglage = estPrereglage(choix) ? choix : "classique";
  if (prereglage !== "personnalise") return { prereglage, lettre };
  // « Rejouer » reprend les Réglages de la Partie qu'on vient de finir.
  const depuis = String(form.get("depuis") ?? "");
  if (depuis) {
    const precedente = await lirePartie(await obtenirDb(), depuis, joueurId);
    if (precedente?.reglages) return { prereglage, reglages: precedente.reglages, lettre };
  }
  const lus = lireReglages(form, { salon });
  return lus.ok ? { prereglage, reglages: lus.reglages, lettre } : undefined;
}

export async function lancerPartieLibre(form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const choix = await prereglageDuFormulaire(form, false, joueur.id);
  // Les Réglages sont vérifiés dans le formulaire avant l'envoi : ici, des Réglages invalides ne lancent rien.
  if (!choix) redirect("/");
  const manche = await commencerPartieLibre(await obtenirDb(), joueur.id, choix);
  redirect(`/manche/${manche.id}`);
}

/** Lance le Défi du jour, ou ramène à celui déjà lancé : un seul essai. */
export async function lancerDefi() {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const manche = await commencerDefi(await obtenirDb(), joueur.id);
  redirect(`/manche/${manche.id}`);
}

export async function mancheSuivanteAction(partieId: string, form?: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const lettre = String(form?.get("lettre") ?? "") || undefined;
  const manche = await mancheSuivante(await obtenirDb(), partieId, joueur.id, { lettre });
  if (!manche) refresh();
  else redirect(`/manche/${manche.id}`);
}

export async function enregistrerAction(id: string, saisies: Saisies) {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false as const, erreur: "Choisis d'abord un pseudo." };
  return enregistrerReponses(await obtenirDb(), id, joueur.id, saisies);
}

/** « J'ai fini », ou le chrono à 0:00 : la Grille se ferme et part au Juge. */
/** L'adresse IP de l'appareil, pour les limites anti-abus. */
async function adresseIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/**
 * Juge une Grille en solo ou au Défi, si l'appareil n'a pas envoyé trop de Réponses dans la minute ; sinon la Grille
 * attend, et la page dit d'attendre. Entre amis, la Grille est jugée à la clôture de la Manche, pour tout le monde.
 */
async function jugerSiPermis(db: Awaited<ReturnType<typeof obtenirDb>>, id: string, joueurId: string) {
  const manche = await lireManche(db, id, joueurId);
  if (!manche || manche.salonCode) return jugerManche(db, obtenirJuge(), id, joueurId);
  const remplies = manche.reponses.filter((r) => r.saisie.trim() !== "").length;
  if (remplies > 0 && !(await consommer(db, "reponses", { joueurId, ip: await adresseIp() }, remplies))) return;
  await jugerManche(db, obtenirJuge(), id, joueurId);
}

export async function terminerAction(id: string, saisies: Saisies) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const db = await obtenirDb();
  await terminerManche(db, id, joueur.id, saisies);
  await jugerSiPermis(db, id, joueur.id);
  // Entre amis, le chrono à 0:00 ferme aussi les Grilles des autres, même s'ils sont partis.
  const manche = await lireManche(db, id, joueur.id);
  if (manche?.salonCode) await cloturerManche(db, obtenirJuge(), manche.salonCode);
  refresh();
}

export async function relancerJugement(id: string) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  await jugerSiPermis(await obtenirDb(), id, joueur.id);
  refresh();
}

export async function creerSalonAction(form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const choix = form.get("prereglage");
  const db = await obtenirDb();
  // Trop de Salons créés dans la minute : l'accueil dit d'attendre.
  if (!(await consommer(db, "salons", { joueurId: joueur.id, ip: await adresseIp() }))) redirect("/");
  const salon = await creerSalon(db, joueur.id, estPrereglage(choix) ? choix : "classique");
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
  const choix = await prereglageDuFormulaire(form, true, joueur.id);
  if (!choix) return;
  const resultat = await lancerPartieSalon(await obtenirDb(), code, joueur.id, choix.prereglage, choix);
  if (!resultat.ok) return;
  refresh();
}

export async function mancheSuivanteSalonAction(code: string, form?: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const lettre = String(form?.get("lettre") ?? "") || undefined;
  await mancheSuivanteSalon(await obtenirDb(), code, joueur.id, { lettre });
  refresh();
}

/** Le dernier de la Manche choisit la Lettre de la suivante. */
export async function choisirLettreAction(code: string, form: FormData) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  await choisirLettreSuivante(await obtenirDb(), code, joueur.id, String(form.get("lettre") ?? ""));
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

/** Le Joueur quitte le Salon ; si c'était l'Hôte, un autre prend la relève. */
export async function quitterSalonAction(code: string) {
  const joueur = await joueurCourant();
  if (joueur) await quitterSalon(await obtenirDb(), code, joueur.id);
  redirect("/");
}

export type ResultatChat = { ok: true; message?: string } | { ok: false; erreur: string };

export async function ecrireAction(code: string, texte: string): Promise<ResultatChat> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, erreur: "Choisis d'abord un pseudo." };
  return ecrire(await obtenirDb(), code, joueur.id, texte);
}

export async function signalerAction(code: string, messageId: string): Promise<ResultatChat> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, erreur: "Choisis d'abord un pseudo." };
  return signaler(await obtenirDb(), code, messageId, joueur.id);
}

export async function couperLaParoleAction(code: string, poste: string, muet: boolean): Promise<ResultatChat> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, erreur: "Choisis d'abord un pseudo." };
  return couperLaParole(await obtenirDb(), code, joueur.id, poste, muet);
}

export async function exclureAction(code: string, poste: string): Promise<ResultatChat> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, erreur: "Choisis d'abord un pseudo." };
  const resultat = await exclure(await obtenirDb(), code, joueur.id, poste);
  if (resultat.ok) refresh();
  return resultat;
}

export type EtatRegle = { ok: boolean; message: string } | null;

/** Enregistre les Réglages du formulaire dans « Mes règles », sous le nom saisi. */
export async function enregistrerRegleAction(salon: boolean, _avant: EtatRegle, form: FormData): Promise<EtatRegle> {
  const joueur = await joueurCourant();
  if (!joueur) return { ok: false, message: "Choisis d'abord un pseudo." };
  const lus = lireReglages(form, { salon });
  if (!lus.ok) return { ok: false, message: lus.erreur };
  const nom = String(form.get("nom_regle") ?? "");
  const r = await enregistrerRegle(await obtenirDb(), joueur.id, nom, lus.reglages, { salon });
  if (!r.ok) return { ok: false, message: r.erreur };
  refresh();
  return { ok: true, message: `« ${nom.trim()} » est dans Mes règles.` };
}

/** En solo ou au Défi : le Joueur signale la décision du Juge sur une de ses Réponses. */
export async function signalerDecisionAction(reponseId: string) {
  const joueur = await joueurCourant();
  if (!joueur) return;
  const resultat = await signalerDecision(await obtenirDb(), reponseId, joueur.id);
  if (resultat.ok) refresh();
}
