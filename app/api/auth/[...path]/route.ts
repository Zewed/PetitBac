import { auth } from "@/lib/auth/server";

type Contexte = { params: Promise<{ path: string[] }> };

/** Les appels du client d'authentification, relayés vers Neon Auth. */
export function GET(request: Request, contexte: Contexte) {
  return auth().handler().GET(request, contexte);
}

export function POST(request: Request, contexte: Contexte) {
  return auth().handler().POST(request, contexte);
}
