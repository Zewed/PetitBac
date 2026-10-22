import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import os from "node:os";
import path from "node:path";
import type { Db } from "./types";
import * as schema from "./schema";

/**
 * La base de développement vit hors du projet : écrite dans le dossier du projet, elle relançait la compilation
 * de Next à chaque requête. PGLITE_DIR la place ailleurs.
 */
export const DOSSIER_PGLITE_DEV = process.env.PGLITE_DIR ?? path.join(os.homedir(), ".cache", "petit-bac", "pglite");

async function migree(dossier?: string) {
  const client = new PGlite(dossier);
  await migrate(drizzle(client, { schema }), { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  return client;
}

// En mémoire (les tests), une base modèle est migrée une fois par processus, puis clonée pour chaque base demandée.
let modele: Promise<PGlite> | undefined;

/** Une base Postgres embarquée, migrée : en mémoire sans dossier (tests), sur disque sinon (développement). */
export async function ouvrirPglite(dossier?: string): Promise<Db> {
  if (dossier) return drizzle(await migree(dossier), { schema }) as unknown as Db;
  modele ??= migree();
  const client = (await (await modele).clone()) as PGlite;
  return drizzle(client, { schema }) as unknown as Db;
}
