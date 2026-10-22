import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { joueurs, manches, parties, reponses, salonJoueurs, salons } from "@/db/schema";
import type { Db } from "@/db/types";
import { PREREGLAGES, type IdPrereglage } from "./prereglages";
import { codeDepuisSaisie } from "./salons";

export type FinDePartie = {
  nom: string;
  podium: { pseudo: string; total: number; moi: boolean }[];
  plusRare: { pseudo: string; reponse: string; categorie: string; lettre: string; palier: string; points: number } | null;
};

/** La fin d'une Partie de Salon : le podium et la Réponse la plus rare. Rien tant que la Partie n'est pas finie. */
export async function finDePartie(db: Db, code: string, joueurId: string): Promise<FinDePartie | null> {
  const [salon] = await db.select().from(salons).where(eq(salons.code, codeDepuisSaisie(code)));
  if (!salon) return null;
  const [membre] = await db.select().from(salonJoueurs).where(and(eq(salonJoueurs.salonId, salon.id), eq(salonJoueurs.joueurId, joueurId)));
  if (!membre) return null;
  const [partie] = await db.select().from(parties).where(eq(parties.salonId, salon.id)).orderBy(desc(parties.creeLe)).limit(1);
  if (!partie || partie.etat !== "terminee") return null;

  const grilles = await db
    .select({ id: manches.id, joueurId: manches.joueurId, total: manches.total, numero: manches.numero, lettre: manches.lettre, pseudo: joueurs.pseudo })
    .from(manches)
    .innerJoin(joueurs, eq(joueurs.id, manches.joueurId))
    .where(eq(manches.partieId, partie.id));
  const totaux = new Map<string, { pseudo: string; total: number; moi: boolean }>();
  for (const g of grilles) {
    const t = totaux.get(g.joueurId) ?? { pseudo: g.pseudo, total: 0, moi: g.joueurId === joueurId };
    t.total += g.total ?? 0;
    totaux.set(g.joueurId, t);
  }

  const valables = grilles.length
    ? await db
        .select()
        .from(reponses)
        .where(and(inArray(reponses.mancheId, grilles.map((g) => g.id)), eq(reponses.valide, true), isNotNull(reponses.palier)))
    : [];
  const meilleure = valables
    .map((r) => ({ r, g: grilles.find((g) => g.id === r.mancheId)! }))
    .sort((a, b) => (b.r.points ?? 0) - (a.r.points ?? 0) || a.g.numero - b.g.numero)[0];

  return {
    nom: PREREGLAGES[partie.prereglage as IdPrereglage].nom,
    podium: [...totaux.values()].sort((a, b) => b.total - a.total || a.pseudo.localeCompare(b.pseudo)),
    plusRare: meilleure
      ? {
          pseudo: meilleure.g.pseudo,
          reponse: meilleure.r.formeReference ?? meilleure.r.saisie,
          categorie: meilleure.r.categorie,
          lettre: meilleure.g.lettre,
          palier: meilleure.r.palier!,
          points: meilleure.r.points ?? 0,
        }
      : null,
  };
}
