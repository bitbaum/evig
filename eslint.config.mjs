import nextConfig from "eslint-config-next";

// ─── Design system enforcement rules ────────────────────────────────────────
// Why: the BB.6 bug ("white text on grey dropdown") happened because feature
// code used a raw <select> with hand-rolled classes instead of the project's
// <Select> primitive. The primitive bakes in theme-aware tokens — bypassing it
// is the structural origin of every design bug we keep fixing.
//
// These rules make the bug class IMPOSSIBLE in new code. Existing violations
// surface as warnings (so the build doesn't break) until the migration sweep
// completes; once everything is converted, the warnings become errors.
const DESIGN_SYSTEM_RULES = {
  // Raw HTML form controls in feature code → must use @/components/ui/{Select,Input,Textarea}.
  // Exempt: the primitives themselves (in src/components/ui/) and test files.
  "no-restricted-syntax": [
    "warn",
    {
      selector: "JSXOpeningElement[name.name='select']",
      message:
        "Use <Select> from @/components/ui/select instead of raw <select>. " +
        "The primitive handles dark mode + tokens correctly; raw <select> doesn't.",
    },
    {
      selector: "JSXOpeningElement[name.name='textarea']",
      message:
        "Use <Textarea> from @/components/ui/textarea instead of raw <textarea>. " +
        "The primitive handles dark mode + tokens correctly; raw <textarea> doesn't.",
    },
    {
      // <input> is more nuanced (type=checkbox/radio/file legitimately stay raw)
      // — only flag the common text-input types where the primitive matters.
      selector:
        "JSXOpeningElement[name.name='input']" +
        ":has(JSXAttribute[name.name='type'][value.value=/^(text|email|password|tel|url|search|number|date|time|datetime-local|month|week)$/])",
      message:
        "Use <Input> from @/components/ui/input instead of raw text <input>. " +
        "The primitive handles dark mode + tokens correctly; raw <input> doesn't.",
    },
    {
      // Block raw <button> in feature code. <Button> from @/components/ui/button
      // bakes in token-aware variants, focus rings, sizes. Style drift is
      // inevitable without enforcement (see 402 violations before this rule).
      // Exempt: small components without inline action role (icon-only,
      // toolbar items) MUST still use <Button variant="ghost" size="icon" />.
      selector: "JSXOpeningElement[name.name='button']",
      message:
        "Use <Button> from @/components/ui/button instead of raw <button>. " +
        "Variants/sizes/tokens are baked in; raw <button> drifts.",
    },
  ],
};

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Standalone example apps + extracted packages aren't in the
      // RevampIT design system — the primitives we enforce live in
      // src/components/ui/ and aren't published with these.
      "examples/**",
      "packages/**",
    ],
  },
  ...nextConfig,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      // react-hooks/immutability incorrectly flags writes to browser global
      // objects (window.location.href = url, document.title = ..., etc.) as
      // mutating a "value that cannot be modified". These are legitimate
      // browser APIs, not React state. Project policy: turn the rule off
      // until the React Compiler version lands that understands globals.
      "react-hooks/immutability": "off",
      // react-hooks/set-state-in-effect fires on every "fetch in effect"
      // pattern because it traces transitive setState calls through called
      // functions. This is the standard data-loading pattern in this
      // codebase (15+ files have eslint-disable for it). Rather than
      // sprinkle disables everywhere, demote to warning project-wide so the
      // rule still flags genuine new cascading-render risks during code
      // review without blocking commits on existing data-load patterns.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Apply the design-system rules everywhere…
  {
    rules: DESIGN_SYSTEM_RULES,
  },
  // …except the primitives themselves and tests (which legitimately use raw
  // form controls — the primitives wrap them, tests render them directly).
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];

export default eslintConfig;
