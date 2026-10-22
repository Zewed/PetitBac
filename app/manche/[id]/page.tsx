import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { lancerPartieLibre, mancheSuivanteAction, mancheSuivanteSalonAction, relancerJugement } from "@/app/actions";
import { SuiviSalon } from "@/components/suivi-salon";
import { GrilleEnCours } from "@/components/grille-en-cours";
import { CLASSE_PALIER, LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { lireManche, type Manche } from "@/lib/jeu/manches";
import { etatPartieSalon, type EtatPartieSalon } from "@/lib/jeu/partie-salon";
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

  const db = await obtenirDb();
  const salon = manche.salonCode ? await etatPartieSalon(db, manche.salonCode, joueur.id, maintenant) : undefined;

  if (manche.etat === "en_cours") {
    return (
      <GrilleEnCours
        id={manche.id}
        lettre={manche.lettre}
        categories={manche.categories}
        saisies={Object.fromEntries(manche.reponses.map((r) => [r.categorie, r.saisie]))}
        finitLe={manche.finitLe.toISOString()}
        maintenantServeur={maintenant.toISOString()}
        dureeS={manche.dureeS}
        titre={
          manche.defiNumero
            ? `Défi du jour n°${manche.defiNumero}`
            : manche.salonCode && manche.partie
              ? `Salon ${manche.salonCode} · ${manche.partie.nom}`
              : manche.partie
                ? `Partie libre · ${manche.partie.nom}`
                : "Partie libre"
        }
        etiquette={manche.defiNumero ? `Défi n°${manche.defiNumero}` : manche.partie ? `Manche ${manche.partie.numero}/${manche.partie.nbManches}` : "Partie libre"}
        salon={
          manche.salonCode && salon
            ? {
                code: manche.salonCode,
                titreScores: salon.manche.numero > 1 ? `Scores après la manche ${salon.manche.numero - 1}` : "Les joueurs",
                scores: salon.classement,
                stopPar: salon.manche.stopPar,
              }
            : undefined
        }
      />
    );
  }
  const partie = manche.partieId && !manche.salonCode ? await lirePartie(db, manche.partieId, joueur.id) : undefined;
  return <Resultat manche={manche} partie={partie} salon={salon} />;
}

function Resultat({ manche, partie, salon }: { manche: Manche; partie?: Partie; salon?: EtatPartieSalon }) {
  const derniere = !manche.partie || manche.partie.numero >= manche.partie.nbManches;
  const defi = manche.defiNumero !== null;
  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Link className="quit" href="/">
            <span aria-hidden="true">←</span> Accueil
          </Link>
          <p className="salon">
            <b>
              {defi
                ? `Défi du jour n°${manche.defiNumero}`
                : salon
                  ? `Salon ${manche.salonCode} · ${salon.partie.nom}`
                  : `Partie libre${partie ? ` · ${partie.nom}` : ""}`}
            </b>{" "}
            · lettre {manche.lettre}
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

        {salon && manche.salonCode && <ApresMancheSalon code={manche.salonCode} mancheId={manche.id} salon={salon} />}

        {manche.etat === "jugee" && <LegendePaliers />}

        {!salon && (
        <div className="res__actions">
          {defi ? null : manche.etat === "jugee" && !derniere && manche.partie ? (
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
            {defi || derniere ? "Retour à l'accueil" : "Quitter la partie"}
          </Link>
        </div>
        )}
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

function ApresMancheSalon({ code, mancheId, salon }: { code: string; mancheId: string; salon: EtatPartieSalon }) {
  const finie = salon.partie.etat === "terminee";
  return (
    <section className="res" aria-labelledby="cl-t">
      <SuiviSalon code={code} mancheId={mancheId} />
      <h2 id="cl-t" className="kick">
        {finie ? "Partie terminée · classement final" : `Classement après la manche ${salon.manche.numero}/${salon.manche.nbManches}`}
      </h2>
      <ol className="classement">
        {salon.classement.map((j, i) => (
          <li key={j.pseudo + i} className={j.moi ? "is-me" : ""}>
            <span className="classement__r">{i + 1}</span>
            <span className="classement__n">{j.pseudo}</span>
            <span className="classement__p">{j.total}</span>
          </li>
        ))}
      </ol>
      <div className="res__actions">
        {finie ? (
          <Link className="btn btn--wide" href={`/salon/${code}`}>
            Retour au salon <span aria-hidden="true">→</span>
          </Link>
        ) : !salon.manche.close ? (
          <p className="attente__p" role="status">
            On attend la fin de la manche pour tout le monde…
          </p>
        ) : salon.jeSuisHote ? (
          <form action={mancheSuivanteSalonAction.bind(null, code)}>
            <button className="btn btn--wide" type="submit">
              Manche suivante <span aria-hidden="true">→</span>
            </button>
          </form>
        ) : (
          <p className="attente__p" role="status">
            L&apos;hôte lance la manche {salon.manche.numero + 1} quand tout le monde est prêt.
          </p>
        )}
        <Link className="btn btn--ink btn--wide" href="/">
          Quitter le salon
        </Link>
      </div>
    </section>
  );
}
