import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Kept separate from vite.config.js so the app build carries no test
// configuration. Two environments: the pure modules under src/lib need no
// DOM and run far faster without one, while component tests need jsdom,
// which they opt into with a `// @vitest-environment jsdom` docblock.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}"],
    setupFiles: ["./tests/setup.js"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/utils/**"],
      reporter: ["text", "lcov"],
    },
  },
});
