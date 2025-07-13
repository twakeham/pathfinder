const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { getDatabaseConnection } = require('./database');

/**
 * Database seeding script for initial admin user and essential data
 * Creates the foundational admin account and system data needed to bootstrap the application
 */

class DatabaseSeeder {
  constructor() {
    this.defaultAdminCredentials = {
      email: process.env.ADMIN_EMAIL || 'admin@pathfinder.local',
      password: process.env.ADMIN_PASSWORD || 'PathfinderAdmin2025!',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'Admin',
      isApproved: true,
      department: null
    };

    this.defaultDepartments = [
      { name: 'Engineering', description: 'Software engineering and development teams' },
      { name: 'Marketing', description: 'Marketing and communications teams' },
      { name: 'Sales', description: 'Sales and business development teams' },
      { name: 'Support', description: 'Customer support and success teams' },
      { name: 'Operations', description: 'Operations and administrative teams' }
    ];

    this.samplePromptTemplates = [
      {
        title: 'Code Review Assistant',
        description: 'Helps review code for best practices and potential issues',
        content: 'Please review the following code for:\n1. Best practices\n2. Potential bugs\n3. Performance optimizations\n4. Security concerns\n\nCode:\n```{language}\n{code}\n```',
        category: 'Development',
        tags: ['code-review', 'programming', 'best-practices'],
        isPublic: true,
        variables: ['language', 'code']
      },
      {
        title: 'Learning Path Creator',
        description: 'Creates personalized learning paths for specific topics',
        content: 'Create a comprehensive learning path for {topic} suitable for {level} level learners. Include:\n1. Prerequisites\n2. Core concepts to master\n3. Recommended resources\n4. Practice exercises\n5. Assessment criteria\n\nFocus on practical application and hands-on learning.',
        category: 'Education',
        tags: ['learning', 'curriculum', 'education'],
        isPublic: true,
        variables: ['topic', 'level']
      },
      {
        title: 'Problem Solver',
        description: 'Breaks down complex problems into manageable steps',
        content: 'Help me solve this problem step by step:\n\nProblem: {problem}\n\nPlease:\n1. Break down the problem into smaller components\n2. Identify key constraints and requirements\n3. Suggest multiple solution approaches\n4. Recommend the best approach with reasoning\n5. Outline implementation steps',
        category: 'Problem Solving',
        tags: ['analysis', 'problem-solving', 'strategy'],
        isPublic: true,
        variables: ['problem']
      },
      {
        title: 'Meeting Summarizer',
        description: 'Summarizes meeting notes and extracts action items',
        content: 'Please analyze these meeting notes and provide:\n\n1. **Key Discussion Points**: Main topics covered\n2. **Decisions Made**: Important decisions and rationale\n3. **Action Items**: Tasks assigned with owners and deadlines\n4. **Follow-up Items**: Items requiring future discussion\n5. **Next Steps**: Immediate priorities\n\nMeeting Notes:\n{notes}',
        category: 'Business',
        tags: ['meetings', 'summarization', 'productivity'],
        isPublic: true,
        variables: ['notes']
      }
    ];
  }

