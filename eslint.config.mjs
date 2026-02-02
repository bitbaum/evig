import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      "medusa-backend/.medusa/**",
      "medusa-backend/node_modules/**",
      ".next/**",
      "node_modules/**",
    ],
  },
  ...nextConfig,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
