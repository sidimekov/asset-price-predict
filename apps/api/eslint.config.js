export default [
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'build/'],
  },
];
