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
    '@typescript-eslint/no-explicit-any': 'off',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    '@typescript-eslint/explicit-module-boundary-types': ['error', {
      allowedNames: ['render']
    }],
    'no-multi-spaces': ['error', { ignoreEOLComments: true }],
    'dot-notation': ['error', { allowPattern: 'name' }]
  },
  overrides: [{
    files: ['*.ts', '*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['error']
    },
    env: {
      jest: true
    }
  }, {
    files: ['*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': ['off']
    }
  }]
};
