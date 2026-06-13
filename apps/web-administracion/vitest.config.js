import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}",
    ],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
