"use client";

import { useEffect, useState } from "react";

/**
 * Enregistre le service worker, qui remplace la page d'erreur du navigateur par « Pas de connexion » quand on
 * ouvre Petit Bac hors ligne, et dit tout de suite à qui perd la connexion en jouant que le jeu en a besoin.
 */
export function AppInstallable() {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    const maj = () => setHorsLigne(!navigator.onLine);
    maj();
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);

  if (!horsLigne) return null;
  return (
    <p className="hors-ligne" role="alert">
      <b>Pas de connexion.</b> Petit Bac a besoin d&apos;internet : ta grille est gardée, reconnecte-toi pour continuer.
    </p>
  );
}
