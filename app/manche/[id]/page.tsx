import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { lancerPartieLibre, relancerJugement } from "@/app/actions";
import { GrilleEnCours } from "@/components/grille-en-cours";
import { CLASSE_PALIER, LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { lireManche, type Manche } from "@/lib/jeu/manches";
import { joueurCourant } from "@/lib/session";

export default function PageManche({ params }: PageProps<"/manche/[id]">) {
  return (
    <Suspense fallback={null}>
      <Ecran params={params} />
    </Suspense>
  );
}

async function Ecran({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const joueur = await joueurCourant();
  if (!joueur) notFound();
  const maintenant = new Date();
  const manche = await lireManche(await obtenirDb(), id, joueur.id, maintenant);
  if (!manche) notFound();

  if (manche.etat === "en_cours") {
    return (
      <GrilleEnCours
        id={manche.id}
        lettre={manche.lettre}
        categories={manche.categories}
        saisies={Object.fromEntries(manche.reponses.map((r) => [r.categorie, r.saisie]))}
        finitLe={manche.finitLe.toISOString()}
        maintenantServeur={maintenant.toISOString()}
        dureeS={90}
      />
    );
  }
  return <Resultat manche={manche} />;
}

function Resultat({ manche }: { manche: Manche }) {
  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Link className="quit" href="/">
            <span aria-hidden="true">←</span> Accueil
          </Link>
          <p className="salon">
            <b>Partie libre</b> · lettre {manche.lettre}
          </p>
        </div>
      </header>
      <main className="wrap res">
        <div className="res__head">
          <span className="lettre" aria-label={`Lettre ${manche.lettre}`}>
            {manche.lettre}
          </span>
          <h1>Tes points en {manche.lettre}</h1>
        </div>

        {manche.etat === "jugee" ? (
          <p className="res__total">
            <span className="res__pts">
              {manche.total}
              <small>pts</small>
            </span>
          </p>
        ) : (
          <div className="panne" role="alert">
            <p className="panne__t">Le Juge ne répond pas.</p>
            <p>Ta grille est gardée telle quelle. Relance le jugement pour voir tes points.</p>
            <form action={relancerJugement.bind(null, manche.id)}>
              <button className="btn" type="submit">
                Relancer le jugement
              </button>
            </form>
          </div>
        )}

        <ol className="lignes">
          {manche.reponses.map((r) => {
            const vide = r.saisie.trim() === "";
            const refus = !vide && r.valide === false;
            const classe = manche.etat !== "jugee" || vide || refus ? "" : CLASSE_PALIER[r.palier ?? ""] ?? "";
            return (
              <li key={r.categorie} className={`ligne ${classe} ${vide ? "is-vide" : ""} ${refus ? "is-refus" : ""}`}>
                <span className="cat">{r.categorie}</span>
                <span className="ligne__rep">{vide ? "Case vide" : (r.formeReference ?? r.saisie)}</span>
                {manche.etat === "jugee" && (
                  <span className="ligne__pal">
                    <b>{r.points ?? 0}</b>
                    <span>{vide ? "vide" : refus ? "refusée" : r.palier}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {manche.etat === "jugee" && <LegendePaliers />}

        <div className="res__actions">
          <form action={lancerPartieLibre}>
            <button className="btn btn--wide" type="submit">
              Rejouer une manche <span aria-hidden="true">→</span>
            </button>
          </form>
          <Link className="btn btn--ink btn--wide" href="/">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </>
  );
}
