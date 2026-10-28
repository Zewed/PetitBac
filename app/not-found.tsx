import Link from "next/link";
import { Entete } from "@/components/entete";

/** Une page qui n'existe pas, ou qui n'est pas pour toi (/admin). */
export default function Introuvable() {
  return (
    <>
      <Entete />
      <main className="wrap compte">
        <section className="pseudo" aria-labelledby="introuvable-t">
          <h1 id="introuvable-t" className="pseudo__t">
            Page <span className="sec__hl">introuvable</span>
          </h1>
          <p className="pseudo__p">Cette page n&apos;existe pas, ou elle n&apos;est pas pour toi.</p>
          <Link className="ink-link" href="/">
            Retour à l&apos;accueil
          </Link>
        </section>
      </main>
    </>
  );
}
