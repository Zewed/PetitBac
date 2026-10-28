"use server";

import { refresh } from "next/cache";
import { notFound } from "next/navigation";
import { obtenirDb } from "@/db/client";
import { estAdmin } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { trancher } from "@/lib/jeu/arbitrage";
import { normaliser } from "@/lib/jeu/texte";

/** Antoine valide ou refuse une Réponse de la file. Comme la page, l'action vérifie elle-même que c'est bien lui. */
export async function trancherAction(form: FormData) {
  const { data: session } = await auth().getSession();
  if (!estAdmin(session?.user.email)) notFound();
  const categorie = String(form.get("categorie") ?? "");
  const lettre = String(form.get("lettre") ?? "");
  const saisie = String(form.get("saisie") ?? "").trim();
  const cle = normaliser(saisie);
  if (!categorie || !/^[A-Z]$/.test(lettre) || !cle) return;
  const valide = form.get("valide") === "1";
  const formeReference = String(form.get("forme") ?? "").trim().slice(0, 80) || undefined;
  await trancher(await obtenirDb(), { categorie, lettre, cle, saisie }, { valide, formeReference });
  refresh();
}
