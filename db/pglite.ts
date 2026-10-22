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

/** Une base Postgres embarquée, migrée : en mémoire sans dossier (tests), sur disque sinon (développement). */
export async function ouvrirPglite(dossier?: string): Promise<Db> {
  const client = new PGlite(dossier);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  return db as unknown as Db;
}
