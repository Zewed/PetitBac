"use client";

import { useState } from "react";
import { ReglagesPersonnalises } from "@/components/reglages-personnalises";
import { ORDRE_PREREGLAGES, PREREGLAGES, type IdPrereglage } from "@/lib/jeu/prereglages";
import type { RegleVue } from "@/lib/jeu/regles";

function duree(s: number) {
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

/**
 * Les Préréglages en cartes cochables, et « Personnalisé » ; le record du Joueur sous chacun quand il en a un.
 * Avec `reglages`, choisir « Personnalisé » ouvre les Réglages sous les cartes : en Partie libre, ou pour l'Hôte d'un Salon.
 */
export function ChoixPrereglage({
  meilleurs = {},
  defaut = "classique",
  reglages,
  regles = [],
}: {
  meilleurs?: Partial<Record<IdPrereglage, number>>;
  defaut?: IdPrereglage;
  reglages?: "solo" | "salon";
  /** « Mes règles » du Joueur, en cartes après les Préréglages ; rien quand il n'en a pas. */
  regles?: RegleVue[];
}) {
  const [choix, setChoix] = useState<string>(defaut);
  return (
    <>
      <fieldset className="presets">
        <legend className="sr">Préréglage</legend>
        {ORDRE_PREREGLAGES.map((id) => {
          const p = PREREGLAGES[id];
          const record = meilleurs[id];
          return (
            <label key={id} className="preset">
              <input type="radio" name="prereglage" value={id} checked={choix === id} onChange={() => setChoix(id)} />
              {id === "classique" && <span className="preset__tag">par défaut</span>}
              <span className="preset__n">{p.nom}</span>
              <span className="preset__d">{p.nbCategories} catégories</span>
              <span className="preset__d">
                {duree(p.dureeS)} · {p.nbManches} manches
              </span>
              {record !== undefined && <span className="preset__rec">Record {record} pts</span>}
            </label>
          );
        })}
        <label className="preset">
          <input type="radio" name="prereglage" value="personnalise" checked={choix === "personnalise"} onChange={() => setChoix("personnalise")} />
          <span className="preset__n">Personnalisé</span>
          <span className="preset__d">Tout à ta façon :</span>
          <span className="preset__d">{reglages === "solo" ? "chrono, lettres…" : "chrono, lettres, STOP"}</span>
        </label>
        {regles.length > 0 && <p className="presets__mes kick">Mes règles</p>}
        {regles.map((r) => (
          <label key={r.id} className="preset preset--regle">
            <input type="radio" name="prereglage" value={`regle:${r.id}`} checked={choix === `regle:${r.id}`} onChange={() => setChoix(`regle:${r.id}`)} />
            <span className="preset__n">{r.nom}</span>
            <span className="preset__d preset__d--long">{r.resume}</span>
          </label>
        ))}
      </fieldset>
      {reglages && choix === "personnalise" && <ReglagesPersonnalises salon={reglages === "salon"} />}
    </>
  );
}
