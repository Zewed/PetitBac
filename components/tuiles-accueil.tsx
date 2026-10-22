"use client";

import { useState } from "react";
import { creerSalonAction, lancerPartieLibre } from "@/app/actions";
import { ChoixPrereglage } from "@/components/choix-prereglage";
import { Feuille } from "@/components/feuille";
import { PREREGLAGES, estPrereglage, type IdPrereglage } from "@/lib/jeu/prereglages";
import type { RegleVue } from "@/lib/jeu/regles";

function duree(s: number) {
  return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`;
}

function detail(id: IdPrereglage) {
  if (id === "personnalise") return "chrono, lettres, STOP : à régler dans le salon";
  const p = PREREGLAGES[id];
  return `${p.nbCategories} catégories · ${duree(p.dureeS)} · ${p.nbManches} manches`;
}

/**
 * Entre amis : créer un Salon. Le Préréglage choisi s'affiche sur sa bande de papier ; « Changer » ouvre la feuille.
 * Les Réglages Personnalisés et « Mes règles » se choisissent ensuite dans le Salon, au lancement.
 */
export function TuileCreer({ attente }: { attente: string | null }) {
  const [prereglage, setPrereglage] = useState<IdPrereglage>("classique");
  const [ouverte, setOuverte] = useState(false);
  const nom = PREREGLAGES[prereglage].nom;
  return (
    <form className="tuile cr" action={creerSalonAction} aria-labelledby="cr-t">
      <span className="bulle" aria-hidden="true">
        Un petit bac ?
      </span>
      <p className="kick">Entre amis</p>
      <h2 id="cr-t" className="cr__t">
        <span className="cr__t1">Créer</span> <span className="cr__t2">un salon</span>
      </h2>
      <div className="cr__pre">
        <p className="cr__pn">{nom}</p>
        <p className="cr__pd">{detail(prereglage)}</p>
        <button className="ink-link cr__chg" type="button" onClick={() => setOuverte(true)} aria-label={`Changer de préréglage (${nom})`}>
          Changer
        </button>
      </div>
      {attente && (
        <p className="pseudo__err" role="alert">
          {attente}
        </p>
      )}
      <button className="btn btn--xl btn--wide cr__go" type="submit">
        Créer le salon <span aria-hidden="true">→</span>
      </button>
      <Feuille ouverte={ouverte} onFermer={() => setOuverte(false)} kick="Entre amis · Créer un salon" titre="du salon">
        <ChoixPrereglage defaut={prereglage} onChoix={(c) => estPrereglage(c) && setPrereglage(c)} />
        <button className="btn btn--wide" type="submit">
          Créer le salon <span aria-hidden="true">→</span>
        </button>
      </Feuille>
    </form>
  );
}

/** Seul : la Partie libre. « Jouer » ouvre la feuille des Préréglages, de Personnalisé et de « Mes règles ». */
export function TuileSeul({ meilleurs, regles }: { meilleurs: Partial<Record<IdPrereglage, number>>; regles: RegleVue[] }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <form className="tuile se" action={lancerPartieLibre} aria-labelledby="se-t">
      <div className="se__titles">
        <p className="kick">Seul</p>
        <h2 id="se-t" className="se__t">
          Partie libre
        </h2>
      </div>
      <svg className="crayon" viewBox="0 0 300 64" aria-hidden="true">
        <path fill="#fff" d="M4 12h30v40H4z" />
        <path className="crayon__ink" d="M38 12h14v40H38z" />
        <path fill="#fff" d="M56 12h176v40H56z" />
        <path className="crayon__pan" d="M56 26h176v12H56z" />
        <path fill="#fff" d="M236 12l58 20-58 20z" />
        <path className="crayon__ink" d="M274 25l20 7-20 7z" />
      </svg>
      <button className="se__go" type="button" onClick={() => setOuverte(true)} aria-label="Jouer une partie libre : choisir le préréglage">
        Jouer <span aria-hidden="true">→</span>
      </button>
      <Feuille ouverte={ouverte} onFermer={() => setOuverte(false)} kick="Seul · Partie libre" titre="de la partie" libre>
        <ChoixPrereglage meilleurs={meilleurs} reglages="solo" regles={regles} />
        <button className="btn btn--wide" type="submit">
          Lancer la partie <span aria-hidden="true">→</span>
        </button>
      </Feuille>
    </form>
  );
}
