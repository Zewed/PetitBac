import { Suspense } from "react";
import { lancerPartieLibre } from "@/app/actions";
import { ChoisirPseudo } from "@/components/choisir-pseudo";
import { Entete } from "@/components/entete";
import { LegendePaliers } from "@/components/paliers";
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

async function Contenu() {
  const joueur = await joueurCourant();
  if (!joueur) return <ChoisirPseudo />;
  return (
    <>
      <section className="seul" aria-labelledby="seul-t">
        <h2 id="seul-t" className="sec">
          <span className="sec__hl">Seul</span>
        </h2>
        <form action={lancerPartieLibre}>
          <button className="libre" type="submit">
            <span className="libre__t">
              Partie libre <span aria-hidden="true">→</span>
            </span>
            <span className="libre__p">
              Une lettre, six catégories, 1 min 30. Plus ta réponse est rare, plus elle rapporte. « J&apos;ai fini » arrête le
              chrono.
            </span>
          </button>
        </form>
      </section>
      <LegendePaliers />
    </>
  );
}
