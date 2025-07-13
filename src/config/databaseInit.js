const mongoose = require('mongoose');
const { getDatabaseConnection } = require('./database');

/**
 * Database initialization script
 * Sets up collections, indexes, and initial database structure
 */

class DatabaseInitializer {
  constructor() {
    this.collections = [
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
    
    this.indexes = this.getIndexDefinitions();
  }

  /**
   * Initialize the database with collections and indexes
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Starting database initialization...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready. Please ensure the database is connected first.');
      }

      const db = mongoose.connection.db;
      
      // Create collections if they don't exist
      await this.createCollections(db);
      
      // Create indexes for performance and uniqueness constraints
      await this.createIndexes(db);
      
      // Set up collection validators (schema validation at DB level)
      await this.setupValidators(db);
      
      console.log('Database initialization completed successfully');
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create collections if they don't exist
   * @param {Object} db - MongoDB database instance
   * @returns {Promise<void>}
   */
  async createCollections(db) {
    console.log('Creating collections...');
    
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);
    
    for (const collectionName of this.collections) {
      if (!existingNames.includes(collectionName)) {
        try {
          await db.createCollection(collectionName);
          console.log(`✓ Created collection: ${collectionName}`);
        } catch (error) {
          if (error.code !== 48) { // Collection already exists
            console.error(`✗ Failed to create collection ${collectionName}:`, error.message);
            throw error;
          }
        }
      } else {
        console.log(`✓ Collection already exists: ${collectionName}`);
      }
    }
  }