  /**
   * Seed the database with initial admin user and essential data
   * @param {Object} options - Seeding options
   * @param {boolean} options.force - Force recreation of existing data
   * @param {boolean} options.skipAdmin - Skip admin user creation
   * @param {boolean} options.skipDepartments - Skip department creation
   * @param {boolean} options.skipTemplates - Skip template creation
   * @returns {Promise<Object>} Seeding results
   */
  async seed(options = {}) {
    const {
      force = false,
      skipAdmin = false,
      skipDepartments = false,
      skipTemplates = false
    } = options;

    try {
      console.log('Starting database seeding...');
      
      const dbConnection = getDatabaseConnection();
      if (!dbConnection.isConnectionReady()) {
        throw new Error('Database connection is not ready. Please ensure the database is connected first.');
      }

      const results = {
        admin: null,
        departments: [],
        templates: [],
        summary: {}
      };

      // Create admin user
      if (!skipAdmin) {
        results.admin = await this.createAdminUser(force);
      }

      // Create default departments
      if (!skipDepartments) {
        results.departments = await this.createDepartments(force);
      }

      // Create sample prompt templates
      if (!skipTemplates) {
        results.templates = await this.createPromptTemplates(force);
      }

      // Generate summary
      results.summary = {
        adminCreated: !!results.admin,
        departmentsCreated: results.departments.length,
        templatesCreated: results.templates.length,
        timestamp: new Date().toISOString()
      };

      console.log('Database seeding completed successfully');
      console.log('Summary:', results.summary);
      
      return results;
      
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Create the initial admin user
   * @param {boolean} force - Force recreation if user exists
   * @returns {Promise<Object|null>} Created admin user or null
   */
  async createAdminUser(force = false) {
    try {
      console.log('Creating admin user...');

      // Check if admin user already exists
      const existingAdmin = await mongoose.connection.db
        .collection('users')
        .findOne({ email: this.defaultAdminCredentials.email });

      if (existingAdmin && !force) {
        console.log('✓ Admin user already exists:', this.defaultAdminCredentials.email);
        return null;
      }

      if (existingAdmin && force) {
        console.log('! Removing existing admin user for recreation');
        await mongoose.connection.db
          .collection('users')
          .deleteOne({ email: this.defaultAdminCredentials.email });
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(this.defaultAdminCredentials.password, saltRounds);

      // Create admin user document
      const adminUser = {
        ...this.defaultAdminCredentials,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert admin user
      const result = await mongoose.connection.db
        .collection('users')
        .insertOne(adminUser);

      console.log('✓ Admin user created successfully');
      console.log(`  Email: ${this.defaultAdminCredentials.email}`);
      console.log(`  Password: ${this.defaultAdminCredentials.password}`);
      console.log('  ⚠️  Please change the default password after first login!');

      return {
        _id: result.insertedId,
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName
      };

    } catch (error) {
      console.error('✗ Failed to create admin user:', error.message);
      throw error;
    }
  }

  /**
   * Create default departments
   * @param {boolean} force - Force recreation if departments exist
   * @returns {Promise<Array>} Created departments
   */
  async createDepartments(force = false) {
    try {
      console.log('Creating default departments...');

      const createdDepartments = [];

      for (const dept of this.defaultDepartments) {
        // Check if department already exists
        const existing = await mongoose.connection.db
          .collection('departments')
          .findOne({ name: dept.name });

        if (existing && !force) {
          console.log(`✓ Department already exists: ${dept.name}`);
          continue;
        }

        if (existing && force) {
          console.log(`! Updating existing department: ${dept.name}`);
          await mongoose.connection.db
            .collection('departments')
            .updateOne(
              { name: dept.name },
              { 
                $set: { 
                  ...dept,
                  updatedAt: new Date()
                }
              }
            );
          createdDepartments.push(dept);
          continue;
        }

        // Create new department
        const departmentDoc = {
          ...dept,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await mongoose.connection.db
          .collection('departments')
          .insertOne(departmentDoc);

        console.log(`✓ Created department: ${dept.name}`);
        createdDepartments.push(dept);
      }

      console.log(`✓ Departments processing completed (${createdDepartments.length} processed)`);
      return createdDepartments;

    } catch (error) {
      console.error('✗ Failed to create departments:', error.message);
      throw error;
    }
  }

  /**
   * Create sample prompt templates
   * @param {boolean} force - Force recreation if templates exist
   * @returns {Promise<Array>} Created templates
   */
  async createPromptTemplates(force = false) {
    try {
      console.log('Creating sample prompt templates...');

      // Get admin user ID for template ownership
      const adminUser = await mongoose.connection.db
        .collection('users')
        .findOne({ email: this.defaultAdminCredentials.email });

      if (!adminUser) {
        console.log('! Admin user not found, skipping template creation');
        return [];
      }

      const createdTemplates = [];

      for (const template of this.samplePromptTemplates) {
        // Check if template already exists
        const existing = await mongoose.connection.db
          .collection('prompttemplates')
          .findOne({ title: template.title });

        if (existing && !force) {
          console.log(`✓ Template already exists: ${template.title}`);
          continue;
        }

        if (existing && force) {
          console.log(`! Updating existing template: ${template.title}`);
          await mongoose.connection.db
            .collection('prompttemplates')
            .updateOne(
              { title: template.title },
              {
                $set: {
                  ...template,
                  createdBy: adminUser._id,
                  updatedAt: new Date()
                }
              }
            );
          createdTemplates.push(template);
          continue;
        }

        // Create new template
        const templateDoc = {
          ...template,
          createdBy: adminUser._id,
          usageCount: 0,
          rating: 0,
          ratingCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await mongoose.connection.db
          .collection('prompttemplates')
          .insertOne(templateDoc);

        console.log(`✓ Created template: ${template.title}`);
        createdTemplates.push(template);
      }

      console.log(`✓ Templates processing completed (${createdTemplates.length} processed)`);
      return createdTemplates;

    } catch (error) {
      console.error('✗ Failed to create prompt templates:', error.message);
      throw error;
    }
  }

  /**
   * Clean up seeded data (for testing)
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      console.log('Cleaning up seeded data...');

      const collections = [
        { name: 'users', filter: { email: this.defaultAdminCredentials.email } },
        { name: 'departments', filter: { name: { $in: this.defaultDepartments.map(d => d.name) } } },
        { name: 'prompttemplates', filter: { title: { $in: this.samplePromptTemplates.map(t => t.title) } } }
      ];

      for (const { name, filter } of collections) {
        const result = await mongoose.connection.db
          .collection(name)
          .deleteMany(filter);
        
        console.log(`✓ Cleaned up ${result.deletedCount} documents from ${name}`);
      }

      console.log('Cleanup completed');

    } catch (error) {
      console.error('✗ Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get seeding status
   * @returns {Promise<Object>} Current seeding status
   */
  async getStatus() {
    try {
      const status = {
        adminExists: false,
        departmentCount: 0,
        templateCount: 0,
        timestamp: new Date().toISOString()
      };

      // Check admin user
      const adminUser = await mongoose.connection.db
        .collection('users')
        .findOne({ email: this.defaultAdminCredentials.email });
      status.adminExists = !!adminUser;

      // Count departments
      status.departmentCount = await mongoose.connection.db
        .collection('departments')
        .countDocuments({ name: { $in: this.defaultDepartments.map(d => d.name) } });

      // Count templates
      status.templateCount = await mongoose.connection.db
        .collection('prompttemplates')
        .countDocuments({ title: { $in: this.samplePromptTemplates.map(t => t.title) } });

      return status;

    } catch (error) {
      console.error('✗ Failed to get seeding status:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const databaseSeeder = new DatabaseSeeder();

/**
 * Seed database with initial admin user and essential data
 * @param {Object} options - Seeding options
 * @returns {Promise<Object>}
 */
async function seedDatabase(options = {}) {
  return databaseSeeder.seed(options);
}

/**
 * Create only the admin user
 * @param {boolean} force - Force recreation if user exists
 * @returns {Promise<Object|null>}
 */
async function createAdminUser(force = false) {
  return databaseSeeder.createAdminUser(force);
}

/**
 * Clean up seeded data
 * @returns {Promise<void>}
 */
async function cleanupSeededData() {
  return databaseSeeder.cleanup();
}

/**
 * Get seeding status
 * @returns {Promise<Object>}
 */
async function getSeedingStatus() {
  return databaseSeeder.getStatus();
}

module.exports = {
  seedDatabase,
  createAdminUser,
  cleanupSeededData,
  getSeedingStatus,
  DatabaseSeeder
};
