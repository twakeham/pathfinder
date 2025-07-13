#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are properly configured
 * Can be run standalone or imported as a module
 */

const { validateEnvironmentVariables, config } = require('./config');

/**
 * Additional validation checks beyond basic presence
 */
function performExtendedValidation() {
  const errors = [];
  const warnings = [];

  // Validate MongoDB URI format
  if (config.database.uri) {
    if (!config.database.uri.startsWith('mongodb://') && !config.database.uri.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
    }
  }

  // Validate JWT secret strength
  if (config.auth.jwtSecret) {
    if (config.auth.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for security');
    }
    if (config.auth.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production-minimum-256-bits') {
      warnings.push('JWT_SECRET is using the default example value - change this immediately!');
    }
  }

  // Validate admin credentials in production
  if (config.env.isProduction) {
    if (config.admin.password === 'PathfinderAdmin2025!') {
      errors.push('ADMIN_PASSWORD is using the default value in production - this is a security risk!');
    }
    if (config.admin.email === 'admin@pathfinder.local') {
      warnings.push('ADMIN_EMAIL is using the default value in production - consider changing this');
    }
  }

  // Validate OpenAI API key format
  if (config.ai.openai.apiKey && config.ai.openai.apiKey !== 'your-openai-api-key-here') {
    if (!config.ai.openai.apiKey.startsWith('sk-')) {
      warnings.push('OPENAI_API_KEY does not appear to be in the correct format (should start with "sk-")');
    }
  }

  // Validate email configuration if enabled
  if (config.email.verificationRequired || config.email.passwordResetEnabled) {
    if (!config.email.user || !config.email.pass) {
      warnings.push('Email features are enabled but EMAIL_USER and EMAIL_PASS are not configured');
    }
  }

  // Validate rate limiting values
  if (config.rateLimiting.maxRequests <= 0) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be a positive number');
  }

  // Validate port number
  if (config.env.port < 1 || config.env.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate file upload settings
  if (config.fileUpload.maxFileSize <= 0) {
    errors.push('MAX_FILE_SIZE must be a positive number');
  }

  return { errors, warnings };
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');

  try {
    // Basic required variable validation
    validateEnvironmentVariables();
    console.log('✅ All required environment variables are present');

    // Extended validation
    const { errors, warnings } = performExtendedValidation();

    // Report warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('\nPlease fix these errors before running the application.');
      return false;
    }

    // Success
    console.log('\n✅ Environment validation completed successfully!');
    
    // Show configuration summary
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${config.env.NODE_ENV}`);
    console.log(`   Port: ${config.env.port}`);
    console.log(`   Database: ${config.database.uri.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
    console.log(`   JWT Expiration: ${config.auth.jwtExpire}`);
    console.log(`   Rate Limiting: ${config.rateLimiting.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   WebSocket: ${config.websocket.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Analytics: ${config.analytics.enabled ? 'Enabled' : 'Disabled'}`);

    return true;

  } catch (error) {
    console.log(`\n❌ Environment validation failed: ${error.message}`);
    console.log('\nPlease check your .env file and ensure all required variables are set.');
    return false;
  }
}

/**
 * Generate a sample .env file with secure defaults
 */
function generateSecureEnv() {
  const crypto = require('crypto');
  
  console.log('🔧 Generating secure environment configuration...\n');
  
  const secureJwtSecret = crypto.randomBytes(32).toString('base64');
  const secureSessionSecret = crypto.randomBytes(32).toString('base64');
  
  console.log('# Secure Environment Variables');
  console.log('# Generated on:', new Date().toISOString());
  console.log('');
  console.log('# REQUIRED VARIABLES');
  console.log(`JWT_SECRET=${secureJwtSecret}`);
  console.log(`SESSION_SECRET=${secureSessionSecret}`);
  console.log('MONGODB_URI=mongodb://localhost:27017/pathfinder-dev');
  console.log('NODE_ENV=development');
  console.log('');
  console.log('# IMPORTANT: Change the admin password immediately!');
  console.log('ADMIN_PASSWORD=ChangeThisSecurePassword123!');
  console.log('');
  console.log('# Copy the above to your .env file and customize as needed');
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate') || args.includes('-g')) {
    generateSecureEnv();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Environment Validation Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node src/config/validateEnv.js          Validate current environment');
    console.log('  node src/config/validateEnv.js -g       Generate secure defaults');
    console.log('  node src/config/validateEnv.js --help   Show this help');
  } else {
    const isValid = validateEnvironment();
    process.exit(isValid ? 0 : 1);
  }
}

module.exports = {
  validateEnvironment,
  performExtendedValidation,
  generateSecureEnv
};
