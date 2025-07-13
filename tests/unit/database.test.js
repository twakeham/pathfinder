/**
 * Database Connection and Error Handling Tests
 * Tests for src/config/database.js functionality
 */

const mongoose = require('mongoose');
const DatabaseManager = require('../../src/config/database');

// Mock mongoose to control connection behavior
jest.mock('mongoose');

describe('Database Connection and Error Handling', () => {
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    // Capture console output
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();

    // Reset mongoose mocks
    jest.clearAllMocks();
    
    // Reset DatabaseManager singleton state
    if (DatabaseManager.instance) {
      DatabaseManager.instance = null;
    }
  });

  afterEach(() => {
    // Restore console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('Singleton Pattern', () => {
    test('should return same instance on multiple calls', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DatabaseManager);
    });

    test('should prevent direct instantiation', () => {
      expect(() => new DatabaseManager()).toThrow('Use DatabaseManager.getInstance()');
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully with valid URI', async () => {
      const mockConnect = jest.fn().mockResolvedValue(true);
      mongoose.connect = mockConnect;
      mongoose.connection = {
        readyState: 1, // Connected
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      const result = await dbManager.connect('mongodb://localhost:27017/test');

      expect(result).toBe(true);
      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false
        })
      );
    });

    test('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection failed');
      const mockConnect = jest.fn().mockRejectedValue(connectionError);
      mongoose.connect = mockConnect;
      mongoose.connection = {
        readyState: 0, // Disconnected
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      const result = await dbManager.connect('mongodb://invalid:27017/test');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Database connection failed:',
        connectionError
      );
    });

    test('should implement retry logic with exponential backoff', async () => {
      let attemptCount = 0;
      const mockConnect = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve(true);
      });

      mongoose.connect = mockConnect;
      mongoose.connection = {
        readyState: 1, // Connected on final attempt
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      const startTime = Date.now();
      const result = await dbManager.connect('mongodb://localhost:27017/test');
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(mockConnect).toHaveBeenCalledTimes(3);
      expect(endTime - startTime).toBeGreaterThan(100); // Should have some delay from retries
    });

    test('should fail after maximum retry attempts', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Persistent connection failure'));
      mongoose.connect = mockConnect;
      mongoose.connection = {
        readyState: 0, // Disconnected
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      const result = await dbManager.connect('mongodb://invalid:27017/test');

      expect(result).toBe(false);
      expect(mockConnect).toHaveBeenCalledTimes(3); // Default max retries
    });
  });

  describe('Connection State Management', () => {
    test('should return correct connection status', () => {
      mongoose.connection = { readyState: 1 };
      const dbManager = DatabaseManager.getInstance();
      
      expect(dbManager.isConnected()).toBe(true);
    });

    test('should return false when disconnected', () => {
      mongoose.connection = { readyState: 0 };
      const dbManager = DatabaseManager.getInstance();
      
      expect(dbManager.isConnected()).toBe(false);
    });

    test('should return connection health status', () => {
      mongoose.connection = {
        readyState: 1,
        host: 'localhost',
        port: 27017,
        name: 'testdb'
      };

      const dbManager = DatabaseManager.getInstance();
      const health = dbManager.getHealth();

      expect(health).toEqual(expect.objectContaining({
        status: 'connected',
        host: 'localhost',
        port: 27017,
        database: 'testdb'
      }));
    });
  });

  describe('Event Handling', () => {
    test('should register connection event listeners', () => {
      const mockOn = jest.fn();
      const mockOnce = jest.fn();
      
      mongoose.connection = {
        readyState: 0,
        on: mockOn,
        once: mockOnce,
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      dbManager.connect('mongodb://localhost:27017/test');

      expect(mockOn).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockOnce).toHaveBeenCalledWith('open', expect.any(Function));
    });

    test('should handle reconnection events', () => {
      const mockOn = jest.fn();
      const listeners = {};
      
      mockOn.mockImplementation((event, callback) => {
        listeners[event] = callback;
      });

      mongoose.connection = {
        readyState: 0,
        on: mockOn,
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      dbManager.connect('mongodb://localhost:27017/test');

      // Simulate reconnection event
      listeners.connected();
      
      expect(console.log).toHaveBeenCalledWith('Database reconnected successfully');
    });
  });

  describe('Graceful Shutdown', () => {
    test('should close connection gracefully', async () => {
      const mockClose = jest.fn().mockResolvedValue(true);
      mongoose.connection = {
        readyState: 1,
        close: mockClose,
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      await dbManager.disconnect();

      expect(mockClose).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Database connection closed gracefully');
    });

    test('should handle disconnect errors', async () => {
      const disconnectError = new Error('Disconnect failed');
      const mockClose = jest.fn().mockRejectedValue(disconnectError);
      
      mongoose.connection = {
        readyState: 1,
        close: mockClose,
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn()
      };

      const dbManager = DatabaseManager.getInstance();
      await dbManager.disconnect();

      expect(console.error).toHaveBeenCalledWith(
        'Error during database disconnection:',
        disconnectError
      );
    });
  });

  describe('Error Classification', () => {
    test('should classify network errors correctly', () => {
      const networkError = new Error('ECONNREFUSED');
      networkError.code = 'ECONNREFUSED';

      const dbManager = DatabaseManager.getInstance();
      const classification = dbManager.classifyError(networkError);

      expect(classification.type).toBe('network');
      expect(classification.retryable).toBe(true);
    });

    test('should classify authentication errors correctly', () => {
      const authError = new Error('Authentication failed');
      authError.code = 18; // MongoDB auth error code

      const dbManager = DatabaseManager.getInstance();
      const classification = dbManager.classifyError(authError);

      expect(classification.type).toBe('authentication');
      expect(classification.retryable).toBe(false);
    });

    test('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Server selection timed out');
      timeoutError.name = 'MongoTimeoutError';

      const dbManager = DatabaseManager.getInstance();
      const classification = dbManager.classifyError(timeoutError);

      expect(classification.type).toBe('timeout');
      expect(classification.retryable).toBe(true);
    });
  });
});
