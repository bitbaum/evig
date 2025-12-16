// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Mock external dependencies if needed
jest.mock('../src/utils/database', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  },
  executeQuery: jest.fn(),
  executeQuerySingle: jest.fn(),
  executeTransaction: jest.fn(),
}));

// Global test setup
beforeAll(async () => {
  // Setup test database or mocks
});

afterAll(async () => {
  // Cleanup
});



