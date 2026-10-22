import Link from "next/link";
import { Suspense } from "react";
import { joueurCourant } from "@/lib/session";

export function Entete() {
  return (
    <header className="top">
      <div className="wrap top__in">
        <Link className="mark" href="/">
          Petit <span className="mark__hl">Bac</span>
        </Link>
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
    <span className="me">
      <span className="me__k">Ton pseudo</span>
      <span className="me__n">{joueur.pseudo}</span>
    </span>
  );
}
