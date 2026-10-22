"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirDb } from "@/db/client";
import { choisirPseudo } from "@/lib/jeu/joueurs";
import { obtenirJuge } from "@/lib/jeu/juge";
import { jugerManche } from "@/lib/jeu/jugement";
import { commencerPartieLibre, enregistrerReponses, terminerManche, type Saisies } from "@/lib/jeu/manches";
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

export async function lancerPartieLibre() {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  const manche = await commencerPartieLibre(await obtenirDb(), joueur.id);
  redirect(`/manche/${manche.id}`);
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
  refresh();
}

export async function relancerJugement(id: string) {
  const joueur = await joueurCourant();
  if (!joueur) redirect("/");
  await jugerManche(await obtenirDb(), obtenirJuge(), id, joueur.id);
  refresh();
}
