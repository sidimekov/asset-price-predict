export default [
  {
    files: ['*.{js,ts,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.venv*/',
      'apps/',
      'packages/',
      'dist/',
      'build/',
      '.next/',
    ],
  },
];
