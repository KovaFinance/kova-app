import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // lib/yield.ts is pure math — no DOM needed, so the node environment is enough.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
