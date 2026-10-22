"use client";

import { useEffect, useRef, useState } from "react";
import { ALPHABET, LETTRES_EXCLUES_PAR_DEFAUT } from "@/lib/jeu/lettres";
import { PREREGLAGES } from "@/lib/jeu/prereglages";
import { DUREES_S, GRACE_MAX_S, GRACE_PAR_DEFAUT_S, lireReglages, MANCHES_MAX, MANCHES_MIN, OBJECTIF_MAX, OBJECTIF_MIN } from "@/lib/jeu/reglages";

function duree(s: number) {
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

const NB_CATEGORIES = PREREGLAGES.personnalise.nbCategories;

/**
 * Les Réglages d'une Partie Personnalisée, dans le formulaire qui la lance. Ils sont vérifiés à chaque changement,
 * avec la même règle que le serveur : tant qu'ils ne tiennent pas, le formulaire ne part pas et dit pourquoi.
 */
export function ReglagesPersonnalises({ salon }: { salon: boolean }) {
  const racine = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"nombre" | "points">("nombre");
  const [lettres, setLettres] = useState<string[]>(() => ALPHABET.filter((l) => !LETTRES_EXCLUES_PAR_DEFAUT.includes(l)));
  const [choixLettre, setChoixLettre] = useState("hasard");
  const [stop, setStop] = useState(true);
  const [stopDes, setStopDes] = useState<"complete" | "cases">("complete");
  const [grace, setGrace] = useState(GRACE_PAR_DEFAUT_S);
  const [erreur, setErreur] = useState<string | null>(null);

  function verifier() {
    const form = racine.current?.closest("form");
    if (!form) return;
    const r = lireReglages(new FormData(form), { salon });
    const message = r.ok ? null : r.erreur;
    setErreur(message);
    form.querySelector<HTMLInputElement>('input[name="prereglage"][value="personnalise"]')?.setCustomValidity(message ?? "");
  }

  useEffect(() => {
    verifier();
    const radio = racine.current?.closest("form")?.querySelector<HTMLInputElement>('input[name="prereglage"][value="personnalise"]');
    // Les Réglages se ferment quand on revient à un Préréglage : le formulaire ne doit plus rien leur demander.
    return () => radio?.setCustomValidity("");
  });

  function basculer(l: string) {
    setLettres((avant) => (avant.includes(l) ? avant.filter((x) => x !== l) : ALPHABET.filter((x) => avant.includes(x) || x === l)));
  }

  return (
    <div className="reglages" ref={racine} onInput={verifier}>
      <fieldset className="reglage">
        <legend className="kick">Manches</legend>
        <div className="reglage__choix">
          <label className="option">
            <input type="radio" name="manches_mode" value="nombre" checked={mode === "nombre"} onChange={() => setMode("nombre")} />
            <span>Nombre de manches</span>
          </label>
          <label className="option">
            <input type="radio" name="manches_mode" value="points" checked={mode === "points"} onChange={() => setMode("points")} />
            <span>Le premier à X points gagne</span>
          </label>
        </div>
        {mode === "nombre" ? (
          <label className="reglage__val">
            <span>Manches</span>
            <input className="nombre" type="number" name="nb_manches" min={MANCHES_MIN} max={MANCHES_MAX} defaultValue={5} required />
            <small>de {MANCHES_MIN} à {MANCHES_MAX}</small>
          </label>
        ) : (
          <label className="reglage__val">
            <span>Objectif</span>
            <input className="nombre" type="number" name="objectif" min={OBJECTIF_MIN} max={OBJECTIF_MAX} step={5} defaultValue={100} required />
            <small>points</small>
          </label>
        )}
      </fieldset>

      <fieldset className="reglage">
        <legend className="kick">Lettres · {lettres.length} cochées</legend>
        <div className="lettres-choix">
          {ALPHABET.map((l) => (
            <label key={l} className="lettre-c">
              <input type="checkbox" name="lettres" value={l} checked={lettres.includes(l)} onChange={() => basculer(l)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
        <p className="reglage__aide">Une lettre ne revient pas deux fois dans une partie.</p>
        <div className="reglage__choix">
          <label className="option">
            <input type="radio" name="choix_lettre" value="hasard" checked={choixLettre === "hasard"} onChange={() => setChoixLettre("hasard")} />
            <span>Tirée au hasard</span>
          </label>
          <label className="option">
            <input type="radio" name="choix_lettre" value="hote" checked={choixLettre === "hote"} onChange={() => setChoixLettre("hote")} />
            <span>{salon ? "Choisie par l'hôte" : "Choisie par toi"}</span>
          </label>
          {salon && (
            <label className="option">
              <input type="radio" name="choix_lettre" value="dernier" checked={choixLettre === "dernier"} onChange={() => setChoixLettre("dernier")} />
              <span>Choisie par le dernier de la manche précédente</span>
            </label>
          )}
        </div>
        {choixLettre === "hote" && (
          <label className="reglage__val">
            <span>Lettre de la 1re manche</span>
            <select className="nombre" name="lettre" defaultValue="">
              <option value="">Au hasard</option>
              {lettres.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
        {choixLettre === "dernier" && <p className="reglage__aide">La 1re lettre est tirée au hasard.</p>}
      </fieldset>

      <fieldset className="reglage">
        <legend className="kick">Chrono</legend>
        <label className="reglage__val">
          <span>Par manche</span>
          <select className="nombre" name="duree" defaultValue="90">
            {DUREES_S.map((s) => (
              <option key={s} value={s}>
                {duree(s)}
              </option>
            ))}
            <option value="sans">Sans limite</option>
          </select>
        </label>
      </fieldset>

      {salon && (
        <fieldset className="reglage">
          <legend className="kick">STOP</legend>
          <label className="option">
            <input type="checkbox" name="stop" checked={stop} onChange={(e) => setStop(e.target.checked)} />
            <span>On peut dire STOP</span>
          </label>
          {stop && (
            <>
              <div className="reglage__choix">
                <label className="option">
                  <input type="radio" name="stop_des" value="complete" checked={stopDes === "complete"} onChange={() => setStopDes("complete")} />
                  <span>Dès que la grille est complète</span>
                </label>
                <label className="option">
                  <input type="radio" name="stop_des" value="cases" checked={stopDes === "cases"} onChange={() => setStopDes("cases")} />
                  <span>Dès quelques cases remplies</span>
                </label>
              </div>
              {stopDes === "cases" && (
                <label className="reglage__val">
                  <span>Cases remplies</span>
                  <input className="nombre" type="number" name="stop_cases" min={1} max={NB_CATEGORIES} defaultValue={NB_CATEGORIES - 2} required />
                  <small>sur {NB_CATEGORIES}</small>
                </label>
              )}
              <label className="reglage__val">
                <span>Temps de grâce</span>
                <input type="range" name="grace" min={0} max={GRACE_MAX_S} value={grace} onChange={(e) => setGrace(Number(e.target.value))} />
                <small>{grace} s</small>
              </label>
            </>
          )}
          {!stop && <input type="hidden" name="grace" value={grace} />}
        </fieldset>
      )}

      {salon && (
        <fieldset className="reglage">
          <legend className="kick">Contestation</legend>
          <label className="option">
            <input type="checkbox" name="contestation" defaultChecked />
            <span>On peut contester une décision du Juge</span>
          </label>
        </fieldset>
      )}

      <p className="reglage__aide">Le barème ne change pas : un Palier rapporte les mêmes points quel que soit le réglage.</p>
      {erreur && (
        <p className="pseudo__err" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
