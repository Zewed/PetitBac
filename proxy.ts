import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

/**
 * Au retour de Google, Neon Auth échange le jeton de vérification contre le cookie de session, avant que
 * /compte/retour ne rattache le Compte au Joueur. Sans session, retour à la page du Compte.
 */
export default function proxy(request: NextRequest) {
  return auth().middleware({ loginUrl: "/compte?erreur=lien" })(request);
}

export const config = { matcher: ["/compte/retour"] };
