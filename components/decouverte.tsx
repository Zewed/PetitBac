import { contesterAction, reagirAction, voterAction } from "@/app/actions";
import { CLASSE_PALIER } from "@/components/paliers";
import { EMOJIS, type ReponseDecouverte } from "@/lib/jeu/decouverte";

type Props = {
  code: string;
  categories: { categorie: string; reponses: ReponseDecouverte[] }[];
  /** Désactivée dans les Réglages de la Partie : le bouton « Contester » n'apparaît pas. */
  contestation?: boolean;
};

/** La découverte des points : les Réponses de tout le monde, Catégorie par Catégorie, et de quoi se chambrer. */
export function Decouverte({ code, categories, contestation = true }: Props) {
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
                  {!vide && contestation && <Contestation code={code} r={r} />}
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

/** Contester une décision du Juge, voter, et voir ce que le Salon a tranché. */
function Contestation({ code, r }: { code: string; r: ReponseDecouverte }) {
  const c = r.contestation;
  if (!c) {
    return (
      <form className="dec__contester" action={contesterAction.bind(null, code, r.id)}>
        <button className="lien-contester" type="submit">
          {r.valide ? "Contester : pas valable ?" : "Contester : c'est valable !"}
        </button>
      </form>
    );
  }
  if (c.etat !== "en_cours") {
    return (
      <p className="dec__contester dec__tranche">
        {c.etat === "acceptee" ? `Le salon a tranché : ${r.valide ? "validée" : "refusée"}.` : "Pas de majorité : la décision du Juge reste."}
      </p>
    );
  }
  return (
    <div className="dec__contester dec__vote" role="group" aria-label={`Vote sur la réponse de ${r.pseudo}`}>
      <span>
        Contestée par {c.par} · <b>{c.pour}</b> pour · <b>{c.contre}</b> contre
      </span>
      <form action={voterAction.bind(null, code, c.id, true)}>
        <button className={`vote ${c.monVote === true ? "is-on" : ""}`} type="submit" aria-pressed={c.monVote === true}>
          D&apos;accord
        </button>
      </form>
      <form action={voterAction.bind(null, code, c.id, false)}>
        <button className={`vote ${c.monVote === false ? "is-on" : ""}`} type="submit" aria-pressed={c.monVote === false}>
          Pas d&apos;accord
        </button>
      </form>
    </div>
  );
}
