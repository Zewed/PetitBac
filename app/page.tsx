import { Suspense } from "react";
import Link from "next/link";
import { lancerDefi, lancerPartieLibre } from "@/app/actions";
import { ChoisirPseudo } from "@/components/choisir-pseudo";
import { Entete } from "@/components/entete";
import { LegendePaliers } from "@/components/paliers";
import { obtenirDb } from "@/db/client";
import { DernierResultat } from "@/components/dernier-resultat";
import { Serie } from "@/components/serie";
import { jourAParis, jourEnToutesLettres, monDefi, NB_CATEGORIES_DEFI } from "@/lib/jeu/defi";
import { positionAuDefi } from "@/lib/jeu/classement";
import { dernierResultat, serie } from "@/lib/jeu/serie";
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
  const db = await obtenirDb();
  const meilleurs = await records(db, joueur.id);
  const defi = await monDefi(db, joueur.id);
  const [laSerie, resultat] = await Promise.all([serie(db, joueur.id), dernierResultat(db, joueur.id)]);
  const position = resultat ? await positionAuDefi(db, joueur.id, resultat.numero) : null;
  return (
    <>
      <BlocDefi {...defi} />
      <Serie {...laSerie} numeroDuJour={defi.defi.numero} />
      {resultat && <DernierResultat resultat={resultat} aujourdHui={jourAParis(new Date())} position={position} />}
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

function BlocDefi({ defi, mancheId, etat, total }: Awaited<ReturnType<typeof monDefi>>) {
  const fait = etat !== null && etat !== "en_cours";
  return (
    <section className="defi" aria-labelledby="defi-t">
      <div className="defi__ink" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="defi__head">
        <div className="defi__titles">
          <p className="kick">{jourEnToutesLettres(new Date())}</p>
          <h1 id="defi-t" className="defi__t">
            Défi du jour <span className="defi__n">n°{defi.numero}</span>
          </h1>
        </div>
        <div className="secret">
          <span className="secret__q" aria-hidden="true">
            {fait ? defi.lettre : "?"}
          </span>
          <span className="secret__k">{fait ? `Lettre ${defi.lettre}` : "Lettre cachée"}</span>
        </div>
      </div>
      <ul className="stats">
        <li>
          <b>{NB_CATEGORIES_DEFI}</b>
          <span>catégories</span>
        </li>
        <li>
          <b>3 min</b>
          <span>de chrono</span>
        </li>
        <li>
          <b>1</b>
          <span>seul essai</span>
        </li>
      </ul>
      {fait && mancheId ? (
        <>
          <p className="defi__note">
            Défi fait : <b>{etat === "jugee" ? `${total} pts` : "points en attente du Juge"}</b>. Reviens demain pour le suivant.
          </p>
          <Link className="btn btn--xl btn--wide defi__go" href={`/manche/${mancheId}`}>
            Voir mon résultat <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : (
        <>
          <p className="defi__note">La lettre reste cachée jusqu&apos;au départ. La même pour tout le monde.</p>
          <form action={lancerDefi}>
            <button className="btn btn--xl btn--wide defi__go" type="submit">
              {mancheId ? "Reprendre le défi" : `Lancer le défi n°${defi.numero}`} <span aria-hidden="true">→</span>
            </button>
          </form>
        </>
      )}
      <p className="defi__mid">Nouveau défi à minuit, heure de Paris</p>
    </section>
  );
}
