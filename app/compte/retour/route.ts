import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { obtenirDb } from "@/db/client";
import { auth } from "@/lib/auth/server";
import { pseudoPropose, rattacherCompte } from "@/lib/jeu/comptes";
import { retenirJoueur } from "@/lib/session";

/**
 * Le retour du lien e-mail ou de Google. Le proxy a déjà posé la session Neon Auth ; on rattache le Compte au Joueur
 * de l'appareil (ou on retrouve celui du Compte), puis on retient ce Joueur sur l'appareil.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { data: session } = await auth().getSession();
  if (!session?.user) return NextResponse.redirect(new URL("/compte?erreur=lien", url));
  const appareil = (await cookies()).get("pb_joueur")?.value ?? null;
  const r = await rattacherCompte(await obtenirDb(), {
    compteId: session.user.id,
    joueurAppareilId: appareil && /^[0-9a-f-]{36}$/i.test(appareil) ? appareil : null,
    pseudo: pseudoPropose(session.user.name, session.user.email),
    quinzeAns: url.searchParams.get("quinze") === "1",
  });
  if ("erreur" in r) {
    await auth().signOut();
    return NextResponse.redirect(new URL("/compte?erreur=age", url));
  }
  await retenirJoueur(r.joueur.id);
  return NextResponse.redirect(new URL(r.nouveau ? "/compte?bienvenue=1" : "/compte?retour=1", url));
}
