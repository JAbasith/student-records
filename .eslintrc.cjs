module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["node_modules/", "web/", ".husky/", ".next/", "dist/", "build/"],
};
