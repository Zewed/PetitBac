"use client";

import { useEffect, useState } from "react";
import type { SalonVu } from "@/lib/jeu/salons";

const RAFRAICHIR_MS = 1000;

/**
 * La liste des présents suit le Salon en direct. En attendant Supabase Realtime (ticket 29),
 * on relit le Salon chaque seconde : c'est le seul endroit à changer pour brancher le vrai temps réel.
 */
function useSalon(initial: SalonVu) {
  const [salon, setSalon] = useState(initial);
  useEffect(() => {
    let actif = true;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/salons/${initial.code}`, { cache: "no-store" });
        if (r.ok && actif) setSalon(await r.json());
      } catch {
        // une coupure réseau passagère : on réessaie à la seconde suivante
      }
    }, RAFRAICHIR_MS);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [initial.code]);
  return salon;
}

export function SalonAttente({ initial, lien, qr }: { initial: SalonVu; lien: string; qr: string }) {
  const salon = useSalon(initial);
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
              ? "Tout le monde est là ? La partie se lance bientôt d'ici."
              : "L'hôte lancera la partie quand tout le monde sera là."}
        </p>
      </section>
    </>
  );
}
