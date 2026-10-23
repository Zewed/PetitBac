"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

type Etat = { envoi: boolean; message: string | null; erreur: string | null };

/**
 * Créer son Compte, ou se connecter sur un autre appareil : par un code à 6 chiffres envoyé par e-mail, ou par Google.
 * Un code se tape sur l'appareil où l'on joue : pas de lien qui s'ouvrirait dans le navigateur de l'appli mail.
 * Réservé aux 15 ans et plus : la case doit être cochée avant d'envoyer.
 */
export function FormulaireCompte() {
  const [quinze, setQuinze] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [etat, setEtat] = useState<Etat>({ envoi: false, message: null, erreur: null });

  // Le retour rattache le Compte au Joueur de l'appareil (app/compte/retour/route.ts).
  const retour = () => `${window.location.origin}/compte/retour?quinze=1`;

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    if (!quinze || etat.envoi) return;
    setEtat({ envoi: true, message: null, erreur: null });
    const echec: Etat = { envoi: false, message: null, erreur: "Le code n'a pas pu partir. Vérifie l'adresse et réessaie." };
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
      if (error) return setEtat(echec);
      setCodeEnvoye(true);
      setEtat({ envoi: false, message: `Code envoyé à ${email.trim()}. Il vaut quelques minutes.`, erreur: null });
    } catch {
      setEtat(echec);
    }
  }

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    if (etat.envoi) return;
    setEtat({ envoi: true, message: null, erreur: null });
    const echec: Etat = { envoi: false, message: null, erreur: "Ce code ne marche pas ou a expiré : demande-en un nouveau." };
    try {
      const { error } = await authClient.signIn.emailOtp({ email: email.trim(), otp: code.trim() });
      if (error) return setEtat(echec);
      window.location.assign(retour());
    } catch {
      setEtat(echec);
    }
  }

  async function google() {
    if (!quinze || etat.envoi) return;
    setEtat({ envoi: true, message: null, erreur: null });
    const echec: Etat = { envoi: false, message: null, erreur: "La connexion Google n'a pas abouti. Réessaie." };
    try {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: retour(), errorCallbackURL: `${window.location.origin}/compte?erreur=google` });
      if (error) setEtat(echec);
    } catch {
      setEtat(echec);
    }
  }

  return (
    <div className="compte__form">
      <label className="option">
        <input type="checkbox" checked={quinze} onChange={(e) => setQuinze(e.target.checked)} />
        <span>J&apos;ai 15 ans ou plus</span>
      </label>
      {codeEnvoye ? (
        <form className="pseudo__form" onSubmit={seConnecter}>
          <div className="field">
            <input
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              aria-label="Le code reçu par e-mail"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={code.length !== 6 || etat.envoi}>
            Se connecter
          </button>
        </form>
      ) : (
        <form className="pseudo__form" onSubmit={envoyerCode}>
          <div className="field">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@adresse.fr"
              aria-label="Ton adresse e-mail"
              autoComplete="email"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={!quinze || etat.envoi}>
            Recevoir un code
          </button>
        </form>
      )}
      {codeEnvoye && (
        <button className="ink-link compte__autre" type="button" onClick={() => (setCodeEnvoye(false), setCode(""), setEtat({ envoi: false, message: null, erreur: null }))}>
          Changer d&apos;adresse ou renvoyer un code
        </button>
      )}
      <button className="btn btn--ink btn--wide" type="button" onClick={google} disabled={!quinze || etat.envoi}>
        Continuer avec Google
      </button>
      {!quinze && <p className="compte__aide">Le compte est réservé aux 15 ans et plus. Sans compte, tu joues quand même.</p>}
      {etat.message && (
        <p className="partage__msg" role="status">
          {etat.message}
        </p>
      )}
      {etat.erreur && (
        <p className="pseudo__err" role="alert">
          {etat.erreur}
        </p>
      )}
    </div>
  );
}
