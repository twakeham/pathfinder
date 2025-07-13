const mongoose = require('mongoose');
const { getDatabaseConnection } = require('./database');
const { initializeCollections, dropCollections } = require('./databaseInit');
const { seedDatabase, cleanupSeededData } = require('./databaseSeed');

/**
 * Database cleanup and reset utilities for testing and development
 * Provides safe methods to clean, reset, and restore database state
 */

class DatabaseTestUtils {
  constructor() {
    this.backupCollections = [
      'users',
      'courses', 
      'modules',
      'lessons',
      'conversations',
      'prompttemplates',
      'userprogress',
      'analytics',
      'invitations',
      'departments'
    ];
  }

  /**
   * Complete database reset - drops all collections and reinitializes
   * @param {Object} options - Reset options
   * @param {boolean} options.seedAfterReset - Whether to seed with initial data
   * @param {boolean} options.preserveIndexes - Whether to preserve existing indexes
   * @returns {Promise<Object>} Reset results
   */
  async resetDatabase(options = {}) {
    const { seedAfterReset = true, preserveIndexes = true } = options;
    
    try {
      console.log('🔄 Starting complete database reset...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const results = {
        dropped: false,
        initialized: false,
        seeded: false,
        timestamp: new Date().toISOString()
      };

      // Step 1: Drop all collections
      console.log('📦 Dropping all collections...');
      await dropCollections();
      results.dropped = true;
      console.log('✓ All collections dropped');

      // Step 2: Reinitialize collections and indexes
      console.log('🏗️  Reinitializing database structure...');
      await initializeCollections();
      results.initialized = true;
      console.log('✓ Database structure reinitialized');

      // Step 3: Seed with initial data if requested
      if (seedAfterReset) {
        console.log('🌱 Seeding with initial data...');
        await seedDatabase();
        results.seeded = true;
        console.log('✓ Initial data seeded');
      }

      console.log('🎉 Database reset completed successfully');
      return results;

    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Clean specific collections while preserving structure
   * @param {Array<string>} collections - Collections to clean (default: all)
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanCollections(collections = null) {
    try {
      console.log('🧹 Starting collection cleanup...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const targetCollections = collections || this.backupCollections;
      const results = {
        cleaned: [],
        errors: [],
        timestamp: new Date().toISOString()
      };

      for (const collectionName of targetCollections) {
        try {
          const collection = db.collection(collectionName);
          const deleteResult = await collection.deleteMany({});
          
          console.log(`✓ Cleaned ${collectionName}: ${deleteResult.deletedCount} documents removed`);
          results.cleaned.push({
            collection: collectionName,
            documentsRemoved: deleteResult.deletedCount
          });
          
        } catch (error) {
          console.error(`✗ Failed to clean ${collectionName}:`, error.message);
          results.errors.push({
            collection: collectionName,
            error: error.message
          });
        }
      }

      console.log(`🎯 Collection cleanup completed: ${results.cleaned.length} cleaned, ${results.errors.length} errors`);
      return results;

    } catch (error) {
      console.error('❌ Collection cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Create a backup of specific collections
   * @param {Array<string>} collections - Collections to backup
   * @param {string} backupName - Name for the backup
   * @returns {Promise<Object>} Backup results
   */
  async createBackup(collections = null, backupName = null) {
    try {
      const targetCollections = collections || this.backupCollections;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = backupName || `backup_${timestamp}`;
      
      console.log(`💾 Creating backup: ${name}...`);
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const backup = {
        name,
        timestamp,
        collections: {}
      };

      for (const collectionName of targetCollections) {
        try {
          const collection = db.collection(collectionName);
          const documents = await collection.find({}).toArray();
          
          backup.collections[collectionName] = documents;
          console.log(`✓ Backed up ${collectionName}: ${documents.length} documents`);
          
        } catch (error) {
          console.error(`✗ Failed to backup ${collectionName}:`, error.message);
          backup.collections[collectionName] = { error: error.message };
        }
      }

      // Store backup in a special collection
      await db.collection('_backups').insertOne(backup);
      
      console.log(`💾 Backup created successfully: ${name}`);
      return {
        name,
        timestamp,
        collectionsBackedUp: Object.keys(backup.collections).length
      };

    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Restore from a backup
   * @param {string} backupName - Name of the backup to restore
   * @param {boolean} cleanBeforeRestore - Whether to clean collections before restore
   * @returns {Promise<Object>} Restore results
   */
  async restoreBackup(backupName, cleanBeforeRestore = true) {
    try {
      console.log(`📥 Restoring backup: ${backupName}...`);
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      
      // Find the backup
      const backup = await db.collection('_backups').findOne({ name: backupName });
      if (!backup) {
        throw new Error(`Backup not found: ${backupName}`);
      }

      const results = {
        restored: [],
        errors: [],
        timestamp: new Date().toISOString()
      };

      // Clean collections if requested
      if (cleanBeforeRestore) {
        console.log('🧹 Cleaning collections before restore...');
        await this.cleanCollections(Object.keys(backup.collections));
      }

      // Restore each collection
      for (const [collectionName, documents] of Object.entries(backup.collections)) {
        try {
          if (documents.error) {
            console.log(`⚠️  Skipping ${collectionName}: backup contained error`);
            continue;
          }

          if (Array.isArray(documents) && documents.length > 0) {
            const collection = db.collection(collectionName);
            const insertResult = await collection.insertMany(documents);
            
            console.log(`✓ Restored ${collectionName}: ${insertResult.insertedCount} documents`);
            results.restored.push({
              collection: collectionName,
              documentsRestored: insertResult.insertedCount
            });
          } else {
            console.log(`ℹ️  Skipping ${collectionName}: no documents to restore`);
          }
          
        } catch (error) {
          console.error(`✗ Failed to restore ${collectionName}:`, error.message);
          results.errors.push({
            collection: collectionName,
            error: error.message
          });
        }
      }

      console.log(`📥 Backup restore completed: ${results.restored.length} restored, ${results.errors.length} errors`);
      return results;

    } catch (error) {
      console.error('❌ Backup restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   * @returns {Promise<Array>} List of backups
   */
  async listBackups() {
    try {
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const backups = await db.collection('_backups')
        .find({}, { projection: { name: 1, timestamp: 1, 'collections': 1 } })
        .sort({ timestamp: -1 })
        .toArray();

      return backups.map(backup => ({
        name: backup.name,
        timestamp: backup.timestamp,
        collectionsCount: Object.keys(backup.collections || {}).length
      }));

    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Delete a backup
   * @param {string} backupName - Name of backup to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteBackup(backupName) {
    try {
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const result = await db.collection('_backups').deleteOne({ name: backupName });
      
      if (result.deletedCount > 0) {
        console.log(`✓ Backup deleted: ${backupName}`);
        return true;
      } else {
        console.log(`⚠️  Backup not found: ${backupName}`);
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Generate test data for development
   * @param {Object} options - Test data generation options
   * @returns {Promise<Object>} Generated data summary
   */
  async generateTestData(options = {}) {
    const {
      userCount = 10,
      courseCount = 3,
      conversationCount = 20
    } = options;

    try {
      console.log('🧪 Generating test data...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const results = {
        users: 0,
        courses: 0,
        conversations: 0,
        timestamp: new Date().toISOString()
      };

      // Generate test users
      const testUsers = [];
      for (let i = 1; i <= userCount; i++) {
        testUsers.push({
          email: `testuser${i}@pathfinder.local`,
          password: '$2a$12$LKx5zTq8TJ/kLgFvJZZJ8.Q5YzGzF6V6Z8KzF6V6Z8KzF6V6Z8Kz', // "password123"
          firstName: `Test`,
          lastName: `User ${i}`,
          role: i <= 2 ? 'Instructor' : 'User',
          isApproved: true,
          department: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (testUsers.length > 0) {
        await db.collection('users').insertMany(testUsers);
        results.users = testUsers.length;
        console.log(`✓ Generated ${testUsers.length} test users`);
      }

      console.log(`🧪 Test data generation completed`);
      return results;

    } catch (error) {
      console.error('❌ Test data generation failed:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupTestData() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready');
      }

      const db = mongoose.connection.db;
      const results = {
        usersRemoved: 0,
        conversationsRemoved: 0,
        timestamp: new Date().toISOString()
      };

      // Remove test users
      const userResult = await db.collection('users').deleteMany({
        email: { $regex: /^testuser\d+@pathfinder\.local$/ }
      });
      results.usersRemoved = userResult.deletedCount;

      // Remove test conversations
      const conversationResult = await db.collection('conversations').deleteMany({
        title: { $regex: /^Test Conversation/ }
      });
      results.conversationsRemoved = conversationResult.deletedCount;

      console.log(`🧹 Test data cleanup completed`);
      return results;

    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseTestUtils = new DatabaseTestUtils();

/**
 * Reset database completely
 * @param {Object} options - Reset options
 * @returns {Promise<Object>}
 */
async function resetDatabase(options = {}) {
  return databaseTestUtils.resetDatabase(options);
}

/**
 * Clean specific collections
 * @param {Array<string>} collections - Collections to clean
 * @returns {Promise<Object>}
 */
async function cleanCollections(collections = null) {
  return databaseTestUtils.cleanCollections(collections);
}

/**
 * Create backup
 * @param {Array<string>} collections - Collections to backup
 * @param {string} backupName - Backup name
 * @returns {Promise<Object>}
 */
async function createBackup(collections = null, backupName = null) {
  return databaseTestUtils.createBackup(collections, backupName);
}

/**
 * Restore backup
 * @param {string} backupName - Backup to restore
 * @param {boolean} cleanBeforeRestore - Clean before restore
 * @returns {Promise<Object>}
 */
async function restoreBackup(backupName, cleanBeforeRestore = true) {
  return databaseTestUtils.restoreBackup(backupName, cleanBeforeRestore);
}

/**
 * Generate test data
 * @param {Object} options - Generation options
 * @returns {Promise<Object>}
 */
async function generateTestData(options = {}) {
  return databaseTestUtils.generateTestData(options);
}

/**
 * Clean up test data
 * @returns {Promise<Object>}
 */
async function cleanupTestData() {
  return databaseTestUtils.cleanupTestData();
}

module.exports = {
  resetDatabase,
  cleanCollections,
  createBackup,
  restoreBackup,
  generateTestData,
  cleanupTestData,
  listBackups: () => databaseTestUtils.listBackups(),
  deleteBackup: (name) => databaseTestUtils.deleteBackup(name),
  DatabaseTestUtils
};
