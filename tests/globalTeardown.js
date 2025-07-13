/**
 * Jest Global Teardown
 * Cleans up MongoDB Memory Server after all tests
 */

const { stopGlobalMongoServer } = require('./mongoMemoryServer');

module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  // Stop global MongoDB Memory Server
  await stopGlobalMongoServer();
  
  console.log('✅ Global test environment cleanup complete');
};
