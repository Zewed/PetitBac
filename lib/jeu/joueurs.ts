import { eq } from "drizzle-orm";
import { joueurs } from "@/db/schema";
import type { Db } from "@/db/types";
import { contientUneGrossierete } from "./grossieretes";

export type Joueur = { id: string; pseudo: string };
export type ResultatPseudo = { ok: true; joueur: Joueur } | { ok: false; erreur: string };

export function validerPseudo(saisie: string): { ok: true; pseudo: string } | { ok: false; erreur: string } {
  const pseudo = saisie.trim().replace(/\s+/g, " ");
  if (pseudo.length < 2 || pseudo.length > 20) return { ok: false, erreur: "Ton pseudo doit faire entre 2 et 20 caractères." };
  if (!/^[\p{L}\p{N} _'-]+$/u.test(pseudo)) {
    return { ok: false, erreur: "Ton pseudo ne peut contenir que des lettres, des chiffres, des espaces, - et _." };
  }
  if (contientUneGrossierete(pseudo)) return { ok: false, erreur: "Ce pseudo contient un gros mot. Choisis-en un autre." };
  return { ok: true, pseudo };
}

export async function choisirPseudo(db: Db, saisie: string): Promise<ResultatPseudo> {
  const valide = validerPseudo(saisie);
  if (!valide.ok) return valide;
  const [joueur] = await db.insert(joueurs).values({ pseudo: valide.pseudo }).returning({ id: joueurs.id, pseudo: joueurs.pseudo });
  return { ok: true, joueur };
}

export async function trouverJoueur(db: Db, id: string): Promise<Joueur | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const [joueur] = await db.select({ id: joueurs.id, pseudo: joueurs.pseudo }).from(joueurs).where(eq(joueurs.id, id));
  return joueur;
}