  /**
   * Create database indexes for performance and constraints
   * @param {Object} db - MongoDB database instance
   * @returns {Promise<void>}
   */
  async createIndexes(db) {
    console.log('Creating database indexes...');
    
    for (const [collectionName, indexes] of Object.entries(this.indexes)) {
      try {
        const collection = db.collection(collectionName);
        
        for (const indexSpec of indexes) {
          try {
            await collection.createIndex(indexSpec.keys, indexSpec.options);
            console.log(`✓ Created index on ${collectionName}:`, Object.keys(indexSpec.keys).join(', '));
          } catch (error) {
            // Index might already exist, log but don't fail
            if (error.code === 85) { // IndexOptionsConflict
              console.log(`! Index already exists on ${collectionName}:`, Object.keys(indexSpec.keys).join(', '));
            } else {
              console.error(`✗ Failed to create index on ${collectionName}:`, error.message);
              throw error;
            }
          }
        }
      } catch (error) {
        console.error(`Error creating indexes for ${collectionName}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Set up collection-level validators
   * @param {Object} db - MongoDB database instance
   * @returns {Promise<void>}
   */
  async setupValidators(db) {
    console.log('Setting up collection validators...');
    
    // Note: Schema validation will be primarily handled by Mongoose models
    // This sets up basic database-level constraints
    
    const validators = {
      users: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "password", "role"],
          properties: {
            email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
            role: { enum: ["Admin", "Instructor", "User"] }
          }
        }
      },
      courses: {
        $jsonSchema: {
          bsonType: "object", 
          required: ["title", "instructor"],
          properties: {
            title: { bsonType: "string", minLength: 1 },
            isPublished: { bsonType: "bool" }
          }
        }
      }
    };

    for (const [collectionName, validator] of Object.entries(validators)) {
      try {
        await db.command({
          collMod: collectionName,
          validator: validator,
          validationLevel: "moderate", // Allow updates that don't modify validated fields
          validationAction: "warn" // Log validation failures but don't block operations
        });
        console.log(`✓ Set up validator for collection: ${collectionName}`);
      } catch (error) {
        console.error(`✗ Failed to set up validator for ${collectionName}:`, error.message);
        // Don't throw here - validators are optional
      }
    }
  }

  /**
   * Get index definitions for all collections
   * @returns {Object} Index definitions by collection
   */
  getIndexDefinitions() {
    return {
      users: [
        {
          keys: { email: 1 },
          options: { unique: true, name: 'email_unique' }
        },
        {
          keys: { role: 1 },
          options: { name: 'role_index' }
        },
        {
          keys: { department: 1 },
          options: { name: 'department_index', sparse: true }
        },
        {
          keys: { createdAt: 1 },
          options: { name: 'created_at_index' }
        },
        {
          keys: { isApproved: 1, role: 1 },
          options: { name: 'approval_role_compound' }
        }
      ],
      
      courses: [
        {
          keys: { instructor: 1 },
          options: { name: 'instructor_index' }
        },
        {
          keys: { isPublished: 1 },
          options: { name: 'published_index' }
        },
        {
          keys: { createdAt: 1 },
          options: { name: 'created_at_index' }
        },
        {
          keys: { title: 'text', description: 'text' },
          options: { name: 'course_text_search' }
        }
      ],
      
      modules: [
        {
          keys: { courseId: 1, order: 1 },
          options: { name: 'course_order_index' }
        },
        {
          keys: { courseId: 1 },
          options: { name: 'course_id_index' }
        }
      ],
      
      lessons: [
        {
          keys: { moduleId: 1, order: 1 },
          options: { name: 'module_order_index' }
        },
        {
          keys: { moduleId: 1 },
          options: { name: 'module_id_index' }
        },
        {
          keys: { title: 'text' },
          options: { name: 'lesson_text_search' }
        }
      ],
      
      conversations: [
        {
          keys: { userId: 1, createdAt: -1 },
          options: { name: 'user_recent_conversations' }
        },
        {
          keys: { lessonId: 1 },
          options: { name: 'lesson_conversations', sparse: true }
        },
        {
          keys: { tags: 1 },
          options: { name: 'conversation_tags', sparse: true }
        },
        {
          keys: { modelUsed: 1 },
          options: { name: 'model_usage_index' }
        },
        {
          keys: { createdAt: 1 },
          options: { name: 'created_at_index', expireAfterSeconds: 31536000 } // 1 year TTL
        }
      ],
      
      prompttemplates: [
        {
          keys: { category: 1 },
          options: { name: 'category_index' }
        },
        {
          keys: { isPublic: 1 },
          options: { name: 'public_templates' }
        },
        {
          keys: { createdBy: 1 },
          options: { name: 'creator_index' }
        },
        {
          keys: { title: 'text', description: 'text', tags: 'text' },
          options: { name: 'template_text_search' }
        },
        {
          keys: { usageCount: -1 },
          options: { name: 'popular_templates' }
        }
      ],
      
      userprogress: [
        {
          keys: { userId: 1, courseId: 1 },
          options: { unique: true, name: 'user_course_progress' }
        },
        {
          keys: { userId: 1, lessonId: 1 },
          options: { unique: true, name: 'user_lesson_progress' }
        },
        {
          keys: { completedAt: 1 },
          options: { name: 'completion_date_index', sparse: true }
        }
      ],
      
      analytics: [
        {
          keys: { userId: 1, eventType: 1, timestamp: -1 },
          options: { name: 'user_events_timeline' }
        },
        {
          keys: { eventType: 1, timestamp: -1 },
          options: { name: 'event_type_timeline' }
        },
        {
          keys: { timestamp: 1 },
          options: { name: 'timestamp_index', expireAfterSeconds: 7776000 } // 90 days TTL
        }
      ],
      
      invitations: [
        {
          keys: { email: 1 },
          options: { name: 'invitation_email_index' }
        },
        {
          keys: { token: 1 },
          options: { unique: true, name: 'invitation_token_unique' }
        },
        {
          keys: { expiresAt: 1 },
          options: { name: 'invitation_expiry', expireAfterSeconds: 0 }
        }
      ],
      
      departments: [
        {
          keys: { name: 1 },
          options: { unique: true, name: 'department_name_unique' }
        }
      ]
    };
  }

  /**
   * Drop all collections (useful for testing)
   * @returns {Promise<void>}
   */
  async dropAllCollections() {
    console.log('Dropping all collections...');
    
    const dbConnection = getDatabaseConnection();
    if (!dbConnection.isConnectionReady()) {
      throw new Error('Database connection is not ready');
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        await db.collection(collection.name).drop();
        console.log(`✓ Dropped collection: ${collection.name}`);
      } catch (error) {
        console.error(`✗ Failed to drop collection ${collection.name}:`, error.message);
      }
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getDatabaseStats() {
    const dbConnection = getDatabaseConnection();
    if (!dbConnection.isConnectionReady()) {
      throw new Error('Database connection is not ready');
    }

    const db = mongoose.connection.db;
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();
    
    const collectionStats = {};
    for (const collection of collections) {
      try {
        const collStats = await db.collection(collection.name).stats();
        collectionStats[collection.name] = {
          count: collStats.count,
          size: collStats.size,
          avgObjSize: collStats.avgObjSize,
          indexes: collStats.nindexes
        };
      } catch (error) {
        collectionStats[collection.name] = { error: error.message };
      }
    }

    return {
      database: {
        name: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      },
      collections: collectionStats
    };
  }
}

// Create singleton instance
const databaseInitializer = new DatabaseInitializer();

/**
 * Initialize database collections and indexes
 * @returns {Promise<void>}
 */
async function initializeCollections() {
  return databaseInitializer.initialize();
}

/**
 * Drop all collections (for testing)
 * @returns {Promise<void>}
 */
async function dropCollections() {
  return databaseInitializer.dropAllCollections();
}

/**
 * Get database statistics
 * @returns {Promise<Object>}
 */
async function getDatabaseStats() {
  return databaseInitializer.getDatabaseStats();
}

module.exports = {
  initializeCollections,
  dropCollections,
  getDatabaseStats,
  DatabaseInitializer
};
