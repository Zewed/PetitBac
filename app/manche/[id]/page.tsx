import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { choisirLettreAction, lancerPartieLibre, signalerDecisionAction, mancheSuivanteAction, mancheSuivanteSalonAction, quitterSalonAction, relancerJugement } from "@/app/actions";
import { ChoixLettre } from "@/components/choix-lettre";
import { ChatSalon } from "@/components/chat-salon";
import { Decouverte } from "@/components/decouverte";
import { SuiviSalon } from "@/components/suivi-salon";
import { GrilleEnCours } from "@/components/grille-en-cours";
import { CLASSE_PALIER, LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { lireChat, type ChatVu } from "@/lib/jeu/chat";
import { lireManche, type Manche } from "@/lib/jeu/manches";
import { decouverte } from "@/lib/jeu/decouverte";
import { finDePartie, type FinDePartie } from "@/lib/jeu/fin-partie";
import { etatPartieSalon, type EtatPartieSalon } from "@/lib/jeu/partie-salon";
import { lirePartie, type Partie } from "@/lib/jeu/parties";
import { etiquetteManche } from "@/lib/jeu/reglages";
import { casesAvantStop } from "@/lib/jeu/stop";
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
        etiquette={
          manche.defiNumero
            ? `Défi n°${manche.defiNumero}`
            : manche.partie
              ? etiquetteManche(manche.partie.numero, manche.partie.nbManches, manche.partie.reglages)
              : "Partie libre"
        }
        sansLimite={manche.sansLimite}
        salon={
          manche.salonCode && salon
            ? {
                code: manche.salonCode,
                titreScores: salon.manche.numero > 1 ? `Scores après la manche ${salon.manche.numero - 1}` : "Les joueurs",
                scores: salon.classement,
                stopPar: salon.manche.stopPar,
                stop: {
                  actif: salon.reglages.stop.actif,
                  cases: casesAvantStop(salon.reglages.stop.des, manche.categories.length),
                  graceS: salon.reglages.stop.graceS,
                },
              }
            : undefined
        }
      />
    );
  }
  const partie = manche.partieId && !manche.salonCode ? await lirePartie(db, manche.partieId, joueur.id) : undefined;
  const reponsesDeTous = manche.salonCode ? await decouverte(db, manche.salonCode, joueur.id) : null;
  const fin = manche.salonCode && salon?.partie.etat === "terminee" ? await finDePartie(db, manche.salonCode, joueur.id) : null;
  const chat = manche.salonCode ? await lireChat(db, manche.salonCode, joueur.id) : undefined;
  return <Resultat manche={manche} partie={partie} salon={salon} reponsesDeTous={reponsesDeTous} fin={fin} chat={chat} />;
}

