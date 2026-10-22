"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { cloturerAction } from "@/app/actions";
import type { EtatPartieSalon } from "@/lib/jeu/partie-salon";
import type { SalonVu } from "@/lib/jeu/salons";

export type SalonEnDirect = SalonVu & { partie: EtatPartieSalon | null };

const RAFRAICHIR_MS = 1000;

/**
 * Suit le Salon en direct : quand l'Hôte lance une Manche, emmène le Joueur sur sa Grille ; quand le classement
 * ou l'état change, rafraîchit la page ; quand l'heure de fin est passée, demande la clôture de la Manche.
 * En attendant Supabase Realtime (ticket 29), c'est une relecture chaque seconde.
 */
export function SuiviSalon({ code, mancheId, surSalon }: { code: string; mancheId?: string; surSalon?: (s: SalonEnDirect) => void }) {
  const router = useRouter();
  const derniere = useRef<string | null>(null);
  const cloture = useRef<string | null>(null);
  const rappel = useRef(surSalon);
  useEffect(() => {
    rappel.current = surSalon;
  }, [surSalon]);

  useEffect(() => {
    let actif = true;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/salons/${code}`, { cache: "no-store" });
        if (!r.ok || !actif) return;
        const salon: SalonEnDirect = await r.json();
        rappel.current?.(salon);
        const p = salon.partie;
        if (p?.partie.etat === "en_cours" && p.maMancheId && p.maMancheId !== mancheId && !p.manche.close) {
          router.push(`/manche/${p.maMancheId}`);
          return;
        }
        if (p && !p.manche.close && Date.now() > new Date(p.manche.finitLe).getTime() + 4000 && cloture.current !== p.manche.finitLe) {
          cloture.current = p.manche.finitLe;
          void cloturerAction(code);
        }
        const signature = JSON.stringify([p?.partie.etat, p?.manche, p?.classement]);
        if (derniere.current !== null && derniere.current !== signature && mancheId) router.refresh();
        derniere.current = signature;
      } catch {
        // coupure passagère : on réessaie à la seconde suivante
      }
    }, RAFRAICHIR_MS);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [code, mancheId, router]);
  return null;
}
