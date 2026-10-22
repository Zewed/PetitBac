import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { defis, manches, reponses } from "@/db/schema";
import type { Db } from "@/db/types";
import { defiDuJour } from "./defi";
import type { NomPalier } from "./paliers";

/** Une case du résultat partagé par Palier : le fluo de chaque Palier, une case blanche pour 0 point. */
const CASES: Record<NomPalier, string> = { Banal: "🟨", Courant: "🟩", Rare: "🟦", "Très rare": "🟧", Légendaire: "🟪" };
const VIDE = "⬜";

export type Resultat = { numero: number; lettre: string; date: string; total: number; cases: (NomPalier | null)[] };

/** Le texte à partager, façon Wordle : le Défi, la Lettre, une case par Palier obtenu et le total, jamais les Réponses. */
export function texteDePartage(r: Pick<Resultat, "numero" | "lettre" | "total" | "cases">): string {
  const cases = r.cases.map((p) => (p ? CASES[p] : VIDE));
  const lignes = [];
  for (let i = 0; i < cases.length; i += 6) lignes.push(cases.slice(i, i + 6).join(""));
  return [`Petit Bac · Défi n°${r.numero} · Lettre ${r.lettre}`, ...lignes, `${r.total} pts`].join("\n");
}

/** Le dernier Défi jugé du Joueur, avec le Palier de chacune de ses cases. */
export async function dernierResultat(db: Db, joueurId: string, maintenant = new Date()): Promise<Resultat | null> {
  const aujourdHui = await defiDuJour(db, maintenant);
  const [manche] = await db
    .select()
    .from(manches)
    .where(and(eq(manches.joueurId, joueurId), isNotNull(manches.defiNumero), eq(manches.etat, "jugee")))
    .orderBy(desc(manches.defiNumero))
    .limit(1);
  if (!manche || manche.defiNumero! > aujourdHui.numero) return null;
  const [defi] = await db.select().from(defis).where(eq(defis.numero, manche.defiNumero!));
  const lignes = await db.select().from(reponses).where(eq(reponses.mancheId, manche.id));
  const parCategorie = new Map(lignes.map((r) => [r.categorie, r.palier as NomPalier | null]));
  return {
    numero: defi.numero,
    lettre: defi.lettre,
    date: defi.date,
    total: manche.total ?? 0,
    cases: manche.categories.map((c) => parCategorie.get(c) ?? null),
  };
}

/**
 * La Série : les jours d'affilée où le Joueur a fait le Défi. Tant que le Défi du jour n'est pas fait,
 * la Série d'hier tient encore (`enJeu`) ; un jour sauté la remet à 0.
 */
export async function serie(db: Db, joueurId: string, maintenant = new Date()): Promise<{ jours: number; enJeu: boolean }> {
  const { numero: aujourdHui } = await defiDuJour(db, maintenant);
  const lignes = await db
    .select({ numero: manches.defiNumero })
    .from(manches)
    .where(and(eq(manches.joueurId, joueurId), isNotNull(manches.defiNumero), inArray(manches.etat, ["a_juger", "jugee", "jugement_echoue"])));
  const faits = new Set(lignes.map((l) => l.numero!));
  const depart = faits.has(aujourdHui) ? aujourdHui : faits.has(aujourdHui - 1) ? aujourdHui - 1 : null;
  if (depart === null) return { jours: 0, enJeu: false };
  let jours = 0;
  while (faits.has(depart - jours)) jours++;
  return { jours, enJeu: depart !== aujourdHui };
}
