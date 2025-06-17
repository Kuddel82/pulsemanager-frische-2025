module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'api/**/*.js',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/main.jsx',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/services/GermanTaxService.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/services/TaxReportService_FINAL.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/api/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/Backup100%MoralisEnterprice11.06.25/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))'
  ],
  globals: {
    'process.env': {
      NODE_ENV: 'test'
    }
  }
}; 