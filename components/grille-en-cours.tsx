"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { enregistrerAction, terminerAction } from "@/app/actions";
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
  /** Entre amis : le Salon, et le classement avant cette Manche. Pas de « J'ai fini » : la Manche s'arrête pour tous à la fin du chrono. */
  salon?: { code: string; titreScores: string; scores: { pseudo: string; total: number; moi: boolean }[] };
};

function formater(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** La Grille d'une Manche : le chrono suit l'heure de fin donnée par le serveur, pas l'horloge du téléphone. */
export function GrilleEnCours({ id, lettre, categories, saisies, finitLe, maintenantServeur, dureeS, titre, etiquette, salon }: Props) {
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

  const resteS = Math.max(0, Math.ceil(resteMs / 1000));
  const remplies = categories.filter((c) => valeurs[c].trim() !== "").length;
  const ferme = fini || resteS === 0 || termineEtat;

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
            <p className="clock__t" aria-live="off">
              {formater(resteS)}
            </p>
            <p className="clock__of">restantes sur {formater(dureeS)}</p>
          </div>
          <div className="timebar" role="img" aria-label={`Chrono : ${resteS} secondes restantes sur ${dureeS}`}>
            <span className="timebar__ink" style={{ width: `${Math.min(100, (resteS / dureeS) * 100)}%` }} />
          </div>
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

        {salon ? (
          <p className="fini__hint fini__hint--salon">
            {ferme ? "Le Juge corrige les grilles de tout le monde…" : "La manche s'arrête pour tout le monde à la fin du chrono."}
          </p>
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
