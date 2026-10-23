import Link from "next/link";
import { Suspense } from "react";
import { joueurCourant } from "@/lib/session";

/** L'en-tête : le logo et le pseudo. Sur l'accueil, une étoile griffonnée au bille entre les deux. */
export function Entete({ etoile = false }: { etoile?: boolean }) {
  return (
    <header className="top">
      <div className="wrap top__in">
        <Link className="mark" href="/">
          Petit <span className="mark__hl">Bac</span>
        </Link>
        {etoile && (
          <svg className="gri gri--etoile" viewBox="0 0 60 40" aria-hidden="true">
            <path d="M20 6l3.6 10.4 11 .3-8.7 6.6 3.2 10.5-9.1-6.3-9 6.4 3-10.6-8.8-6.5 11-.4z" />
            <path d="M44 10l3 5M52 8l-2 6M50 22l6 1" />
          </svg>
        )}
        <Suspense fallback={null}>
          <Pseudo />
        </Suspense>
      </div>
    </header>
  );
}

async function Pseudo() {
  const joueur = await joueurCourant();
  if (!joueur) return null;
  return (
    <Link className="me" href="/compte" aria-label={`Ton pseudo : ${joueur.pseudo}. Ton compte`}>
      <span className="me__k">Ton pseudo</span>
      <span className="me__n">{joueur.pseudo}</span>
    </Link>
  );
}
