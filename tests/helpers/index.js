/**
 * Test Helpers Index
 * Centralized export of all test utilities and helpers
 */

const testDataFactory = require('./testDataFactory');
const {
  ApiTestHelpers,
  DatabaseTestHelpers,
  AssertionHelpers,
  MockHelpers,
  TimeHelpers
} = require('./testHelpers');

/**
 * Initialize test helpers with app instance
 * @param {Object} app - Express app instance
 * @returns {Object} Initialized test helpers
 */
function initializeTestHelpers(app = null) {
  return {
    // Data factory for creating test data
    factory: testDataFactory,
    
    // API testing utilities (requires app instance)
    api: app ? new ApiTestHelpers(app) : null,
    
    // Database testing utilities
    db: new DatabaseTestHelpers(),
    
    // Assertion utilities
    assert: new AssertionHelpers(),
    
    // Mocking utilities
    mock: new MockHelpers(),
    
    // Time manipulation utilities
    time: new TimeHelpers(),
    
    // Quick access to commonly used utilities
    createUser: testDataFactory.createUserData.bind(testDataFactory),
    createAdmin: testDataFactory.createAdminData.bind(testDataFactory),
    createInstructor: testDataFactory.createInstructorData.bind(testDataFactory),
    createCourse: testDataFactory.createCourseData.bind(testDataFactory),
    createConversation: testDataFactory.createConversationData.bind(testDataFactory),
    createPromptTemplate: testDataFactory.createPromptTemplateData.bind(testDataFactory),
    
    // Quick access to common patterns
    resetCounters: testDataFactory.resetCounters.bind(testDataFactory),
    generateObjectId: () => new (require('mongoose').Types.ObjectId)().toString(),
    randomString: testDataFactory.randomString || ((prefix = 'test') => `${prefix}-${Math.random().toString(36).substring(2, 15)}`),
    
    // Common test data sets
    getTestUsers: async (count = 3) => {
      const users = [];
      users.push(await testDataFactory.createAdminData());
      users.push(await testDataFactory.createInstructorData());
      for (let i = 2; i < count; i++) {
        users.push(await testDataFactory.createUserData());
      }
      return users;
    },
    
    getTestCourseStructure: (options = {}) => {
      const { moduleCount = 2, lessonsPerModule = 3 } = options;
      return testDataFactory.createCourseStructure({}, moduleCount, lessonsPerModule);
    }
  };
}

// Export factory functions and classes for direct use
module.exports = {
  initializeTestHelpers,
  testDataFactory,
  ApiTestHelpers,
  DatabaseTestHelpers,
  AssertionHelpers,
  MockHelpers,
  TimeHelpers
};
