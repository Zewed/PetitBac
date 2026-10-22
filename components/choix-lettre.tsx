/** Les Lettres encore libres de la Partie, à cocher pour la prochaine Manche ; « au hasard » coché par défaut. */
export function ChoixLettre({ restantes, titre, auHasard = true, choisie }: { restantes: string[]; titre: string; auHasard?: boolean; choisie?: string | null }) {
  const parDefaut = choisie ?? (auHasard ? "" : restantes[0]);
  return (
    <fieldset className="reglage">
      <legend className="choix-lettre__t">{titre}</legend>
      <div className="lettres-choix">
        {auHasard && (
          <label className="lettre-c lettre-c--hasard">
            <input type="radio" name="lettre" value="" defaultChecked={parDefaut === ""} />
            <span>?</span>
          </label>
        )}
        {restantes.map((l) => (
          <label key={l} className="lettre-c">
            <input type="radio" name="lettre" value={l} defaultChecked={parDefaut === l} />
            <span>{l}</span>
          </label>
        ))}
      </div>
      {auHasard && <p className="reglage__aide">« ? » : la lettre est tirée au hasard.</p>}
    </fieldset>
  );
}
