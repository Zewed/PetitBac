import { BoutonPartager } from "@/components/bouton-partager";
import { CLASSE_PALIER } from "@/components/paliers";
import { texteDePartage, type Resultat } from "@/lib/jeu/serie";

const LIBELLE: Record<string, string> = { Banal: "Banal", Courant: "Courant", Rare: "Rare", "Très rare": "Très rare", Légendaire: "Légendaire" };

function quand(date: string, aujourdHui: string): string {
  if (date === aujourdHui) return "Aujourd'hui";
  const veille = new Date(Date.parse(`${aujourdHui}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (date === veille) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export function DernierResultat({ resultat, aujourdHui }: { resultat: Resultat; aujourdHui: string }) {
  const compte = new Map<string, number>();
  for (const p of resultat.cases) compte.set(p ?? "vide", (compte.get(p ?? "vide") ?? 0) + 1);
  const description = [...compte].map(([p, n]) => `${n} ${p === "vide" ? "à 0 point" : LIBELLE[p]}`).join(", ");
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${resultat.date}T12:00:00Z`),
  );
  return (
    <section className="hier" aria-labelledby="hier-t">
      <div className="hier__head">
        <h2 id="hier-t">
          {quand(resultat.date, aujourdHui)} · défi n°{resultat.numero}
        </h2>
        <span className="lettre" aria-label={`Lettre ${resultat.lettre}`}>
          {resultat.lettre}
        </span>
        <span className="hier__date">{date}</span>
      </div>
      <div className="dabs" role="img" aria-label={`Ton résultat : ${resultat.cases.length} cases, une par catégorie. ${description}`}>
        {resultat.cases.map((p, i) =>
          p ? (
            <span key={i} className={`dab ${CLASSE_PALIER[p]}`} />
          ) : (
            <span key={i} className="dab dab--x">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
                <path d="M4 4.5c4 3.5 8 7.5 12 11" />
                <path d="M15.5 4c-4 4-7.5 8-11.5 12" />
              </svg>
            </span>
          ),
        )}
      </div>
      <div className="hier__score">
        <p className="hier__pts">
          {resultat.total}
          <small>pts</small>
        </p>
      </div>
      <BoutonPartager texte={texteDePartage(resultat)} />
    </section>
  );
}
