import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Suspense } from "react";
import { ChoisirPseudo } from "@/components/choisir-pseudo";
import { EntrerDansLeSalon } from "@/components/entrer-dans-le-salon";
import { SalonAttente } from "@/components/salon-attente";
import { obtenirDb } from "@/db/client";
import { estExclu, lireChat } from "@/lib/jeu/chat";
import { mesRegles } from "@/lib/jeu/regles";
import { etatPartieSalon } from "@/lib/jeu/partie-salon";
import { marquerPresent } from "@/lib/jeu/presence";
import { codeDepuisSaisie, lireSalon } from "@/lib/jeu/salons";
import { joueurCourant } from "@/lib/session";

export default function PageSalon({ params }: PageProps<"/salon/[code]">) {
  return (
    <>
      <header className="top">
        <div className="wrap top__in">
          <Link className="quit" href="/">
            <span aria-hidden="true">←</span> Accueil
          </Link>
          <p className="salon">
            <b>Salon</b>
          </p>
        </div>
      </header>
      <main className="wrap attente">
        <Suspense fallback={null}>
          <Ecran params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Ecran({ params }: { params: Promise<{ code: string }> }) {
  const code = codeDepuisSaisie((await params).code);
  const joueur = await joueurCourant();
  if (!joueur) return <ChoisirPseudo />;
  const db = await obtenirDb();
  await marquerPresent(db, code, joueur.id);
  const salon = await lireSalon(db, code, joueur.id);
  if (!salon && (await estExclu(db, code, joueur.id))) {
    return (
      <section className="pseudo" role="alert">
        <h1 className="pseudo__t">Tu as été exclu de ce salon</h1>
        <p className="pseudo__p">L&apos;hôte t&apos;a exclu : tu ne peux plus y revenir. Crée ton propre salon depuis l&apos;accueil.</p>
        <Link className="btn btn--ink" href="/">
          Retour à l&apos;accueil
        </Link>
      </section>
    );
  }
  if (!salon) return <EntrerDansLeSalon code={code} />;
  const partie = (await etatPartieSalon(db, code, joueur.id)) ?? null;
  const entetes = await headers();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host") ?? "localhost:3000";
  const protocole = entetes.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  const lien = `${protocole}://${hote}/salon/${salon.code}`;
  const qr = await QRCode.toString(lien, { type: "svg", margin: 1, color: { dark: "#15161f", light: "#ffffff" } });
  const chat = (await lireChat(db, code, joueur.id))!;
  const regles = salon.jeSuisHote ? await mesRegles(db, joueur.id) : [];
  return <SalonAttente initial={{ ...salon, partie }} lien={lien} qr={qr} chat={chat} regles={regles} />;
}
