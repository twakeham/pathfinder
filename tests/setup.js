/**
 * Jest Test Setup Configuration
 * Sets up test environment, database connections, and global test utilities
 */

const mongoose = require('mongoose');
const { config } = require('../src/config/config');
const { initializeTestHelpers } = require('./helpers');
const { resetGlobalMongoDatabase } = require('./mongoMemoryServer');

// Global test configuration
let testDb;
let testHelpers;

/**
 * Global setup before all tests
 * Connects to the existing MongoDB Memory Server instance
 */
beforeAll(async () => {
  try {
    // Use the global MongoDB URI set by globalSetup
    const mongoUri = global.__MONGO_URI__;
    
    if (!mongoUri) {
      throw new Error('Global MongoDB URI not found. Make sure globalSetup is configured.');
    }
    
    // Connect to test database
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    testDb = mongoose.connection;
    
    // Initialize test helpers
    testHelpers = initializeTestHelpers();
    
    console.log('Test database connected successfully');
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
    process.env.MONGODB_URI = mongoUri;
    
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
});

/**
 * Global teardown after all tests
 * Closes database connections but leaves MongoDB server for global teardown
 */
afterAll(async () => {
  try {
    // Close mongoose connection if it's not already closed
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Don't stop MongoDB memory server here - it's managed by globalTeardown
    
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test teardown error:', error);
  }
});

/**
 * Clean up database before each test
 * Ensures each test starts with a clean database state
 */
beforeEach(async () => {
  try {
    // Use the global database reset function for efficiency
    await resetGlobalMongoDatabase();
    
    // Reset any global state or mocks
    jest.clearAllMocks();
    
  } catch (error) {
    console.error('Test cleanup error:', error);
    throw error;
  }
});

/**
 * Additional cleanup after each test
 * Ensures no test state bleeds into subsequent tests
 */
afterEach(async () => {
  try {
    // Clear all timers and async operations
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Reset all mocks to their original implementation
    jest.restoreAllMocks();
    
  } catch (error) {
    console.error('Post-test cleanup error:', error);
  }
});

/**
 * Global test utilities and helpers
 */
global.testUtils = {
  /**
   * Get test database connection
   * @returns {mongoose.Connection} Test database connection
   */
  getTestDb: () => testDb,
  
  /**
   * Get MongoDB memory server instance from global scope
   * @returns {MongoMemoryServer} MongoDB memory server
   */
  getMongoServer: () => global.__MONGO_SERVER__,
  
  /**
   * Get test helpers instance
   * @returns {Object} Test helpers
   */
  getHelpers: () => testHelpers,
  
  /**
   * Access to test data factory
   * @returns {Object} Test data factory
   */
  factory: testHelpers?.factory,
  
  /**
   * Access to database test helpers
   * @returns {Object} Database helpers
   */
  db: testHelpers?.db,
  
  /**
   * Access to assertion helpers
   * @returns {Object} Assertion helpers
   */
  assert: testHelpers?.assert,
  
  /**
   * Access to mock helpers
   * @returns {Object} Mock helpers
   */
  mock: testHelpers?.mock,
  
  /**
   * Access to time helpers
   * @returns {Object} Time helpers
   */
  time: testHelpers?.time,
  
  /**
   * Create a valid test JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret (optional)
   * @returns {string} JWT token
   */
  createTestToken: (payload = { userId: 'test-user-id' }, secret = null) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret || process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  /**
   * Wait for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate random test email
   * @returns {string} Random email address
   */
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  
  /**
   * Generate random test string
   * @param {number} length - String length (default: 10)
   * @returns {string} Random string
   */
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  
  /**
   * Create test user data
   * @param {Object} overrides - Fields to override
   * @returns {Object} Test user data
   */
  createTestUserData: (overrides = {}) => ({
    email: global.testUtils.randomEmail(),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    department: 'Testing',
    role: 'User',
    isApproved: true,
    ...overrides
  }),
  
  /**
   * Create test conversation data
   * @param {Object} overrides - Fields to override
   * @returns {Object} Test conversation data
   */
  createTestConversationData: (overrides = {}) => ({
    title: `Test Conversation ${Date.now()}`,
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 1000,
    temperature: 0.7,
    isPublic: false,
    tags: ['test'],
    ...overrides
  })
};

/**
 * Custom Jest matchers for common assertions
 */
expect.extend({
  /**
   * Check if object has MongoDB ObjectId format
   * @param {any} received - Value to check
   * @returns {Object} Jest matcher result
   */
  toBeValidObjectId(received) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(received);
    
    return {
      message: () => `expected ${received} ${isValidObjectId ? 'not ' : ''}to be a valid MongoDB ObjectId`,
      pass: isValidObjectId
    };
  },
  
  /**
   * Check if date is recent (within last 5 seconds)
   * @param {any} received - Value to check
   * @returns {Object} Jest matcher result
   */
  toBeRecentDate(received) {
    const date = new Date(received);
    const now = new Date();
    const diffMs = now - date;
    const isRecent = diffMs >= 0 && diffMs <= 5000; // Within 5 seconds
    
    return {
      message: () => `expected ${received} ${isRecent ? 'not ' : ''}to be a recent date (within 5 seconds)`,
      pass: isRecent
    };
  },
  
  /**
   * Check if response has API error format
   * @param {any} received - Response to check
   * @returns {Object} Jest matcher result
   */
  toHaveApiErrorFormat(received) {
    const hasErrorFormat = received &&
      typeof received === 'object' &&
      'success' in received &&
      received.success === false &&
      'error' in received &&
      typeof received.error === 'string';
    
    return {
      message: () => `expected response ${hasErrorFormat ? 'not ' : ''}to have API error format`,
      pass: hasErrorFormat
    };
  }
});

/**
 * Console override for test environment
 * Suppress certain log levels during testing unless DEBUG is set
 */
const originalConsole = { ...console };

if (!process.env.DEBUG && !process.env.VERBOSE_TESTS) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for debugging test failures
}

// Restore console in case tests need it
global.testConsole = originalConsole;

/**
 * Handle unhandled promise rejections in tests
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test on unhandled rejections
  throw reason;
});

/**
 * Set test timeout
 */
jest.setTimeout(30000); // 30 seconds

console.log('Jest test environment setup completed');
