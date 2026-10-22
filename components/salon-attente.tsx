"use client";

import { useState } from "react";
import { lancerPartieSalonAction } from "@/app/actions";
import { ChoixPrereglage } from "@/components/choix-prereglage";
import { SuiviSalon, type SalonEnDirect } from "@/components/suivi-salon";
import type { SalonVu } from "@/lib/jeu/salons";

export function SalonAttente({ initial, lien, qr }: { initial: SalonVu; lien: string; qr: string }) {
  const [salon, setSalon] = useState<SalonVu | SalonEnDirect>(initial);
  const [copie, setCopie] = useState<string | null>(null);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie("Lien copié : envoie-le à tes amis.");
    } catch {
      setCopie("Sélectionne le lien ci-dessus pour le copier.");
    }
  }

  return (
    <>
      <SuiviSalon code={initial.code} surSalon={setSalon} />
      <section className="invite" aria-labelledby="invite-t">
        <h1 id="invite-t" className="sec">
          <span className="sec__hl">Ton salon</span>
        </h1>
        <div className="invite__cols">
          <div className="invite__code">
            <p className="kick">Le code</p>
            <p className="invite__c">{salon.code}</p>
            <p className="invite__lien">{lien}</p>
            <button className="btn btn--ink" type="button" onClick={copier}>
              Copier le lien
            </button>
            {copie && (
              <p className="partage__msg" role="status">
                {copie}
              </p>
            )}
          </div>
          <div className="invite__qr" role="img" aria-label="QR code du salon" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
      </section>

      <section className="players" aria-labelledby="pl-t">
        <h2 id="pl-t" className="kick">
          Dans le salon · {salon.joueurs.length}/10
        </h2>
        <ol className="chips chips--salon">
          {salon.joueurs.map((j) => (
            <li key={j.pseudo + (j.moi ? "*" : "")} className={`chip ${j.moi ? "is-me" : ""}`}>
              <span className="chip__n">{j.pseudo}</span>
              <span className="chip__r">{j.hote ? "hôte" : j.moi ? "toi" : " "}</span>
            </li>
          ))}
        </ol>
        <p className="attente__p" role="status">
          {salon.enAttente
            ? "En attente d'au moins un autre joueur : envoie le lien ou montre le QR code."
            : salon.jeSuisHote
              ? "Tout le monde est là ? Choisis le préréglage et lance la partie."
              : "L'hôte lancera la partie quand tout le monde sera là."}
        </p>
      </section>

      {salon.jeSuisHote && (
        <form className="lancer" action={lancerPartieSalonAction.bind(null, initial.code)}>
          <h2 className="kick">Préréglage de la partie</h2>
          <ChoixPrereglage />
          <button className="btn btn--xl btn--wide" type="submit" disabled={salon.enAttente}>
            Lancer la partie <span aria-hidden="true">→</span>
          </button>
        </form>
      )}
    </>
  );
}