function Resultat({
  manche,
  partie,
  salon,
  reponsesDeTous,
  fin,
  chat,
}: {
  manche: Manche;
  partie?: Partie;
  salon?: EtatPartieSalon;
  reponsesDeTous?: Awaited<ReturnType<typeof decouverte>>;
  fin?: FinDePartie | null;
  chat?: ChatVu;
}) {
  const derniere = !manche.partie || manche.partie.numero >= manche.partie.nbManches || partie?.etat === "terminee";
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
        {salon && manche.salonCode && fin && <Podium code={manche.salonCode} fin={fin} />}
        <div className="res__head">
          <span className="lettre" aria-label={`Lettre ${manche.lettre}`}>
            {manche.lettre}
          </span>
          <h1>Tes points en {manche.lettre}</h1>
        </div>
        {manche.partie && partie && (
          <p className="res__partie">
            <span>{etiquetteManche(manche.partie.numero, manche.partie.nbManches, manche.partie.reglages)}</span>
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

        {manche.etat === "jugee" && !salon && <SignalerUneDecision manche={manche} />}

        {manche.etat === "jugee" && partie?.etat === "terminee" && <FinDePartie partie={partie} />}

        {salon && manche.salonCode && reponsesDeTous && (
          <Decouverte code={manche.salonCode} categories={reponsesDeTous.categories} contestation={reponsesDeTous.contestation} />
        )}

        {salon && manche.salonCode && <ApresMancheSalon code={manche.salonCode} mancheId={manche.id} salon={salon} />}

        {manche.salonCode && chat && <ChatSalon code={manche.salonCode} initial={chat} />}

        {manche.etat === "jugee" && <LegendePaliers />}

        {!salon && (
        <div className="res__actions">
          {defi ? null : manche.etat === "jugee" && !derniere && manche.partie ? (
            <form action={mancheSuivanteAction.bind(null, manche.partie.id)} className="choix-lettre">
              {manche.partie.reglages.choixLettre === "hote" && partie && (
                <ChoixLettre restantes={partie.lettresRestantes} titre="Choisis la lettre de la manche suivante" />
              )}
              <button className="btn btn--wide" type="submit">
                Manche suivante <span aria-hidden="true">→</span>
              </button>
            </form>
          ) : (
            <form action={lancerPartieLibre}>
              <input type="hidden" name="prereglage" value={partie?.prereglage ?? "classique"} />
              {partie?.reglages && <input type="hidden" name="depuis" value={partie.id} />}
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
      {partie.objectif !== null && (
        <p>
          Objectif de {partie.objectif} pts {partie.total >= partie.objectif ? "atteint" : "manqué : plus de lettres à jouer"}
        </p>
      )}
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
      {!finie && (
        <h2 id="cl-t" className="kick">
          Classement après la {etiquetteManche(salon.manche.numero, salon.manche.nbManches, salon.reglages).replace("Manche", "manche")}
        </h2>
      )}
      {!finie && (
      <ol className="classement">
        {salon.classement.map((j, i) => (
          <li key={j.pseudo + i} className={j.moi ? "is-me" : ""}>
            <span className="classement__r">{i + 1}</span>
            <span className="classement__n">{j.pseudo}</span>
            <span className="classement__p">{j.total}</span>
          </li>
        ))}
      </ol>
      )}
      <div className="res__actions">
        {finie ? (
          <Link className="btn btn--wide" href={`/salon/${code}`}>
            Rejouer <span aria-hidden="true">→</span>
          </Link>
        ) : !salon.manche.close ? (
          <p className="attente__p" role="status">
            On attend la fin de la manche pour tout le monde…
          </p>
        ) : (
          <>
            {salon.choixLettre && salon.reglages.choixLettre === "dernier" && <LettreDuDernier code={code} choix={salon.choixLettre} />}
            {salon.jeSuisHote ? (
              <form action={mancheSuivanteSalonAction.bind(null, code)} className="choix-lettre">
                {salon.choixLettre && salon.reglages.choixLettre === "hote" && (
                  <ChoixLettre restantes={salon.choixLettre.restantes} titre="Choisis la lettre de la manche suivante" />
                )}
                <button className="btn btn--wide" type="submit">
                  Manche suivante <span aria-hidden="true">→</span>
                </button>
              </form>
            ) : (
              <p className="attente__p" role="status">
                L&apos;hôte lance la manche {salon.manche.numero + 1} quand tout le monde est prêt.
              </p>
            )}
          </>
        )}
        <form action={quitterSalonAction.bind(null, code)}>
          <button className="btn btn--ink btn--wide" type="submit">
            Quitter le salon
          </button>
        </form>
      </div>
    </section>
  );
}

/**
 * En solo ou au Défi du jour : le Joueur signale la décision du Juge sur une de ses Réponses. Le Signalement est relu
 * plus tard (ticket 22) et ne change pas ses points d'ici là.
 */
function SignalerUneDecision({ manche }: { manche: Manche }) {
  const remplies = manche.reponses.filter((r) => r.id && r.saisie.trim() !== "");
  if (!remplies.length) return null;
  const envoyes = remplies.some((r) => r.signalee);
  return (
    <details className="signaler" open={envoyes}>
      <summary>Une décision du Juge te semble fausse ?</summary>
      <p className="signaler__p">Signale-la : elle sera relue. Tes points ne changent pas tout de suite.</p>
      <ul className="signaler__liste">
        {remplies.map((r) => (
          <li key={r.categorie}>
            <span className="signaler__rep">
              <b>{r.categorie}</b> · {r.formeReference ?? r.saisie} · {r.valide === false ? "refusée" : (r.palier ?? "acceptée")}
            </span>
            {r.signalee ? (
              <span className="signaler__fait" role="status">
                Signalement envoyé
              </span>
            ) : (
              <form action={signalerDecisionAction.bind(null, r.id!)}>
                <button className="lien-contester" type="submit">
                  Signaler
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Le dernier de la Manche choisit la Lettre de la suivante ; les autres voient qui choisit, sans la Lettre. */
function LettreDuDernier({ code, choix }: { code: string; choix: NonNullable<EtatPartieSalon["choixLettre"]> }) {
  if (!choix.moi) {
    return (
      <p className="attente__p" role="status">
        {choix.lettre ? `${choix.par} a choisi la lettre de la prochaine manche.` : `${choix.par}, dernier de la manche, choisit la lettre de la prochaine.`}
      </p>
    );
  }
  return (
    <form action={choisirLettreAction.bind(null, code)} className="choix-lettre">
      <ChoixLettre
        restantes={choix.restantes}
        titre={choix.lettre ? `Tu as choisi le ${choix.lettre}. Tu peux encore changer d'avis :` : "Dernier de la manche : à toi de choisir la prochaine lettre."}
        auHasard={false}
        choisie={choix.lettre}
      />
      <button className="btn btn--ink btn--wide" type="submit">
        {choix.lettre ? "Changer de lettre" : "Choisir cette lettre"}
      </button>
    </form>
  );
}

const MARCHES = ["1er", "2e", "3e"];

function Podium({ code, fin }: { code: string; fin: FinDePartie }) {
  const [premier, deuxieme, troisieme, ...suite] = fin.podium;
  const marches = [deuxieme, premier, troisieme];
  return (
    <section className="podium" aria-labelledby="podium-t">
      <h2 id="podium-t" className="sec">
        <span className="sec__hl">Partie terminée</span>
      </h2>
      <p className="kick">Salon {code} · {fin.nom}</p>
      <ol className="podium__marches">
        {marches.map((j, i) =>
          j ? (
            <li key={j.pseudo} className={`marche marche--${[2, 1, 3][i]} ${j.moi ? "is-me" : ""}`}>
              <span className="marche__n">{j.moi ? "Toi" : j.pseudo}</span>
              <span className="marche__p">{j.total} pts</span>
              <span className="marche__r">{MARCHES[[2, 1, 3][i] - 1]}</span>
            </li>
          ) : null,
        )}
      </ol>
      {suite.length > 0 && (
        <ol className="classement" start={4}>
          {suite.map((j, i) => (
            <li key={j.pseudo} className={j.moi ? "is-me" : ""}>
              <span className="classement__r">{i + 4}</span>
              <span className="classement__n">{j.pseudo}</span>
              <span className="classement__p">{j.total}</span>
            </li>
          ))}
        </ol>
      )}
      {fin.plusRare ? (
        <div className={`rare ${CLASSE_PALIER[fin.plusRare.palier] ?? ""}`}>
          <p className="kick">La réponse la plus rare</p>
          <p className="rare__rep">{fin.plusRare.reponse}</p>
          <p>
            {fin.plusRare.categorie} en {fin.plusRare.lettre} · par <b>{fin.plusRare.pseudo}</b> · {fin.plusRare.palier}, {fin.plusRare.points} pts
          </p>
        </div>
      ) : (
        <p className="attente__p">Aucune réponse valable cette partie : la prochaine sera la bonne.</p>
      )}
    </section>
  );
}
