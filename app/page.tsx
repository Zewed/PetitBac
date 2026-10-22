import { Suspense } from "react";
import Link from "next/link";
import { lancerDefi } from "@/app/actions";
import { ChoisirPseudo } from "@/components/choisir-pseudo";
import { Entete } from "@/components/entete";
import { RejoindreSalon } from "@/components/rejoindre-salon";
import { TuileCreer, TuileSeul } from "@/components/tuiles-accueil";
import { obtenirDb } from "@/db/client";
import { monDefi } from "@/lib/jeu/defi";
import { freine, MESSAGES_D_ATTENTE } from "@/lib/jeu/limites";
import { records } from "@/lib/jeu/parties";
import { partieEnCoursDuJoueur } from "@/lib/jeu/presence";
import { mesRegles } from "@/lib/jeu/regles";
import { joueurCourant } from "@/lib/session";

/**
 * L'accueil tient dans l'écran, sans défiler (ticket 30, maquette .aeom/direction/accueil/) : Entre amis d'abord,
 * puis la Partie libre, puis le Défi du jour. La Série et la place au classement sont sur le résultat du Défi.
 */
export default function Accueil() {
  return (
    <div className="p-acc">
      <Entete etoile />
      <main className="wrap">
        <Suspense fallback={null}>
          <Contenu />
        </Suspense>
      </main>
    </div>
  );
}

async function Contenu() {
  const joueur = await joueurCourant();
  if (!joueur) return <ChoisirPseudo />;
  const db = await obtenirDb();
  const [meilleurs, regles, defi, enCours, salonsFreines] = await Promise.all([
    records(db, joueur.id),
    mesRegles(db, joueur.id),
    monDefi(db, joueur.id),
    partieEnCoursDuJoueur(db, joueur.id),
    freine(db, "salons", { joueurId: joueur.id }),
  ]);
  return (
    <>
      <h1 className="sr">Petit Bac : à quoi on joue ?</h1>
      {enCours && (
        <Link className="resume resume--compact" href={`/salon/${enCours.code}`}>
          <span className="resume__txt">
            <span className="resume__a">Partie en cours</span>
            <span className="resume__b">
              Salon {enCours.code} de {enCours.hote} · manche {enCours.numero}/{enCours.nbManches}
            </span>
          </span>
          <span className="resume__go">
            Reprendre <span aria-hidden="true">→</span>
          </span>
        </Link>
      )}
      <div className="tuiles">
        <TuileCreer attente={salonsFreines ? MESSAGES_D_ATTENTE.salons : null} />
        <section className="tuile rj" aria-labelledby="rj-t">
          <div className="rj__head">
            <h2 id="rj-t" className="rj__t">
              Rejoindre un salon
            </h2>
            <svg className="cle" viewBox="0 0 240 104" aria-hidden="true">
              <path fill="#fff" fillRule="evenodd" d="M52 6a46 46 0 1 1 0 92a46 46 0 1 1 0-92zm0 30a16 16 0 1 0 0 32a16 16 0 1 0 0-32z" />
              <path fill="#fff" d="M90 40h142l-8 24H90z" />
              <path fill="#fff" d="M196 60h22l-4 30h-22zM162 60h20l-3 20h-20z" />
            </svg>
          </div>
          <svg className="gri gri--eclat" viewBox="0 0 50 50" aria-hidden="true">
            <path d="M25 4v14M25 32v14M4 25h14M32 25h14M10 10l8 8M32 32l8 8M40 10l-8 8M18 32l-8 8" />
          </svg>
          <RejoindreSalon />
        </section>
        <TuileSeul meilleurs={meilleurs} regles={regles} />
        <TuileDefi {...defi} />
      </div>
    </>
  );
}

/** Le Défi du jour, en petit : la Lettre cachée et « Jouer » tant qu'il n'est pas fait ; ensuite « Fait », les points et « Voir ». */
function TuileDefi({ defi, mancheId, etat, total }: Awaited<ReturnType<typeof monDefi>>) {
  const fait = etat !== null && etat !== "en_cours";
  return (
    <section className="tuile dj" aria-labelledby="dj-t">
      <span className={`dj__l ${fait ? "" : "dj__l--cachee"}`} role="img" aria-label={fait ? `Lettre ${defi.lettre}` : "Lettre cachée"}>
        {fait ? defi.lettre : "?"}
      </span>
      <span className="gri-bang" aria-hidden="true">
        !
      </span>
      <p className="kick" aria-hidden="true">
        Défi du jour
      </p>
      <div className="dj__row">
        <h2 id="dj-t" className="dj__t">
          <span className="dj__tk">Défi du jour </span>n°{defi.numero}
        </h2>
        {fait && (
          <p className="dj__fait">
            <svg className="dj__tick" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.5 10.5l4.2 4.3L16.5 5" />
            </svg>
            <span>Fait</span>
          </p>
        )}
      </div>
      {fait && mancheId ? (
        <>
          <p className="dj__pts">
            {etat === "jugee" ? total : "…"}
            <small>pts</small>
          </p>
          <Link className="ink-link dj__voir" href={`/manche/${mancheId}`} aria-label={`Voir mon résultat du défi n°${defi.numero}`}>
            <span>
              Voir<span className="dj__voir-x"> mon résultat</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : (
        <>
          <p className="dj__note">La même lettre pour tous, un seul essai.</p>
          <form className="dj__form" action={lancerDefi}>
            <button className="dj__go" type="submit">
              {mancheId ? "Reprendre" : "Jouer"} <span aria-hidden="true">→</span>
            </button>
          </form>
        </>
      )}
    </section>
  );
}
