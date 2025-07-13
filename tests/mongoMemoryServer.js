/**
 * MongoDB Memory Server Global Configuration
 * Configures MongoDB Memory Server to cache binaries and reuse instances
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Configure global settings for MongoDB Memory Server
const MONGODB_BINARY_CACHE_DIR = path.join(process.cwd(), 'tmp', 'mongodb-memory-server-cache');

// Ensure cache directory exists
if (!fs.existsSync(MONGODB_BINARY_CACHE_DIR)) {
  fs.mkdirSync(MONGODB_BINARY_CACHE_DIR, { recursive: true });
}

// Set global configuration to cache binaries and prevent downloads
process.env.MONGOMS_DOWNLOAD_DIR = MONGODB_BINARY_CACHE_DIR;
process.env.MONGOMS_PREFER_GLOBAL_PATH = '1';
process.env.MONGOMS_DISABLE_POSTINSTALL = '1';
process.env.MONGOMS_VERSION = '5.0.26'; // Use LTS version with better compatibility
process.env.MONGOMS_DOWNLOAD_MIRROR = 'https://fastdl.mongodb.org/';
process.env.MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER = '1';
process.env.MONGOMS_SKIP_MD5 = '1';
process.env.MONGOMS_CHECK_MD5 = '0';

// Global MongoDB instance for all tests
let globalMongoServer = null;
let globalMongoUri = null;

/**
 * Get or create global MongoDB Memory Server instance
 * @returns {Promise<{server: MongoMemoryServer, uri: string}>}
 */
async function getGlobalMongoServer() {
  if (globalMongoServer && globalMongoUri) {
    console.log(`Reusing existing MongoDB Memory Server at: ${globalMongoUri}`);
    return { server: globalMongoServer, uri: globalMongoUri };
  }

  console.log('Starting global MongoDB Memory Server...');
  
  globalMongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'pathfinder_test',
      storageEngine: 'ephemeralForTest', // Use in-memory storage for tests
    },
    binary: {
      version: '5.0.26', // Use LTS version
      downloadDir: MONGODB_BINARY_CACHE_DIR,
      skipMD5: true,
      checkMD5: false,
    },
    autoStart: true,
  });

  globalMongoUri = globalMongoServer.getUri();
  
  console.log(`Global MongoDB Memory Server started at: ${globalMongoUri}`);
  
  return { server: globalMongoServer, uri: globalMongoUri };
}

/**
 * Stop global MongoDB Memory Server
 * @returns {Promise<void>}
 */
async function stopGlobalMongoServer() {
  if (globalMongoServer) {
    console.log('Stopping global MongoDB Memory Server...');
    await globalMongoServer.stop();
    globalMongoServer = null;
    globalMongoUri = null;
  }
}

/**
 * Reset global MongoDB database (clear all collections)
 * @returns {Promise<void>}
 */
async function resetGlobalMongoDatabase() {
  if (globalMongoServer) {
    const mongoose = require('mongoose');
    const collections = mongoose.connection.collections;
    
    const clearPromises = Object.keys(collections).map(async (collectionName) => {
      const collection = collections[collectionName];
      await collection.deleteMany({});
    });
    
    await Promise.all(clearPromises);
  }
}

module.exports = {
  getGlobalMongoServer,
  stopGlobalMongoServer,
  resetGlobalMongoDatabase,
  MONGODB_BINARY_CACHE_DIR
};
