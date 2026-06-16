import nextConfig from "eslint-config-next";

// ─── Design system enforcement rules ────────────────────────────────────────
// Why: the BB.6 bug ("white text on grey dropdown") happened because feature
// code used a raw <select> with hand-rolled classes instead of the project's
// <Select> primitive. The primitive bakes in theme-aware tokens — bypassing it
// is the structural origin of every design bug we keep fixing.
//
// Palette rules graduate to errors on public locale routes (Phase 4, 2026-06-15).
// Everywhere else they stay warnings until the migration sweep completes.

const FORM_CONTROL_SYNTAX = [
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
    selector:
      "JSXOpeningElement[name.name='input']" +
      ":has(JSXAttribute[name.name='type'][value.value=/^(text|email|password|tel|url|search|number|date|time|datetime-local|month|week)$/])",
    message:
      "Use <Input> from @/components/ui/input instead of raw text <input>. " +
      "The primitive handles dark mode + tokens correctly; raw <input> doesn't.",
  },
  {
    selector: "JSXOpeningElement[name.name='button']",
    message:
      "Use <Button> from @/components/ui/button instead of raw <button>. " +
      "Variants/sizes/tokens are baked in; raw <button> drifts.",
  },
];

const PALETTE_CLASS_SYNTAX = [
  {
    selector:
      "JSXAttribute[name.name='className'] > Literal[value=/\\bbg-white\\b/]",
    message:
      "Use bg-surface-base (semantic token) instead of bg-white. " +
      "See docs/DESIGN_SYSTEM.md.",
  },
  {
    selector:
      "JSXAttribute[name.name='className'] > Literal[value=/\\btext-neutral-/]",
    message:
      "Use text-text-primary|secondary|tertiary|muted instead of text-neutral-*. " +
      "See docs/DESIGN_SYSTEM.md.",
  },
  {
    selector:
      "JSXAttribute[name.name='className'] > Literal[value=/\\bbg-neutral-/]",
    message:
      "Use bg-surface-base|raised|overlay instead of bg-neutral-*. " +
      "See docs/DESIGN_SYSTEM.md.",
  },
  {
    selector:
      "JSXAttribute[name.name='className'] > Literal[value=/\\bbg-primary-/]",
    message:
      "Use bg-action / bg-action-muted for brand green surfaces. " +
      "Palette bg-primary-* is for status badges only. See docs/DESIGN_SYSTEM.md.",
  },
  {
    selector:
      "JSXAttribute[name.name='className'] > Literal[value=/\\bshadow-(lg|xl|2xl)\\b/]",
    message:
      "Avoid shadow-lg/xl/2xl on static cards — use border + hover:border-strong. " +
      "Shadows are OK on floating overlays (dropdowns, modals). See docs/DESIGN_SYSTEM.md.",
  },
];

const DESIGN_SYSTEM_SYNTAX = [...FORM_CONTROL_SYNTAX, ...PALETTE_CLASS_SYNTAX];

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "examples/**",
      "packages/**",
    ],
  },
  ...nextConfig,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    rules: {
      "no-restricted-syntax": ["error", ...DESIGN_SYSTEM_SYNTAX],
    },
  },
  // Public locale routes: same strict rules (kept explicit for clarity in reviews).
  {
    files: ["src/app/[locale]/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...DESIGN_SYSTEM_SYNTAX],
    },
  },
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/admin/AdminButton.tsx",
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
