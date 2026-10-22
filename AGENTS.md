# Petit Bac : consignes pour les agents

Le petit bac en ligne, en solo ou entre amis, où une Réponse rapporte d'autant plus de points qu'elle est rare.

## À lire avant tout
- `.aeom/product.md` : le produit et toutes les règles de la v1.
- `CONTEXT.md` : le vocabulaire du jeu. On emploie ces termes dans le code, les docs et les messages, et jamais ceux marqués _Avoid_.
- `docs/adr/` : les décisions d'architecture et leurs raisons.

## Où en est le projet
- La direction artistique est choisie : la maquette gardée est dans `.aeom/direction/` (index.html = accueil, manche.html = manche en cours, style.css = le kit « surligneur gros traits »). Les écrans s'en inspirent.
- Le produit est découpé en tickets dans `.veebee/tickets/`, construits un par un, chacun dans sa pull request. Un ticket est fini quand son fichier dit `status: done` sur `main`.

## Conventions
- Les docs et le vocabulaire du jeu sont en français.
- Toute décision structurante (pile technique, règle de jeu difficile à défaire) va dans un nouvel ADR numéroté, dans `docs/adr/` : un titre qui énonce la décision, puis un court texte qui donne le pourquoi, les options écartées et les conséquences.
- Pile technique prévue :
  - Next.js 16 (App Router), Tailwind 4, TypeScript, pnpm, Vitest, sur Vercel ;
  - Supabase (Postgres, temps réel, comptes) avec Drizzle ;
  - Claude Haiku 5.5 via l'AI SDK et Vercel AI Gateway.
- Les intégrations externes (Supabase…) s'installent via la Marketplace Vercel.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
