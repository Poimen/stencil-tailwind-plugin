module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
  },
  extends: [
    'semistandard',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-unused-vars': 'off',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    '@typescript-eslint/explicit-module-boundary-types': ['error', {
      allowedNames: ['render']
    }],
    'no-multi-spaces': ['error', { ignoreEOLComments: true }]
  },
  overrides: [{
    files: ['*.ts', '*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['error']
    }
  }, {
    files: ['*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': ['off']
    }
  }]
};
