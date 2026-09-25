import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only pure logic under src/lib is unit tested. No DOM, no database.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
