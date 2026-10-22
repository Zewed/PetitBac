import { reagirAction } from "@/app/actions";
import { CLASSE_PALIER } from "@/components/paliers";
import { EMOJIS, type ReponseDecouverte } from "@/lib/jeu/decouverte";

type Props = { code: string; categories: { categorie: string; reponses: ReponseDecouverte[] }[] };

/** La découverte des points : les Réponses de tout le monde, Catégorie par Catégorie, et de quoi se chambrer. */
export function Decouverte({ code, categories }: Props) {
  return (
    <section className="decouverte" aria-labelledby="dec-t">
      <h2 id="dec-t" className="kick">
        Les réponses de tout le monde
      </h2>
      {categories.map(({ categorie, reponses }) => (
        <div key={categorie} className="decouverte__cat">
          <h3>{categorie}</h3>
          <ul>
            {reponses.map((r) => {
              const vide = r.valide === null;
              const refus = r.valide === false;
              return (
                <li key={r.id} className={`dec ${vide || refus ? "" : (CLASSE_PALIER[r.palier ?? ""] ?? "")} ${refus ? "is-refus" : ""} ${vide ? "is-vide" : ""} ${r.moi ? "is-me" : ""}`}>
                  <span className="dec__qui">{r.moi ? "Toi" : r.pseudo}</span>
                  <span className="dec__rep">{vide ? "Case vide" : r.reponse}</span>
                  <span className="dec__pts">
                    <b>{r.points}</b> {vide ? "vide" : refus ? "refusée" : r.palier}
                  </span>
                  <span className="dec__reac">
                    {r.moi
                      ? r.reactions.map((x) => (
                          <span key={x.emoji} className="reac reac--vue" aria-label={`${x.nombre} ${x.emoji}`}>
                            {x.emoji} {x.nombre}
                          </span>
                        ))
                      : EMOJIS.map((emoji) => {
                          const x = r.reactions.find((y) => y.emoji === emoji);
                          return (
                            <form key={emoji} action={reagirAction.bind(null, code, r.id, emoji)}>
                              <button
                                className={`reac ${x?.moi ? "is-on" : ""}`}
                                type="submit"
                                aria-pressed={x?.moi ?? false}
                                aria-label={`Réagir ${emoji} à la réponse de ${r.pseudo}`}
                              >
                                {emoji}
                                {x ? ` ${x.nombre}` : ""}
                              </button>
                            </form>
                          );
                        })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
