"use client";

import { useState } from "react";

/** Partage le résultat : la feuille de partage du téléphone quand elle existe, sinon le presse-papier. */
export function BoutonPartager({ texte }: { texte: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [aLaMain, setALaMain] = useState(false);

  async function partager() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: texte });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(texte);
      setMessage("Résultat copié : colle-le où tu veux.");
    } catch {
      setALaMain(true);
      setMessage("Copie-le à la main :");
    }
  }

  return (
    <div className="partage">
      <button className="btn btn--ink btn--wide" type="button" onClick={partager}>
        Partager mon résultat
      </button>
      {message && (
        <p className="partage__msg" role="status">
          {message}
        </p>
      )}
      {aLaMain && <textarea className="partage__texte" readOnly value={texte} rows={5} aria-label="Ton résultat" />}
    </div>
  );
}
