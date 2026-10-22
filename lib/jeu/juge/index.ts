import { FakeJuge } from "./fake-juge";
import type { Juge } from "./types";

/** Le Juge du jeu. Pour l'instant le FakeJuge, faute de clé Vercel AI Gateway : voir le ticket « Brancher le vrai Juge ». */
export function obtenirJuge(): Juge {
  return new FakeJuge();
}
