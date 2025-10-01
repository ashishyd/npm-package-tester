module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.types.ts',
    '!src/**/*.interface.ts',
    '!src/cli/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 60,
      lines: 65,
      statements: 65,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000, // Docker operations can take time
};
