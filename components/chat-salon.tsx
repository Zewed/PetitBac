"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { couperLaParoleAction, ecrireAction, exclureAction, signalerAction } from "@/app/actions";
import type { ChatVu, MessageVu } from "@/lib/jeu/chat";

const RAFRAICHIR_MS = 1000;
const LONGUEUR_MAX = 280;

/** Le bandeau de la maquette, quand le chat est fermé pendant la Manche. */
export function ChatFerme() {
  return (
    <p className="chat-off">
      <svg viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9h28v17H18l-7 6v-6H6z" stroke="#15161f" strokeWidth="3.2" />
        <path d="M4 35C14 24.5 25 14 36 4" stroke="#d8212d" strokeWidth="4.4" />
      </svg>
      <span>
        <b>Chat fermé pendant la manche.</b> Il rouvre à la découverte des points.
      </span>
    </p>
  );
}

/** Le chat écrit du Salon, relu chaque seconde en attendant Supabase Realtime (ticket 29). */
export function ChatSalon({ code, initial }: { code: string; initial: ChatVu }) {
  const [chat, setChat] = useState<ChatVu>(initial);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const liste = useRef<HTMLOListElement>(null);
  const dernier = chat.messages.at(-1)?.id;

  const relire = useCallback(async () => {
    try {
      const r = await fetch(`/api/salons/${code}/chat`, { cache: "no-store" });
      if (r.ok) setChat(await r.json());
    } catch {
      // coupure passagère : on réessaie à la seconde suivante
    }
  }, [code]);

  useEffect(() => {
    const t = setInterval(relire, RAFRAICHIR_MS);
    return () => clearInterval(t);
  }, [relire]);

  useEffect(() => {
    liste.current?.scrollTo({ top: liste.current.scrollHeight });
  }, [dernier]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!texte.trim() || envoi) return;
    setEnvoi(true);
    const r = await ecrireAction(code, texte);
    setEnvoi(false);
    if (!r.ok) return setErreur(r.erreur);
    setErreur(null);
    setTexte("");
    await relire();
  }

  if (!chat.ouvert) return <ChatFerme />;

  return (
    <section className="chat" aria-labelledby="chat-t">
      <h2 id="chat-t" className="kick">
        Chat du salon
      </h2>
      {chat.messages.length === 0 ? (
        <p className="chat__vide">Personne n&apos;a encore rien écrit. Lance la conversation : une pique, un pronostic, un emoji.</p>
      ) : (
        <ol className="chat__liste" ref={liste} aria-live="polite">
          {chat.messages.map((m) => (
            <Message key={m.id} code={code} message={m} jeSuisHote={chat.jeSuisHote} apres={relire} />
          ))}
        </ol>
      )}
      {chat.muet ? (
        <p className="chat__muet" role="status">
          L&apos;hôte t&apos;a coupé la parole : tu lis le chat sans pouvoir écrire.
        </p>
      ) : (
        <form className="chat__form" onSubmit={envoyer}>
          <label className="sr" htmlFor="chat-saisie">
            Ton message
          </label>
          <div className="field">
            <input
              id="chat-saisie"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={LONGUEUR_MAX}
              placeholder={chat.messages.length ? "Ton message…" : "Le premier message…"}
              autoComplete="off"
            />
          </div>
          <button className="btn" type="submit" disabled={envoi || !texte.trim()}>
            Envoyer
          </button>
        </form>
      )}
      {erreur && (
        <p className="pseudo__err" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

function Message({ code, message: m, jeSuisHote, apres }: { code: string; message: MessageVu; jeSuisHote: boolean; apres: () => Promise<void> }) {
  const [retour, setRetour] = useState<string | null>(null);
  const [exclusion, setExclusion] = useState(false);
  const moderable = jeSuisHote && !m.moi && m.poste;

  async function agir(action: () => Promise<{ ok: boolean; message?: string; erreur?: string }>) {
    const r = await action();
    setRetour(r.ok ? (r.message ?? null) : (r.erreur ?? null));
    await apres();
  }

  return (
    <li className={`chat__m ${m.moi ? "is-me" : ""}`}>
      <p className="chat__qui">
        <b>{m.pseudo}</b>
        {m.hote && <span> · hôte</span>}
        {m.muet && <span> · parole coupée</span>}
      </p>
      <p className="chat__texte">{m.texte}</p>
      {!m.moi && (
        <div className="chat__actions">
          {m.signale ? (
            <span className="chat__fait">Signalé</span>
          ) : (
            <button type="button" onClick={() => agir(() => signalerAction(code, m.id))}>
              Signaler
            </button>
          )}
          {moderable && (
            <button type="button" onClick={() => agir(() => couperLaParoleAction(code, m.poste, !m.muet))}>
              {m.muet ? "Rendre la parole" : "Couper la parole"}
            </button>
          )}
          {moderable &&
            (exclusion ? (
              <span className="chat__confirme">
                Exclure {m.pseudo} du salon ?{" "}
                <button type="button" className="is-danger" onClick={() => agir(() => exclureAction(code, m.poste))}>
                  Oui, exclure
                </button>{" "}
                <button type="button" onClick={() => setExclusion(false)}>
                  Non
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setExclusion(true)}>
                Exclure
              </button>
            ))}
        </div>
      )}
      {retour && (
        <p className="chat__retour" role="status">
          {retour}
        </p>
      )}
    </li>
  );
}
