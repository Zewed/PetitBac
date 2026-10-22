"use client";

import { useState } from "react";
import { ReglagesPersonnalises } from "@/components/reglages-personnalises";
import { ORDRE_PREREGLAGES, PREREGLAGES, type IdPrereglage } from "@/lib/jeu/prereglages";

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
}: {
  meilleurs?: Partial<Record<IdPrereglage, number>>;
  defaut?: IdPrereglage;
  reglages?: "solo" | "salon";
}) {
  const [choix, setChoix] = useState<IdPrereglage>(defaut);
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
          <span className="preset__d">{reglages === "solo" ? "chrono, lettres, manches" : "chrono, lettres, STOP"}</span>
        </label>
      </fieldset>
      {reglages && choix === "personnalise" && <ReglagesPersonnalises salon={reglages === "salon"} />}
    </>
  );
}
