// Applique les migrations de db/migrations sur la base Neon, avant chaque build de production sur Vercel.
// Seule la production migre : les Previews partagent les variables de la base, et une branche pas encore mergée
// ne doit jamais changer la base des Joueurs.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`Migrations : rien à faire hors production (VERCEL_ENV=${process.env.VERCEL_ENV ?? "absent"}).`);
  process.exit(0);
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Migrations : DATABASE_URL_UNPOOLED manque.");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
try {
  await migrate(drizzle(client), { migrationsFolder: "db/migrations" });
  console.log("Migrations : la base de production est à jour.");
} finally {
  await client.end();
}
