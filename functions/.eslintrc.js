module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:import/errors', 'plugin:import/warnings', 'plugin:import/typescript', 'google', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/nexus-typegen.ts', // Nexus tool generated code.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'indent': ['error', 2],
    'object-curly-spacing': ['error', 'always'],
    'max-len': ['error', { code: 180 }],
    'import/no-unresolved': 0,
    'require-jsdoc': 0,
    'valid-jsdoc': 'off',
    'new-cap': 0,
    'linebreak-style': 0,
    'import/namespace': 0,
  },
};
