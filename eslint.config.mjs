import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['.next/**', '.next-dev/**', '.cache/**', '.vercel/**', 'engines/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.{js,mjs}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.node, ...globals.browser } },
    plugins: { react, 'react-hooks': hooks }, settings: { react: { version: 'detect' } },
    rules: { ...react.configs.recommended.rules, ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off', 'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }] } },
];
