import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import type { Db } from "./types";
import * as schema from "./schema";

/** Une base Postgres embarquée, migrée : en mémoire sans dossier (tests), sur disque sinon (développement). */
export async function ouvrirPglite(dossier?: string): Promise<Db> {
  const client = new PGlite(dossier);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  return db as unknown as Db;
}
