import { ORDRE_PREREGLAGES, PREREGLAGES, type IdPrereglage } from "@/lib/jeu/prereglages";

function duree(s: number) {
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

/** Les trois Préréglages en cartes cochables ; le record du Joueur sous chacun quand il en a un. */
export function ChoixPrereglage({ meilleurs = {} }: { meilleurs?: Partial<Record<IdPrereglage, number>> }) {
  return (
    <fieldset className="presets">
      <legend className="sr">Préréglage</legend>
      {ORDRE_PREREGLAGES.map((id) => {
        const p = PREREGLAGES[id];
        const record = meilleurs[id];
        return (
          <label key={id} className="preset">
            <input type="radio" name="prereglage" value={id} defaultChecked={id === "classique"} />
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
    </fieldset>
  );
}
