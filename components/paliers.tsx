import { PALIERS } from "@/lib/jeu/paliers";

export const CLASSE_PALIER: Record<string, string> = {
  Banal: "t-banal",
  Courant: "t-courant",
  Rare: "t-rare",
  "Très rare": "t-trare",
  Légendaire: "t-legend",
};

export function LegendePaliers() {
  return (
    <div className="tiers">
      <p className="kick">Les paliers</p>
      <ul>
        {PALIERS.map((p) => (
          <li key={p.nom} className={`tier ${CLASSE_PALIER[p.nom]}`}>
            {p.nom} <b>{p.points}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
