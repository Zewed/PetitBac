/** La Série en bâtons de stylo bleu, barrés par cinq. */
function Batons({ n }: { n: number }) {
  const traits = Math.min(n, 10);
  const groupes = Math.ceil(traits / 5);
  const largeur = Math.max(1, groupes) * 64 - 8;
  const chemins: string[] = [];
  for (let i = 0; i < traits; i++) {
    const g = Math.floor(i / 5);
    const j = i % 5;
    const x = g * 64 + 9 + j * 14;
    if (j < 4) chemins.push(`M${x} ${8 + (j % 2)}c${j % 2 ? 0.6 : -0.6} 15 ${j % 2 ? -0.4 : 0.8} 30 0 44`);
    else chemins.push(`M${g * 64 + 2} 45C${g * 64 + 20} 35 ${g * 64 + 39} 24 ${g * 64 + 59} 13`);
  }
  return (
    <svg className="tally" viewBox={`0 0 ${largeur} 60`} style={{ width: largeur }} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" aria-hidden="true">
      {chemins.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Serie({ jours, enJeu, numeroDuJour }: { jours: number; enJeu: boolean; numeroDuJour: number }) {
  if (jours === 0) {
    return (
      <section className="serie serie--vide" aria-label="Ta série">
        <div className="serie__txt">
          <p className="serie__n">Lance ta série</p>
          <p className="serie__s">Fais le défi n°{numeroDuJour}, puis reviens chaque jour pour la faire grimper.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="serie" aria-label="Ta série">
      <Batons n={jours} />
      <div className="serie__txt">
        <p className="serie__n">
          {jours} jour{jours > 1 ? "s" : ""} d&apos;affilée
        </p>
        <p className="serie__s">
          {enJeu ? `Fais le n°${numeroDuJour} pour passer à ${jours + 1}.` : `Reviens demain pour passer à ${jours + 1}.`}
        </p>
      </div>
    </section>
  );
}
