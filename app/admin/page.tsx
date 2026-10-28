import { notFound } from "next/navigation";
import { Entete } from "@/components/entete";
import { obtenirDb } from "@/db/client";
import { estAdmin } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";
import { fileDArbitrage } from "@/lib/jeu/arbitrage";
import { obtenirJuge } from "@/lib/jeu/juge";
import { trancherAction } from "./actions";

// La garde lit la session avant tout envoi : un visiteur qui n'est pas Antoine reçoit une vraie 404, pas une page qui se dérobe en cours de route.
export const instant = false;

/** /admin, réservé au Compte d'Antoine : la file des Réponses signalées ou contestées à trancher (ticket 22). */
export default async function PageAdmin() {
  const { data: session } = await auth().getSession();
  if (!estAdmin(session?.user.email)) notFound();
  const file = await fileDArbitrage(await obtenirDb(), obtenirJuge());

  return (
    <>
      <Entete />
      <main className="wrap admin">
        <section className="pseudo" aria-labelledby="admin-t">
          <h1 id="admin-t" className="pseudo__t">
            À <span className="sec__hl">trancher</span>
          </h1>
          {file.length === 0 ? (
            <p className="pseudo__p">Rien à trancher : aucune Réponse signalée ou contestée n&apos;attend ta décision.</p>
          ) : (
            <>
              <p className="pseudo__p">
                Les Réponses signalées ou contestées, la plus ancienne d&apos;abord. Ta décision remplace celle du Juge pour toutes les Parties
                suivantes ; les points déjà comptés ne bougent pas.
              </p>
              <ol className="arbitrage">
                {file.map((r) => (
                  <li key={`${r.categorie}-${r.lettre}-${r.cle}`} className="arbitrage__item">
                    <p className="arbitrage__ou">
                      {r.categorie} · <b>{r.lettre}</b>
                    </p>
                    <p className="arbitrage__rep">{r.saisie}</p>
                    <p className="arbitrage__juge">
                      Le Juge {r.rejugee ? "l'a rejugée : " : ": "}
                      <b className={r.valideParLeJuge ? "is-ok" : "is-non"}>{r.valideParLeJuge ? "validée" : "refusée"}</b>
                      {r.valideParLeJuge && r.formeReference ? ` (${r.formeReference})` : ""}
                    </p>
                    <p className="arbitrage__n">
                      {r.parties} {r.parties > 1 ? "Parties" : "Partie"}
                      {r.signalements > 0 && ` · ${r.signalements} ${r.signalements > 1 ? "signalements" : "signalement"}`}
                      {r.contestations > 0 && ` · ${r.contestations} ${r.contestations > 1 ? "contestations" : "contestation"}`}
                    </p>
                    <form action={trancherAction} className="arbitrage__form">
                      <input type="hidden" name="categorie" value={r.categorie} />
                      <input type="hidden" name="lettre" value={r.lettre} />
                      <input type="hidden" name="saisie" value={r.saisie} />
                      <label className="arbitrage__forme">
                        <span>Forme de référence si tu valides</span>
                        <span className="field">
                          <input name="forme" defaultValue={r.formeReference ?? r.saisie} maxLength={80} />
                        </span>
                      </label>
                      <div className="arbitrage__btns">
                        <button className="btn" type="submit" name="valide" value="1">
                          Valider
                        </button>
                        <button className="btn btn--ink" type="submit" name="valide" value="0">
                          Refuser
                        </button>
                      </div>
                    </form>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </main>
    </>
  );
}
