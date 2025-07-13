/**
 * Test Helper Utilities
 * Common utilities for test setup, assertions, and data manipulation
 */

const request = require('supertest');
const { ObjectId } = require('mongoose').Types;

/**
 * API Test Helpers
 * Utilities for testing API endpoints
 */
class ApiTestHelpers {
  constructor(app) {
    this.app = app;
    this.agent = request(app);
  }

  /**
   * Authenticate a user and return auth token
   * @param {Object} userData - User credentials
   * @returns {Promise<string>} JWT token
   */
  async authenticateUser(userData) {
    const response = await this.agent
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.rawPassword || 'TestPassword123!'
      })
      .expect(200);

    return response.body.token;
  }

  /**
   * Make authenticated request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {string} token - JWT token
   * @param {Object} data - Request data
   * @returns {Promise} Supertest request
   */
  async authenticatedRequest(method, url, token, data = {}) {
    const req = this.agent[method.toLowerCase()](url)
      .set('Authorization', `Bearer ${token}`);
    
    if (method !== 'GET' && method !== 'DELETE') {
      req.send(data);
    }
    
    return req;
  }

  /**
   * Test standard CRUD operations for a resource
   * @param {string} baseUrl - Base URL for the resource
   * @param {string} token - Auth token
   * @param {Object} testData - Test data for create/update
   * @param {Object} updateData - Data for update operation
   * @returns {Promise<Object>} Test results
   */
  async testCrudOperations(baseUrl, token, testData, updateData = {}) {
    const results = {};

    // Test CREATE
    const createResponse = await this.authenticatedRequest('POST', baseUrl, token, testData);
    results.created = createResponse.body;
    results.createStatus = createResponse.status;

    if (createResponse.status === 201) {
      const resourceId = createResponse.body._id || createResponse.body.id;

      // Test READ (single)
      const readResponse = await this.authenticatedRequest('GET', `${baseUrl}/${resourceId}`, token);
      results.read = readResponse.body;
      results.readStatus = readResponse.status;

      // Test UPDATE
      if (Object.keys(updateData).length > 0) {
        const updateResponse = await this.authenticatedRequest('PUT', `${baseUrl}/${resourceId}`, token, updateData);
        results.updated = updateResponse.body;
        results.updateStatus = updateResponse.status;
      }

      // Test DELETE
      const deleteResponse = await this.authenticatedRequest('DELETE', `${baseUrl}/${resourceId}`, token);
      results.deleteStatus = deleteResponse.status;
    }

    return results;
  }

  /**
   * Test pagination for a resource
   * @param {string} url - Resource URL
   * @param {string} token - Auth token
   * @param {Object} paginationParams - Pagination parameters
   * @returns {Promise<Object>} Pagination test results
   */
  async testPagination(url, token, paginationParams = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationParams;
    
    const response = await this.authenticatedRequest('GET', 
      `${url}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, 
      token
    );

    return {
      status: response.status,
      data: response.body.data || response.body,
      pagination: response.body.pagination,
      total: response.body.total,
      hasNextPage: response.body.hasNextPage,
      hasPrevPage: response.body.hasPrevPage
    };
  }
}

/**
 * Database Test Helpers
 * Utilities for database operations in tests
 */
class DatabaseTestHelpers {
  /**
   * Create a test user in database
   * @param {Object} User - User model
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createTestUser(User, userData) {
    const user = new User(userData);
    await user.save();
    user.rawPassword = userData.password; // Store raw password for login tests
    return user;
  }

  /**
   * Create multiple test users
   * @param {Object} User - User model
   * @param {Array} usersData - Array of user data
   * @returns {Promise<Array>} Created users
   */
  async createTestUsers(User, usersData) {
    const users = [];
    for (const userData of usersData) {
      users.push(await this.createTestUser(User, userData));
    }
    return users;
  }

  /**
   * Create test data with relationships
   * @param {Object} models - Object containing all models
   * @param {Object} testData - Test data structure
   * @returns {Promise<Object>} Created entities with relationships
   */
  async createRelatedTestData(models, testData) {
    const results = {};

    // Create users first
    if (testData.users) {
      results.users = await this.createTestUsers(models.User, testData.users);
    }

    // Create courses with instructor relationships
    if (testData.courses) {
      results.courses = [];
      for (const courseData of testData.courses) {
        if (courseData.instructor && results.users) {
          const instructor = results.users.find(u => u.role === 'Instructor');
          if (instructor) {
            courseData.instructor = instructor._id;
          }
        }
        const course = new models.Course(courseData);
        await course.save();
        results.courses.push(course);
      }
    }

    // Create modules linked to courses
    if (testData.modules && results.courses) {
      results.modules = [];
      for (const moduleData of testData.modules) {
        if (!moduleData.courseId && results.courses.length > 0) {
          moduleData.courseId = results.courses[0]._id;
        }
        const module = new models.Module(moduleData);
        await module.save();
        results.modules.push(module);
      }
    }

    // Create lessons linked to modules
    if (testData.lessons && results.modules) {
      results.lessons = [];
      for (const lessonData of testData.lessons) {
        if (!lessonData.moduleId && results.modules.length > 0) {
          lessonData.moduleId = results.modules[0]._id;
        }
        const lesson = new models.Lesson(lessonData);
        await lesson.save();
        results.lessons.push(lesson);
      }
    }

    return results;
  }

  /**
   * Clean up test data by IDs
   * @param {Object} models - Object containing all models
   * @param {Object} entityIds - Object with arrays of IDs to clean up
   * @returns {Promise<void>}
   */
  async cleanupTestData(models, entityIds) {
    const cleanupPromises = [];

    Object.keys(entityIds).forEach(modelName => {
      if (models[modelName] && entityIds[modelName].length > 0) {
        cleanupPromises.push(
          models[modelName].deleteMany({ _id: { $in: entityIds[modelName] } })
        );
      }
    });

    await Promise.all(cleanupPromises);
  }

  /**
   * Assert database state
   * @param {Object} Model - Mongoose model
   * @param {Object} query - Query to find documents
   * @param {number} expectedCount - Expected number of documents
   * @returns {Promise<Array>} Found documents
   */
  async assertDatabaseState(Model, query, expectedCount) {
    const documents = await Model.find(query);
    expect(documents).toHaveLength(expectedCount);
    return documents;
  }

  /**
   * Generate valid ObjectId
   * @returns {string} Valid ObjectId string
   */
  generateObjectId() {
    return new ObjectId().toString();
  }

  /**
   * Check if string is valid ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} True if valid ObjectId
   */
  isValidObjectId(id) {
    return ObjectId.isValid(id);
  }
}

/**
 * Assertion Helpers
 * Custom assertion utilities for common test patterns
 */
class AssertionHelpers {
  /**
   * Assert API response structure
   * @param {Object} response - API response
   * @param {number} expectedStatus - Expected status code
   * @param {Array} requiredFields - Required fields in response
   */
  assertApiResponse(response, expectedStatus, requiredFields = []) {
    expect(response.status).toBe(expectedStatus);
    
    if (response.body) {
      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });
    }
  }

  /**
   * Assert MongoDB document structure
   * @param {Object} document - MongoDB document
   * @param {Array} requiredFields - Required fields
   * @param {Object} expectedValues - Expected field values
   */
  assertMongoDocument(document, requiredFields = [], expectedValues = {}) {
    expect(document).toBeTruthy();
    expect(document._id).toBeTruthy();
    expect(document.createdAt).toBeTruthy();
    expect(document.updatedAt).toBeTruthy();

    requiredFields.forEach(field => {
      expect(document).toHaveProperty(field);
    });

    Object.keys(expectedValues).forEach(field => {
      expect(document[field]).toBe(expectedValues[field]);
    });
  }

  /**
   * Assert pagination response
   * @param {Object} response - Paginated response
   * @param {Object} expectedPagination - Expected pagination values
   */
  assertPaginationResponse(response, expectedPagination = {}) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('pagination');
    expect(Array.isArray(response.data)).toBe(true);

    const pagination = response.pagination;
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('pages');

    Object.keys(expectedPagination).forEach(key => {
      expect(pagination[key]).toBe(expectedPagination[key]);
    });
  }

  /**
   * Assert authentication response
   * @param {Object} response - Auth response
   * @param {boolean} shouldSucceed - Whether auth should succeed
   */
  assertAuthResponse(response, shouldSucceed = true) {
    if (shouldSucceed) {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    } else {
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    }
  }

  /**
   * Assert validation errors
   * @param {Object} response - API response with validation errors
   * @param {Array} expectedFields - Fields that should have errors
   */
  assertValidationErrors(response, expectedFields = []) {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    
    const errors = response.body.errors;
    expectedFields.forEach(field => {
      expect(errors[field]).toBeTruthy();
    });
  }
}

/**
 * Mock Helpers
 * Utilities for creating mocks and stubs
 */
class MockHelpers {
  /**
   * Create mock request object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock request
   */
  createMockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: null,
      ...overrides
    };
  }

  /**
   * Create mock response object
   * @param {Object} overrides - Properties to override
   * @returns {Object} Mock response
   */
  createMockResponse(overrides = {}) {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      ...overrides
    };
    return res;
  }

  /**
   * Create mock next function
   * @returns {Function} Mock next function
   */
  createMockNext() {
    return jest.fn();
  }

  /**
   * Mock external API calls
   * @param {Object} mockResponses - Object with URL patterns and responses
   * @returns {Object} Mock configuration
   */
  mockExternalApis(mockResponses = {}) {
    const axios = require('axios');
    
    Object.keys(mockResponses).forEach(urlPattern => {
      axios.get.mockImplementation((url) => {
        if (url.includes(urlPattern)) {
          return Promise.resolve({ data: mockResponses[urlPattern] });
        }
        return Promise.reject(new Error('Unmocked URL'));
      });
    });

    return axios;
  }
}

/**
 * Time Helpers
 * Utilities for handling time in tests
 */
class TimeHelpers {
  /**
   * Freeze time for consistent testing
   * @param {Date} freezeDate - Date to freeze time at
   * @returns {Function} Function to restore time
   */
  freezeTime(freezeDate = new Date('2025-01-01T00:00:00Z')) {
    const originalNow = Date.now;
    Date.now = jest.fn(() => freezeDate.getTime());
    
    return () => {
      Date.now = originalNow;
    };
  }

  /**
   * Create date relative to now
   * @param {number} daysOffset - Days to offset from now
   * @returns {Date} Offset date
   */
  createRelativeDate(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  /**
   * Wait for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  ApiTestHelpers,
  DatabaseTestHelpers,
  AssertionHelpers,
  MockHelpers,
  TimeHelpers
};
