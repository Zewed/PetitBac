"use client";

import { useActionState } from "react";
import { rejoindreParCodeAction, type EtatRejoindre } from "@/app/actions";

export function RejoindreSalon() {
  const [etat, action, enCours] = useActionState<EtatRejoindre, FormData>(rejoindreParCodeAction, {});
  return (
    <>
      <form className="join" action={action}>
        <div className="field">
          <input
            id="code-salon"
            name="code"
            type="text"
            defaultValue={etat.saisie}
            placeholder="Code ou lien"
            aria-label="Code ou lien du salon"
            aria-invalid={etat.erreur ? true : undefined}
            aria-describedby={etat.erreur ? "code-err" : undefined}
            autoComplete="off"
            autoCapitalize="characters"
            required
          />
        </div>
        <button className="btn btn--ink" type="submit" disabled={enCours}>
          Rejoindre
        </button>
      </form>
      {etat.erreur && (
        <p id="code-err" className="pseudo__err join__err" role="alert">
          {etat.erreur}
        </p>
      )}
    </>
  );
}
