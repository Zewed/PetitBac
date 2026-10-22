---
id: 28
title: Brancher le vrai Juge à la place du FakeJuge
milestone: null
depends_on: [01]
design: null
tracker: null            # filled after the push: { tool, id, url }
---

## Ce que l'utilisateur fait
« J'écris une Réponse que le jeu n'avait jamais vue, et elle est jugée correctement. »

## Ce qu'il voit
Rien de nouveau à l'écran : les Réponses sont jugées par Claude Haiku au lieu d'une liste de mots.

## C'est fini quand
- [ ] Une Réponse juste mais absente des listes du FakeJuge (« caracal » en Animal + C) est validée.
- [ ] Un mot inventé (« chafrougne ») et une Réponse hors Catégorie sont refusés.
- [ ] Une Réponse jamais vue reçoit une Cote de démarrage tirée de la fréquence des mots en français et de l'estimation de l'IA.
- [ ] Le Juge n'est appelé qu'une fois par Manche, pour les seules Réponses encore inconnues.
- [ ] L'erreur : si l'IA ne répond pas, la Manche montre « Le Juge ne répond pas » et se relance, comme aujourd'hui.

## Les règles
Recopiées de `.aeom/product.md` :

**Une IA juge chaque nouvelle réponse une seule fois** : validée ou refusée, avec sa forme de référence. La décision est gardée pour toujours, et un seul appel par manche juge toutes les réponses encore inconnues.
**Démarrage à froid** : tant qu'un couple a été peu joué, la cote s'appuie sur la fréquence des mots en français (une base comme Lexique) et sur une estimation par l'IA. Les vraies réponses des joueurs prennent ensuite le relais.
Claude Haiku 5.5 juge les réponses via l'AI SDK et Vercel AI Gateway.

## Hors ticket
- Le regroupement des variantes : 02 (le vrai Juge devra le faire aussi).

## Pourquoi ce ticket
Créé par l'autopilot le 22 octobre : sans clé Vercel AI Gateway, le ticket 01 a été construit avec un `FakeJuge` (lib/jeu/juge/fake-juge.ts) qui ne connaît que ses listes de mots. Il faut une clé `AI_GATEWAY_API_KEY` (ou `vercel link` + `vercel env pull`) pour le faire.
