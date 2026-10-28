import Link from "next/link";
import { Suspense } from "react";
import { deconnecterAction } from "@/app/actions";
import { Entete } from "@/components/entete";
import { FormulaireCompte } from "@/components/formulaire-compte";
import { obtenirDb } from "@/db/client";
import { estAdmin } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { compteDuJoueur, REFUS_MOINS_DE_15_ANS } from "@/lib/jeu/comptes";
import { joueurCourant } from "@/lib/session";

const MESSAGES: Record<string, { texte: string; erreur?: boolean }> = {
  bienvenue: { texte: "Compte créé : ta Série, tes records et Mes règles te suivent maintenant sur tous tes appareils." },
  retour: { texte: "Te revoilà ! Tu retrouves ta Série, tes records et Mes règles." },
  lien: { texte: "La connexion n'a pas abouti : recommence, avec un nouveau code.", erreur: true },
  google: { texte: "La connexion Google n'a pas abouti : réessaie, ou reçois un code par e-mail.", erreur: true },
  age: { texte: REFUS_MOINS_DE_15_ANS, erreur: true },
};

/** Ton Compte : le créer, se connecter sur un autre appareil, ou se déconnecter (ticket 19). */
export default function PageCompte({ searchParams }: PageProps<"/compte">) {
  return (
    <>
      <Entete />
      <main className="wrap compte">
        <Suspense fallback={null}>
          <Contenu searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Contenu({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const cle = ["bienvenue", "retour"].find((k) => params[k]) ?? (typeof params.erreur === "string" ? params.erreur : null);
  const message = cle ? MESSAGES[cle] : null;
  const joueur = await joueurCourant();
  const compte = joueur ? await compteDuJoueur(await obtenirDb(), joueur.id) : null;
  const { data: session } = await auth().getSession();
  const connecte = Boolean(compte?.compteId && session?.user);

  return (
    <section className="pseudo" aria-labelledby="compte-t">
      <h1 id="compte-t" className="pseudo__t">
        Ton <span className="sec__hl">compte</span>
      </h1>
      {message && (
        <p className={message.erreur ? "pseudo__err" : "partage__msg"} role={message.erreur ? "alert" : "status"}>
          {message.texte}
        </p>
      )}
      {connecte ? (
        <>
          <p className="pseudo__p">
            Connecté{session?.user.email ? ` avec ${session.user.email}` : ""}
            {joueur ? `, en tant que ${joueur.pseudo}` : ""}. Ta Série, tes records et Mes règles te suivent sur tous tes appareils.
          </p>
          <form action={deconnecterAction}>
            <button className="btn btn--ink" type="submit">
              Se déconnecter
            </button>
          </form>
          <p className="compte__aide">Après la déconnexion, cet appareil redevient un appareil sans compte.</p>
          {estAdmin(session?.user.email) && (
            <Link className="ink-link" href="/admin">
              Ouvrir /admin
            </Link>
          )}
        </>
      ) : (
        <>
          <p className="pseudo__p">
            Crée un compte pour garder ta Série, tes records et Mes règles sur tous tes appareils. Sans compte, ils restent sur
            cet appareil. Déjà un compte ? Le même code te connecte, sur n&apos;importe quel appareil.
          </p>
          <FormulaireCompte />
        </>
      )}
      <Link className="ink-link" href="/">
        Retour à l&apos;accueil
      </Link>
    </section>
  );
}
