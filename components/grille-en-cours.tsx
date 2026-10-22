"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { direStopAction, enregistrerAction, terminerAction } from "@/app/actions";
import { ChatFerme } from "@/components/chat-salon";
import { SuiviSalon } from "@/components/suivi-salon";

type Props = {
  id: string;
  lettre: string;
  categories: string[];
  saisies: Record<string, string>;
  finitLe: string;
  maintenantServeur: string;
  dureeS: number;
  titre: string;
  etiquette: string;
  /** Une Partie Personnalisée sans limite de temps : pas de chrono, jusqu'au STOP ou à « J'ai fini ». */
  sansLimite?: boolean;
  /**
   * Entre amis : le Salon, le classement avant cette Manche et le STOP tel que la Partie le règle (désactivé, ou possible
   * dès un certain nombre de cases). Pas de « J'ai fini » : la Manche s'arrête pour tous à la fin du chrono ou au STOP.
   */
  salon?: {
    code: string;
    titreScores: string;
    scores: { pseudo: string; total: number; moi: boolean }[];
    stopPar: string | null;
    stop: { actif: boolean; cases: number; graceS: number };
  };
};

function formater(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** La Grille d'une Manche : le chrono suit l'heure de fin donnée par le serveur, pas l'horloge du téléphone. */
export function GrilleEnCours({ id, lettre, categories, saisies, finitLe, maintenantServeur, dureeS, titre, etiquette, sansLimite = false, salon }: Props) {
  const [valeurs, setValeurs] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c, saisies[c] ?? ""])),
  );
  const decalage = useRef<number | null>(null);
  const [resteMs, setResteMs] = useState(() => new Date(finitLe).getTime() - new Date(maintenantServeur).getTime());
  const [fini, startFin] = useTransition();
  const [termineEtat, setTermine] = useState(false);
  const termine = useRef(false);
  const aSauver = useRef<Record<string, string>>({});
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valeursRef = useRef(valeurs);
  useEffect(() => {
    valeursRef.current = valeurs;
  }, [valeurs]);

  const terminer = useCallback(() => {
    if (termine.current) return;
    termine.current = true;
    setTermine(true);
    startFin(() => terminerAction(id, valeursRef.current));
  }, [id]);

  useEffect(() => {
    decalage.current ??= new Date(maintenantServeur).getTime() - Date.now();
    const tic = () => {
      const reste = new Date(finitLe).getTime() - (Date.now() + (decalage.current ?? 0));
      setResteMs(reste);
      if (reste <= 0) terminer();
    };
    tic();
    const t = setInterval(tic, 250);
    return () => clearInterval(t);
  }, [finitLe, maintenantServeur, terminer]);

  function ecrire(categorie: string, valeur: string) {
    setValeurs((v) => ({ ...v, [categorie]: valeur }));
    aSauver.current[categorie] = valeur;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const lot = aSauver.current;
      aSauver.current = {};
      void enregistrerAction(id, lot);
    }, 500);
  }

  const [erreurStop, setErreurStop] = useState<string | null>(null);
  const [stopEnCours, startStop] = useTransition();

  function direStop() {
    startStop(async () => {
      const r = await direStopAction(id, valeursRef.current);
      if (r.ok) {
        termine.current = true;
        setTermine(true);
      } else setErreurStop(r.erreur);
    });
  }

  const resteS = Math.max(0, Math.ceil(resteMs / 1000));
  const remplies = categories.filter((c) => valeurs[c].trim() !== "").length;
  const ferme = fini || resteS === 0 || termineEtat;
  // Sans limite, le chrono n'apparaît qu'après un STOP : il compte alors le Temps de grâce.
  const sansChrono = sansLimite && !salon?.stopPar;
  const stop = salon?.stop;
  const manquent = stop ? Math.max(0, stop.cases - remplies) : 0;

  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Link className="quit" href="/">
            <span aria-hidden="true">←</span> Quitter
          </Link>
          <p className="salon">
            <b>{titre}</b>
          </p>
        </div>
      </header>
      <main className="wrap game">
        <section className="tirage" aria-label="Lettre et chrono">
          <div className="letter" role="img" aria-label={`Lettre ${lettre}`}>
            <span className="letter__ink" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="letter__c" aria-hidden="true">
              {lettre}
            </span>
          </div>
          <div className="clock">
            <p className="clock__round">{etiquette}</p>
            {sansChrono ? (
              <>
                <p className="clock__t clock__t--libre" aria-label="Sans limite de temps">
                  ∞
                </p>
                <p className="clock__of">{salon ? "jusqu'au STOP" : "pas de chrono"}</p>
              </>
            ) : (
              <>
                <p className="clock__t" aria-live="off">
                  {formater(resteS)}
                </p>
                <p className="clock__of">{sansLimite ? "pour finir ta grille" : `restantes sur ${formater(dureeS)}`}</p>
              </>
            )}
          </div>
          {!sansChrono && (
            <div className="timebar" role="img" aria-label={`Chrono : ${resteS} secondes restantes sur ${dureeS}`}>
              <span className="timebar__ink" style={{ width: `${Math.min(100, (resteS / (sansLimite ? Math.max(1, salon?.stop.graceS ?? 1) : dureeS)) * 100)}%` }} />
            </div>
          )}
        </section>

        {salon && (
          <section className="players" aria-labelledby="pl-t">
            <SuiviSalon code={salon.code} mancheId={id} />
            <h2 id="pl-t" className="kick">
              {salon.titreScores}
            </h2>
            <ol className="chips">
              {salon.scores.map((j) => (
                <li key={j.pseudo + (j.moi ? "*" : "")} className={`chip ${j.moi ? "is-me" : ""}`}>
                  <span className="chip__n">{j.pseudo}</span>
                  <span className="chip__p">
                    {j.total}
                    {j.moi && <small>toi</small>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {salon && <ChatFerme />}

        <section className="grille" aria-labelledby="grille-t">
          <div className="grille__head">
            <h1 id="grille-t">Ta grille en {lettre}</h1>
            <p>
              <b>{remplies}</b>/{categories.length} remplies
            </p>
          </div>
          <div className="rows">
            {categories.map((categorie, i) => {
              const champ = `c${i + 1}`;
              const rempli = valeurs[categorie].trim() !== "";
              return (
                <div key={categorie} className={`row ${rempli ? "is-done" : ""}`}>
                  <label className="cat" htmlFor={champ}>
                    {categorie}
                  </label>
                  <input
                    className="ans"
                    id={champ}
                    type="text"
                    value={valeurs[categorie]}
                    placeholder={`${lettre}…`}
                    autoComplete="off"
                    autoCapitalize="sentences"
                    spellCheck={false}
                    maxLength={60}
                    readOnly={ferme}
                    onChange={(e) => ecrire(categorie, e.target.value)}
                  />
                  {rempli ? (
                    <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 13.5l5 5.5L20.5 5" />
                    </svg>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {salon && stop && !stop.actif ? (
          <div className="stop">
            <p className="stop__hint stop__hint--seul">
              {ferme ? "Le Juge corrige les grilles de tout le monde…" : "Pas de STOP dans cette partie : la manche s'arrête au bout du chrono."}
            </p>
          </div>
        ) : salon && stop ? (
          <div className="stop">
            {salon.stopPar && !ferme && (
              <p className="stop__annonce" role="alert">
                <b>STOP de {salon.stopPar} !</b> Plus que {resteS} s pour finir ta grille.
              </p>
            )}
            <button
              className="stop__btn"
              type="button"
              onClick={direStop}
              disabled={ferme || stopEnCours || manquent > 0 || salon.stopPar !== null}
              aria-describedby="stop-h"
            >
              <span className="stop__fill" aria-hidden="true" style={{ width: `${(remplies / categories.length) * 100}%` }} />
              <span className="stop__w">STOP</span>
              <span className="stop__n">
                <b>{remplies}</b>/{categories.length}
              </span>
            </button>
            <p className="stop__hint" id="stop-h" role={erreurStop ? "alert" : undefined}>
              {erreurStop ??
                (ferme
                  ? "Le Juge corrige les grilles de tout le monde…"
                  : salon.stopPar
                    ? "Un seul STOP compte par manche."
                    : manquent > 0
                      ? `Encore ${manquent} case${manquent > 1 ? "s" : ""} à remplir pour dire STOP.`
                      : remplies < categories.length
                        ? `Tu peux dire STOP : les autres n'auront plus que ${stop.graceS} s.`
                        : `Ta grille est pleine : dis STOP, les autres n'auront plus que ${stop.graceS} s.`)}
            </p>
          </div>
        ) : (
          <div className="fini stop">
            <button className="btn btn--xl" type="button" onClick={terminer} disabled={ferme}>
              {ferme ? "Le Juge corrige ta grille…" : "J'ai fini"}
            </button>
            <p className="fini__hint">{ferme ? "Tes points arrivent." : "La vitesse ne rapporte aucun point : prends ton temps."}</p>
          </div>
        )}
      </main>
    </>
  );
}
