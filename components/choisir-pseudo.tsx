"use client";

import { useActionState } from "react";
import { choisirPseudoAction, type EtatPseudo } from "@/app/actions";

export function ChoisirPseudo() {
  const [etat, action, enCours] = useActionState<EtatPseudo, FormData>(choisirPseudoAction, {});
  return (
    <section className="pseudo" aria-labelledby="pseudo-t">
      <h1 id="pseudo-t" className="pseudo__t">
        Ton <span className="sec__hl">pseudo</span>
      </h1>
      <p className="pseudo__p">C&apos;est le nom que verront les autres joueurs. Pas besoin de compte pour jouer.</p>
      <form className="pseudo__form" action={action}>
        <div className="field">
          <input
            id="pseudo"
            name="pseudo"
            type="text"
            defaultValue={etat.saisie}
            placeholder="Juju"
            aria-label="Ton pseudo"
            aria-describedby={etat.erreur ? "pseudo-err" : undefined}
            aria-invalid={etat.erreur ? true : undefined}
            autoComplete="nickname"
            maxLength={40}
            required
          />
        </div>
        <button className="btn" type="submit" disabled={enCours}>
          C&apos;est parti <span aria-hidden="true">→</span>
        </button>
      </form>
      {etat.erreur && (
        <p id="pseudo-err" className="pseudo__err" role="alert">
          {etat.erreur}
        </p>
      )}
    </section>
  );
}
