module.exports = {
  roots: [
    '<rootDir>/src'
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // setupTestFrameworkScriptFile: 'jest-extended'
  setupFilesAfterEnv: ['jest-extended', './src/test/test-setup.ts']
};
