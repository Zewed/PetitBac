import "server-only";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Db } from "./types";
import * as schema from "./schema";

// Une seule base par processus : en développement, les pages, les actions et les routes peuvent charger ce module
// plusieurs fois, et deux PGlite ouvertes sur le même dossier .pglite/ ne voient pas les écritures l'une de l'autre.
const partage = globalThis as typeof globalThis & { __petitBacDb?: Promise<Db> };

/**
 * La base du jeu. En production, DATABASE_URL pointe sur Supabase.
 * Sans DATABASE_URL, en développement, une base Postgres embarquée (PGlite) vit hors du projet (DOSSIER_PGLITE_DEV).
 */
export function obtenirDb(): Promise<Db> {
  partage.__petitBacDb ??= ouvrir();
  return partage.__petitBacDb;
}

async function ouvrir(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return drizzlePostgres(postgres(url, { prepare: false }), { schema }) as unknown as Db;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL manque.");
  const { ouvrirPglite, DOSSIER_PGLITE_DEV } = await import("./pglite");
  return ouvrirPglite(DOSSIER_PGLITE_DEV);
}
