import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "react-perf", "import", "typescript", "jsx-a11y"],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },
  rules: {
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "react/react-in-jsx-scope": "off",
    // React Compiler handles memoization automatically
    "react-perf/jsx-no-new-function-as-prop": "off",
    "react-perf/jsx-no-new-object-as-prop": "off",
    "react/rules-of-hooks": "error",
    "react/button-has-type": "error",
    "react/jsx-no-target-blank": [
      "error",
      {
        warnOnSpreadAttributes: true,
        links: true,
        forms: true,
      },
    ],
    "import/no-unassigned-import": [
      "error",
      {
        allow: ["**/*.css", "dotenv/config"],
      },
    ],
    "jsx-a11y/anchor-is-valid": [
      "error",
      {
        components: ["Link", "NavLink"],
        specialLink: ["to"],
      },
    ],
  },
  ignorePatterns: [".next", "node_modules", "dist", "build"],
});
