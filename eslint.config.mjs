import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  {
    ignores: ["build/**", "node_modules/**", "src/**/*.d.ts"],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: [["@babel/plugin-syntax-typescript", { isTSX: false }]],
        },
      },
      globals: globals.browser,
    },
    rules: {
      "no-constant-condition": "error",
      "no-debugger": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
    },
  },
  {
    files: ["*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
];
