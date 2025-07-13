/**
 * Configuration Management
 * Centralizes environment variable access and provides validation
 */

const path = require('path');

// Load environment variables from .env files
require('dotenv').config();

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required variables are missing
 */
function validateEnvironmentVariables() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET length (minimum 32 characters for security)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security. ' +
      'Generate a new secret using: openssl rand -base64 32'
    );
  }
}

/**
 * Gets an environment variable with optional default value
 * @param {string} key - Environment variable key
 * @param {string|number|boolean} defaultValue - Default value if not set
 * @returns {string|number|boolean} Environment variable value
 */
function getEnvVar(key, defaultValue = undefined) {
  const value = process.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return undefined;
  }
  
  // Convert string values to appropriate types
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
  
  return value;
}

/**
 * Configuration object with all application settings
 */
const config = {
  // Environment
  env: {
    NODE_ENV,
    isProduction,
    isDevelopment,
    isTest,
    port: getEnvVar('PORT', 3000)
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: getEnvVar('MONGODB_MAX_POOL_SIZE', 10),
      serverSelectionTimeoutMS: getEnvVar('MONGODB_SERVER_SELECTION_TIMEOUT', 5000),
      socketTimeoutMS: getEnvVar('MONGODB_SOCKET_TIMEOUT', 45000)
    }
  },

  // Security & Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: getEnvVar('JWT_EXPIRE', '24h'),
    jwtRefreshExpire: getEnvVar('JWT_REFRESH_EXPIRE', '7d'),
    bcryptRounds: getEnvVar('BCRYPT_ROUNDS', isProduction ? 12 : 10),
    sessionSecret: getEnvVar('SESSION_SECRET', 'dev-session-secret'),
    sessionMaxAge: getEnvVar('SESSION_MAX_AGE', 86400000),
    sessionSecure: getEnvVar('SESSION_SECURE', isProduction),
    sessionHttpOnly: getEnvVar('SESSION_HTTP_ONLY', true)
  },

  // Admin User
  admin: {
    email: getEnvVar('ADMIN_EMAIL', 'admin@pathfinder.local'),
    password: getEnvVar('ADMIN_PASSWORD', 'PathfinderAdmin2025!'),
    firstName: getEnvVar('ADMIN_FIRST_NAME', 'Admin'),
    lastName: getEnvVar('ADMIN_LAST_NAME', 'User'),
    department: getEnvVar('ADMIN_DEPARTMENT', 'Administration')
  },

  // AI Integration
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: getEnvVar('OPENAI_MODEL', 'gpt-3.5-turbo'),
      maxTokens: getEnvVar('OPENAI_MAX_TOKENS', 1000),
      temperature: getEnvVar('OPENAI_TEMPERATURE', 0.7)
    },
    rateLimits: {
      requestsPerMinute: getEnvVar('AI_REQUESTS_PER_MINUTE', 60),
      requestsPerHour: getEnvVar('AI_REQUESTS_PER_HOUR', 1000)
    }
  },

  // Email Configuration
  email: {
    host: getEnvVar('EMAIL_HOST', 'smtp.gmail.com'),
    port: getEnvVar('EMAIL_PORT', 587),
    secure: getEnvVar('EMAIL_SECURE', false),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    fromName: getEnvVar('EMAIL_FROM_NAME', 'Pathfinder Platform'),
    fromAddress: getEnvVar('EMAIL_FROM_ADDRESS', 'noreply@pathfinder.local'),
    verificationRequired: getEnvVar('EMAIL_VERIFICATION_REQUIRED', false),
    passwordResetEnabled: getEnvVar('EMAIL_PASSWORD_RESET_ENABLED', true)
  },

  // Redis Configuration
  redis: {
    url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
    password: process.env.REDIS_PASSWORD,
    db: getEnvVar('REDIS_DB', 0),
    cacheTtl: getEnvVar('CACHE_TTL', 3600),
    cacheEnabled: getEnvVar('CACHE_ENABLED', true)
  },

  // Rate Limiting
  rateLimiting: {
    enabled: getEnvVar('RATE_LIMIT_ENABLED', true),
    windowMs: getEnvVar('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    maxRequests: getEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
    api: {
      windowMs: getEnvVar('API_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
      maxRequests: getEnvVar('API_RATE_LIMIT_MAX_REQUESTS', 30)
    },
    auth: {
      windowMs: getEnvVar('AUTH_RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      maxAttempts: getEnvVar('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5)
    }
  },

  // File Upload
  fileUpload: {
    maxFileSize: getEnvVar('MAX_FILE_SIZE', 10485760), // 10MB
    maxFilesPerRequest: getEnvVar('MAX_FILES_PER_REQUEST', 5),
    uploadPath: getEnvVar('UPLOAD_PATH', './uploads'),
    allowedFileTypes: getEnvVar('ALLOWED_FILE_TYPES', '.pdf,.doc,.docx,.txt,.md,.json,.csv').split(','),
    cleanupDays: getEnvVar('FILE_CLEANUP_DAYS', 30)
  },

  // Logging
  logging: {
    level: getEnvVar('LOG_LEVEL', isDevelopment ? 'info' : 'warn'),
    toFile: getEnvVar('LOG_TO_FILE', true),
    filePath: getEnvVar('LOG_FILE_PATH', './logs/application.log'),
    maxSize: getEnvVar('LOG_MAX_SIZE', '10m'),
    maxFiles: getEnvVar('LOG_MAX_FILES', 5),
    logRequests: getEnvVar('LOG_REQUESTS', isDevelopment),
    logRequestBody: getEnvVar('LOG_REQUEST_BODY', false)
  },

  // Development Settings
  development: {
    debug: getEnvVar('DEBUG', isDevelopment),
    seedDatabase: getEnvVar('DEV_SEED_DATABASE', isDevelopment),
    generateTestData: getEnvVar('DEV_GENERATE_TEST_DATA', false),
    enablePlayground: getEnvVar('DEV_ENABLE_PLAYGROUND', isDevelopment),
    watchFiles: getEnvVar('DEV_WATCH_FILES', isDevelopment),
    autoRestart: getEnvVar('DEV_AUTO_RESTART', isDevelopment)
  },

  // WebSocket
  websocket: {
    enabled: getEnvVar('WS_ENABLED', true),
    path: getEnvVar('WS_PATH', '/socket.io'),
    corsOrigin: getEnvVar('WS_CORS_ORIGIN', isDevelopment ? 'http://localhost:3001' : false),
    rateLimiting: {
      enabled: getEnvVar('WS_RATE_LIMIT_ENABLED', true),
      maxConnections: getEnvVar('WS_RATE_LIMIT_MAX_CONNECTIONS', 100),
      maxMessagesPerMinute: getEnvVar('WS_RATE_LIMIT_MAX_MESSAGES_PER_MINUTE', 60)
    }
  },

  // Client Application
  client: {
    url: getEnvVar('CLIENT_URL', isDevelopment ? 'http://localhost:3001' : 'https://localhost:3000'),
    buildPath: getEnvVar('CLIENT_BUILD_PATH', './client/build'),
    serveStatic: getEnvVar('CLIENT_SERVE_STATIC', true)
  },

  // Analytics
  analytics: {
    enabled: getEnvVar('ANALYTICS_ENABLED', true),
    retentionDays: getEnvVar('ANALYTICS_RETENTION_DAYS', 90),
    anonymizeIp: getEnvVar('ANALYTICS_ANONYMIZE_IP', true),
    trackUserAgents: getEnvVar('ANALYTICS_TRACK_USER_AGENTS', false)
  },

  // Backup
  backup: {
    enabled: getEnvVar('BACKUP_ENABLED', false),
    schedule: getEnvVar('BACKUP_SCHEDULE', '0 2 * * *'),
    retentionDays: getEnvVar('BACKUP_RETENTION_DAYS', 30),
    location: getEnvVar('BACKUP_LOCATION', './backups')
  },

  // Monitoring
  monitoring: {
    healthCheck: {
      enabled: getEnvVar('HEALTH_CHECK_ENABLED', true),
      path: getEnvVar('HEALTH_CHECK_PATH', '/health')
    },
    performance: getEnvVar('MONITOR_PERFORMANCE', false),
    memoryThreshold: getEnvVar('MONITOR_MEMORY_THRESHOLD', 512),
    errorTracking: {
      enabled: getEnvVar('ERROR_TRACKING_ENABLED', false),
      service: process.env.ERROR_TRACKING_SERVICE
    }
  },

  // Security Headers
  security: {
    csp: {
      enabled: getEnvVar('CSP_ENABLED', true),
      scriptSrc: getEnvVar('CSP_SCRIPT_SRC', 'self,unsafe-inline').split(','),
      styleSrc: getEnvVar('CSP_STYLE_SRC', 'self,unsafe-inline').split(',')
    },
    cors: {
      origin: getEnvVar('CORS_ORIGIN', isDevelopment ? 'http://localhost:3001' : false),
      credentials: getEnvVar('CORS_CREDENTIALS', true),
      methods: getEnvVar('CORS_METHODS', 'GET,POST,PUT,DELETE,OPTIONS').split(','),
      allowedHeaders: getEnvVar('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization').split(',')
    }
  }
};

// Validate environment on module load
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  if (isProduction && !isTest) {
    process.exit(1);
  }
  // In test mode, just log the error but don't exit
}

module.exports = {
  config,
  validateEnvironmentVariables,
  getEnvVar,
  NODE_ENV,
  isProduction,
  isDevelopment,
  isTest
};
