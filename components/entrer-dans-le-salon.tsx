"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rejoindreAction } from "@/app/actions";

/** Un Joueur qui ouvre le lien d'un Salon y entre tout de suite, ou apprend pourquoi il ne peut pas. */
export function EntrerDansLeSalon({ code }: { code: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    rejoindreAction(code).then((r) => {
      if (r && !r.ok) setErreur(r.erreur);
    });
  }, [code]);
  if (!erreur) return <p className="attente__p">On t&apos;ouvre la porte du salon…</p>;
  return (
    <section className="panne" role="alert">
      <p className="panne__t">{erreur}</p>
      <Link className="btn" href="/">
        Retour à l&apos;accueil
      </Link>
    </section>
  );
}
