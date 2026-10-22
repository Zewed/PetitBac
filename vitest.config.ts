import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // Chaque test démarre sa base Postgres embarquée (PGlite), ce qui prend une à deux secondes.
    testTimeout: 30_000,
    include: ["**/*.test.ts"],
    // .claude/ peut contenir les worktrees d'autres sessions, avec leurs propres node_modules.
    exclude: ["**/node_modules/**", ".next/**", ".claude/**"],
  },
});
