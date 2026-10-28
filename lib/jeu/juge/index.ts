import { FakeJuge } from "./fake-juge";
import { JugeIA } from "./juge-ia";
import type { Juge } from "./types";

/**
 * Le Juge du jeu : le vrai (Claude Haiku via Vercel AI Gateway) quand PETIT_BAC_JUGE=ia, le FakeJuge sinon.
 * La variable s'allume en production une fois l'accès à Haiku ouvert sur AI Gateway (crédits payants) : sans elle,
 * chaque Manche finirait sur « Le Juge ne répond pas ».
 */
export function obtenirJuge(): Juge {
  return process.env.PETIT_BAC_JUGE === "ia" ? new JugeIA() : new FakeJuge();
}
