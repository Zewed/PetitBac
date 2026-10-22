import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { lancerPartieLibre, mancheSuivanteAction, relancerJugement } from "@/app/actions";
import { GrilleEnCours } from "@/components/grille-en-cours";
import { CLASSE_PALIER, LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { lireManche, type Manche } from "@/lib/jeu/manches";
import { lirePartie, type Partie } from "@/lib/jeu/parties";
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
        dureeS={manche.partie?.dureeS ?? 90}
        titre={manche.partie ? `Partie libre · ${manche.partie.nom}` : "Partie libre"}
        etiquette={manche.partie ? `Manche ${manche.partie.numero}/${manche.partie.nbManches}` : "Partie libre"}
      />
    );
  }
  const partie = manche.partieId ? await lirePartie(await obtenirDb(), manche.partieId, joueur.id) : undefined;
  return <Resultat manche={manche} partie={partie} />;
}

function Resultat({ manche, partie }: { manche: Manche; partie?: Partie }) {
  const derniere = !manche.partie || manche.partie.numero >= manche.partie.nbManches;
  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Link className="quit" href="/">
            <span aria-hidden="true">←</span> Accueil
          </Link>
          <p className="salon">
            <b>Partie libre{partie ? ` · ${partie.nom}` : ""}</b> · lettre {manche.lettre}
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
        {manche.partie && partie && (
          <p className="res__partie">
            <span>
              Manche <b>{manche.partie.numero}</b>/{manche.partie.nbManches}
            </span>
            {manche.etat === "jugee" && partie.etat !== "terminee" && (
              <span>
                Total de la partie : <b>{partie.total} pts</b>
              </span>
            )}
          </p>
        )}

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

        {manche.etat === "jugee" && partie?.etat === "terminee" && <FinDePartie partie={partie} />}

        {manche.etat === "jugee" && <LegendePaliers />}

        <div className="res__actions">
          {manche.etat === "jugee" && !derniere && manche.partie ? (
            <form action={mancheSuivanteAction.bind(null, manche.partie.id)}>
              <button className="btn btn--wide" type="submit">
                Manche suivante <span aria-hidden="true">→</span>
              </button>
            </form>
          ) : (
            <form action={lancerPartieLibre}>
              <input type="hidden" name="prereglage" value={partie?.prereglage ?? "classique"} />
              <button className="btn btn--wide" type="submit">
                Rejouer{partie ? ` en ${partie.nom}` : ""} <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
          <Link className="btn btn--ink btn--wide" href="/">
            {derniere ? "Retour à l'accueil" : "Quitter la partie"}
          </Link>
        </div>
      </main>
    </>
  );
}

function FinDePartie({ partie }: { partie: Partie }) {
  return (
    <section className="fin" aria-label="Fin de la partie">
      <p className="fin__k">Partie terminée · {partie.nom}</p>
      <p className="fin__pts">
        {partie.total}
        <small>pts</small>
      </p>
      {partie.nouveauRecord ? (
        <p className="fin__rec">Nouveau record en {partie.nom} !</p>
      ) : (
        partie.record !== null && <p>Ton record en {partie.nom} : {partie.record} pts</p>
      )}
    </section>
  );
}
