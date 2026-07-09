import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Node.js ops/utility scripts (CommonJS, run directly with
    // `node`) — not part of the application bundle.
    "scripts/**",
    "supabase/apply-schema.js",
  ]),
  {
    // Playwright test files are allowed CommonJS-style requires where the
    // tooling demands it, and page-object fixtures import `expect` for
    // consistency even when a given file doesn't assert.
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
