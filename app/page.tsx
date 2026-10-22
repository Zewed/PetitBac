import { Suspense } from "react";
import { lancerPartieLibre } from "@/app/actions";
import { ChoisirPseudo } from "@/components/choisir-pseudo";
import { Entete } from "@/components/entete";
import { LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { records } from "@/lib/jeu/parties";
import { ORDRE_PREREGLAGES, PREREGLAGES } from "@/lib/jeu/prereglages";
import { joueurCourant } from "@/lib/session";

export default function Accueil() {
  return (
    <>
      <Entete />
      <main className="wrap acc acc--solo">
        <Suspense fallback={null}>
          <Contenu />
        </Suspense>
      </main>
    </>
  );
}

function duree(s: number) {
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

async function Contenu() {
  const joueur = await joueurCourant();
  if (!joueur) return <ChoisirPseudo />;
  const meilleurs = await records(await obtenirDb(), joueur.id);
  return (
    <>
      <section className="seul" aria-labelledby="seul-t">
        <h2 id="seul-t" className="sec">
          <span className="sec__hl">Seul</span>
        </h2>
        <form action={lancerPartieLibre} className="seul__form">
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
          <button className="libre" type="submit">
            <span className="libre__t">
              Partie libre <span aria-hidden="true">→</span>
            </span>
            <span className="libre__p">
              Plus ta réponse est rare, plus elle rapporte. Une lettre ne revient jamais deux fois dans la partie. « J&apos;ai
              fini » arrête le chrono.
            </span>
          </button>
        </form>
      </section>
      <LegendePaliers />
    </>
  );
}
