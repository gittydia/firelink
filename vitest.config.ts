import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors the `@/*` -> `src/*` mapping in tsconfig.json, so a module under test
  // resolves its own imports exactly as it does in the app.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Pure logic, plus module-boundary tests that mock I/O. No DOM, no database.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
