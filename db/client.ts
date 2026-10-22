import "server-only";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Db } from "./types";
import * as schema from "./schema";

let db: Promise<Db> | undefined;

/**
 * La base du jeu. En production, DATABASE_URL pointe sur Supabase.
 * Sans DATABASE_URL, en développement, une base Postgres embarquée (PGlite) vit dans .pglite/.
 */
export function obtenirDb(): Promise<Db> {
  db ??= ouvrir();
  return db;
}

async function ouvrir(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return drizzlePostgres(postgres(url, { prepare: false }), { schema }) as unknown as Db;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL manque.");
  const { ouvrirPglite } = await import("./pglite");
  return ouvrirPglite(".pglite");
}
