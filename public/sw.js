// Le service worker de Petit Bac : il ne garde rien en cache, puisque le jeu a besoin d'internet.
// Il sert seulement à dire « pas de connexion » au lieu de la page d'erreur du navigateur.

const HORS_LIGNE = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pas de connexion — Petit Bac</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#15161f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  main{max-width:420px;padding:32px 20px;display:grid;gap:18px}
  h1{margin:0;font-size:34px;line-height:1.1;letter-spacing:-.02em}
  h1 span{background:linear-gradient(90deg,#ffe52e,#fff35a 20%,#fff35a 80%,#ffe52e);padding:0 .15em}
  p{margin:0;font-size:17px;line-height:1.45;color:#474a5e}
  a{justify-self:start;display:inline-flex;align-items:center;min-height:56px;padding:0 26px;background:#2338b5;color:#fff;font-weight:800;font-size:18px;text-decoration:none;transform:skewX(-14deg)}
  a span{transform:skewX(14deg)}
</style></head>
<body><main>
  <h1>Pas de <span>connexion</span></h1>
  <p>Petit Bac a besoin d'internet pour tirer la lettre et corriger ta grille. Reconnecte-toi, puis réessaie.</p>
  <a href="/"><span>Réessayer</span></a>
</main></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () => new Response(HORS_LIGNE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
