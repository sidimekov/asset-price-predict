export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: await import('@typescript-eslint/parser').then((m) => m.default),
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        setTimeout: 'readonly',
        alert: 'readonly',
        module: 'readonly',
        process: 'readonly',
        screen: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        MouseEvent: 'readonly',
        Node: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'dist/',
      'build/',
      'out/',
      'coverage/',
    ],
  },
];
