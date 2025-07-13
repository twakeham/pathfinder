const mongoose = require('mongoose');

/**
 * MongoDB connection configuration and management
 * Handles connection establishment, error handling, and graceful shutdown
 */

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelayMs = 1000; // Initial retry delay
    this.maxRetryDelayMs = 30000; // Maximum retry delay (30 seconds)
    this.connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };
  }

  /**
   * Connect to MongoDB database with retry logic
   * @param {string} connectionString - MongoDB connection URI
   * @param {boolean} enableRetry - Whether to enable retry logic (default: true)
   * @returns {Promise<void>}
   */
  async connect(connectionString, enableRetry = true) {
    try {
      if (this.isConnected) {
        console.log('Database already connected');
        return;
      }

      console.log(`Connecting to MongoDB (attempt ${this.retryAttempts + 1}/${this.maxRetryAttempts + 1})...`);
      
      this.connection = await mongoose.connect(connectionString, this.connectionOptions);
      this.isConnected = true;
      this.retryAttempts = 0; // Reset retry counter on successful connection
      
      console.log(`MongoDB connected successfully to: ${this.connection.connection.host}:${this.connection.connection.port}/${this.connection.connection.name}`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${this.retryAttempts + 1}):`, error.message);
      this.isConnected = false;
      
      if (enableRetry && this.retryAttempts < this.maxRetryAttempts) {
        return this.retryConnection(connectionString);
      } else {
        console.error(`Failed to connect to MongoDB after ${this.retryAttempts + 1} attempts`);
        throw error;
      }
    }
  }

  /**
   * Retry connection with exponential backoff
   * @param {string} connectionString - MongoDB connection URI
   * @returns {Promise<void>}
   */
  async retryConnection(connectionString) {
    this.retryAttempts++;
    
    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(this.retryDelayMs * Math.pow(2, this.retryAttempts - 1), this.maxRetryDelayMs);
    const jitter = Math.random() * 0.1 * baseDelay; // Add up to 10% jitter
    const delay = baseDelay + jitter;
    
    console.log(`Retrying connection in ${Math.round(delay)}ms...`);
    
    await this.sleep(delay);
    return this.connect(connectionString, true);
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set up mongoose connection event listeners with reconnection logic
   */
  setupEventListeners() {
    const db = mongoose.connection;

    db.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
      this.isConnected = true;
      this.retryAttempts = 0; // Reset retry counter on successful connection
    });

    db.on('error', (error) => {
      console.error('Mongoose connection error:', error.message);
      this.isConnected = false;
      
      // Handle specific error types
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        console.log('Network error detected, connection will be retried automatically');
      }
    });

    db.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Attempt reconnection if not intentionally disconnected
      if (!this.intentionalDisconnect) {
        console.log('Unexpected disconnection, attempting to reconnect...');
        this.handleReconnection();
      }
    });

    db.on('reconnected', () => {
      console.log('Mongoose reconnected to MongoDB');
      this.isConnected = true;
      this.retryAttempts = 0;
    });

    db.on('reconnectFailed', () => {
      console.error('Mongoose failed to reconnect to MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // For nodemon restarts
  }

  /**
   * Handle automatic reconnection with retry logic
   * @returns {Promise<void>}
   */
  async handleReconnection() {
    if (this.isConnected || this.retryAttempts >= this.maxRetryAttempts) {
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathfinder-dev';
      await this.retryConnection(mongoUri);
    } catch (error) {
      console.error('Automatic reconnection failed:', error.message);
    }
  }

  /**
   * Gracefully close the database connection
   * @param {boolean} intentional - Whether this is an intentional disconnect
   * @returns {Promise<void>}
   */
  async disconnect(intentional = true) {
    try {
      this.intentionalDisconnect = intentional;
      
      if (this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      throw error;
    } finally {
      this.intentionalDisconnect = false;
    }
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    try {
      await this.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isConnectionReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Reset retry state
   */
  resetRetryState() {
    this.retryAttempts = 0;
  }

  /**
   * Get connection status information
   * @returns {object}
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: this.getReadyStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts,
    };
  }

  /**
   * Get human-readable connection state
   * @param {number} state - Mongoose connection ready state
   * @returns {string}
   */
  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }

  /**
   * Perform connection health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      if (!this.isConnectionReady()) {
        return false;
      }

      // Ping the database to ensure it's responsive
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Wait for database connection to be ready
   * @param {number} timeoutMs - Maximum time to wait in milliseconds
   * @returns {Promise<boolean>}
   */
  async waitForConnection(timeoutMs = 10000) {
    const startTime = Date.now();
    
    while (!this.isConnectionReady() && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.isConnectionReady();
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

/**
 * Initialize database connection with environment configuration and retry logic
 * @param {boolean} enableRetry - Whether to enable retry logic (default: true)
 * @returns {Promise<void>}
 */
async function initializeDatabase(enableRetry = true) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathfinder-dev';
  
  try {
    console.log('Initializing database connection...');
    await databaseConnection.connect(mongoUri, enableRetry);
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize database connection:', error.message);
    throw error;
  }
}

/**
 * Get the database connection instance
 * @returns {DatabaseConnection}
 */
function getDatabaseConnection() {
  return databaseConnection;
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabaseConnection() {
  return databaseConnection.disconnect();
}

module.exports = {
  initializeDatabase,
  getDatabaseConnection,
  closeDatabaseConnection,
  DatabaseConnection,
  // Additional utility functions
  healthCheck: () => databaseConnection.healthCheck(),
  getConnectionStatus: () => databaseConnection.getConnectionStatus(),
  resetRetryState: () => databaseConnection.resetRetryState(),
};
