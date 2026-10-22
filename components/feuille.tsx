"use client";

import { useEffect, useRef } from "react";

/**
 * Une feuille qui monte du bas par-dessus la page assombrie (une <dialog> modale), pour choisir un Préréglage
 * sans quitter l'accueil. Son bord du haut prend le surligneur de la tuile qui l'ouvre : jaune, ou vert pour la Partie libre.
 */
export function Feuille({
  ouverte,
  onFermer,
  kick,
  titre,
  libre = false,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  kick: string;
  titre: string;
  libre?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${libre ? "sheet--libre" : ""}`}
      aria-label={`Préréglage ${titre}`}
      onClose={onFermer}
      // Un toucher sur la page assombrie, hors de la feuille, la referme.
      onClick={(e) => e.target === e.currentTarget && onFermer()}
    >
      <span className="sheet__grip" aria-hidden="true" />
      <div className="sheet__corps">
        <div className="sheet__head">
          <p className="kick">{kick}</p>
          <button className="quit" type="button" onClick={onFermer}>
            <span aria-hidden="true">×</span> Fermer
          </button>
        </div>
        <p className="sheet__t" aria-hidden="true">
          <span className="sheet__hl">Préréglage</span> {titre}
        </p>
        {children}
      </div>
    </dialog>
  );
}
