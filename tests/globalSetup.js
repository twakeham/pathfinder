/**
 * Jest Global Setup
 * Sets up MongoDB Memory Server once for all tests
 */

const { getGlobalMongoServer } = require('./mongoMemoryServer');

module.exports = async () => {
  console.log('🚀 Setting up global test environment...');
  
  // Start global MongoDB Memory Server
  const { server, uri } = await getGlobalMongoServer();
  
  // Store the URI in global scope for other tests to use
  global.__MONGO_URI__ = uri;
  global.__MONGO_SERVER__ = server;
  
  console.log('✅ Global test environment ready');
};
