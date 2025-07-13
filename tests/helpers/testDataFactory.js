/**
 * Test Data Factory
 * Provides utilities for creating test data with realistic and varied values
 */

const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongoose').Types;

/**
 * Test Data Factory class for generating test entities
 */
class TestDataFactory {
  constructor() {
    this.counters = {
      users: 0,
      courses: 0,
      modules: 0,
      lessons: 0,
      conversations: 0,
      promptTemplates: 0,
      departments: 0
    };
  }

  /**
   * Reset all counters
   */
  resetCounters() {
    Object.keys(this.counters).forEach(key => {
      this.counters[key] = 0;
    });
  }

  /**
   * Generate a unique counter-based ID
   * @param {string} type - Entity type
   * @returns {number} Unique counter
   */
  getNextId(type) {
    return ++this.counters[type];
  }

  /**
   * Generate realistic test email
   * @param {string} prefix - Email prefix
   * @param {number} id - Unique identifier
   * @returns {string} Test email
   */
  generateEmail(prefix = 'user', id = null) {
    const uniqueId = id || this.getNextId('users');
    const domains = ['test.com', 'example.org', 'demo.edu', 'sample.net'];
    const domain = domains[uniqueId % domains.length];
    return `${prefix}${uniqueId}@${domain}`;
  }

  /**
   * Generate realistic names
   * @returns {Object} First and last names
   */
  generateNames() {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
      'Sam', 'Blake', 'Drew', 'Cameron', 'Sage', 'Rowan', 'River', 'Phoenix'
    ];
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
    ];
    
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
  }

  /**
   * Generate test departments
   * @returns {Array} List of departments
   */
  getDepartments() {
    return [
      'Engineering',
      'Marketing', 
      'Sales',
      'Support',
      'Operations',
      'Human Resources',
      'Finance',
      'Product',
      'Design',
      'Research'
    ];
  }

  /**
   * Create test user data
   * @param {Object} overrides - Custom properties to override defaults
   * @returns {Object} User test data
   */
  async createUserData(overrides = {}) {
    const id = this.getNextId('users');
    const names = this.generateNames();
    const departments = this.getDepartments();
    
    const defaultData = {
      email: this.generateEmail('user', id),
      password: 'TestPassword123!',
      firstName: names.firstName,
      lastName: names.lastName,
      department: departments[Math.floor(Math.random() * departments.length)],
      role: 'User',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userData = { ...defaultData, ...overrides };
    
    // Hash password if it's provided
    if (userData.password && !userData.password.startsWith('$2')) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    return userData;
  }

  /**
   * Create test admin user data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Admin user test data
   */
  async createAdminData(overrides = {}) {
    const names = this.generateNames();
    return await this.createUserData({
      email: this.generateEmail('admin'),
      firstName: names.firstName,
      lastName: names.lastName,
      role: 'Admin',
      department: 'Operations',
      ...overrides
    });
  }

  /**
   * Create test instructor user data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Instructor user test data
   */
  async createInstructorData(overrides = {}) {
    const names = this.generateNames();
    return await this.createUserData({
      email: this.generateEmail('instructor'),
      firstName: names.firstName,
      lastName: names.lastName,
      role: 'Instructor',
      department: 'Engineering',
      ...overrides
    });
  }

  /**
   * Create test course data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Course test data
   */
  createCourseData(overrides = {}) {
    const id = this.getNextId('courses');
    const topics = [
      'JavaScript Fundamentals',
      'React Development',
      'Node.js Backend',
      'Database Design',
      'API Development',
      'Testing Strategies',
      'DevOps Practices',
      'Security Essentials',
      'Performance Optimization',
      'Project Management'
    ];

    const topic = topics[id % topics.length];
    
    return {
      title: `${topic} - Course ${id}`,
      description: `Comprehensive course covering ${topic.toLowerCase()} with hands-on exercises and real-world examples.`,
      instructor: null, // Will be set to actual instructor ID in tests
      isPublished: Math.random() > 0.5,
      category: this.getCourseCategory(),
      tags: this.getCourseTags(),
      duration: Math.floor(Math.random() * 40) + 10, // 10-50 hours
      difficulty: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test module data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Module test data
   */
  createModuleData(overrides = {}) {
    const id = this.getNextId('modules');
    const moduleTypes = [
      'Introduction',
      'Basic Concepts',
      'Practical Examples',
      'Advanced Topics',
      'Best Practices',
      'Real-world Applications',
      'Troubleshooting',
      'Summary and Review'
    ];

    const moduleType = moduleTypes[id % moduleTypes.length];
    
    return {
      title: `Module ${id}: ${moduleType}`,
      description: `This module covers ${moduleType.toLowerCase()} with detailed explanations and exercises.`,
      courseId: null, // Will be set to actual course ID in tests
      order: id,
      estimatedDuration: Math.floor(Math.random() * 4) + 1, // 1-4 hours
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test lesson data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Lesson test data
   */
  createLessonData(overrides = {}) {
    const id = this.getNextId('lessons');
    const lessonTypes = [
      'Overview',
      'Setup and Configuration',
      'Core Concepts',
      'Hands-on Exercise',
      'Common Patterns',
      'Error Handling',
      'Testing Approach',
      'Deployment Guide'
    ];

    const lessonType = lessonTypes[id % lessonTypes.length];
    
    return {
      title: `Lesson ${id}: ${lessonType}`,
      content: this.generateLessonContent(lessonType),
      moduleId: null, // Will be set to actual module ID in tests
      order: id,
      estimatedDuration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      contentBlocks: this.generateContentBlocks(),
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test conversation data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Conversation test data
   */
  createConversationData(overrides = {}) {
    const id = this.getNextId('conversations');
    const topics = [
      'JavaScript Debugging Help',
      'React Component Design',
      'Database Query Optimization',
      'API Integration Issues',
      'Testing Strategy Discussion',
      'Code Review Session',
      'Project Planning Chat',
      'Learning Path Guidance'
    ];

    const topic = topics[id % topics.length];
    
    return {
      title: topic,
      participants: [], // Will be populated with actual user IDs
      messages: this.generateMessages(),
      isActive: Math.random() > 0.3,
      tags: this.getConversationTags(),
      courseId: null, // Optional course association
      lessonId: null, // Optional lesson association
      modelUsed: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test prompt template data
   * @param {Object} overrides - Custom properties
   * @returns {Object} Prompt template test data
   */
  createPromptTemplateData(overrides = {}) {
    const id = this.getNextId('promptTemplates');
    const templates = [
      {
        name: 'Code Review Assistant',
        description: 'Helps review code for best practices and potential issues',
        prompt: 'Please review the following code for:\n1. Best practices\n2. Potential bugs\n3. Performance improvements\n4. Security concerns\n\nCode:\n{{code}}'
      },
      {
        name: 'Learning Path Creator',
        description: 'Creates personalized learning paths for topics',
        prompt: 'Create a comprehensive learning path for {{topic}}. Include:\n1. Prerequisites\n2. Core concepts to learn\n3. Practical exercises\n4. Resources and references\n\nLearning style: {{style}}'
      },
      {
        name: 'Problem Solver',
        description: 'Helps break down and solve complex problems',
        prompt: 'Help me solve this problem step by step:\n\nProblem: {{problem}}\n\nPlease provide:\n1. Problem analysis\n2. Possible approaches\n3. Step-by-step solution\n4. Alternative methods'
      },
      {
        name: 'Meeting Summarizer',
        description: 'Summarizes meeting notes and action items',
        prompt: 'Summarize the following meeting notes:\n\n{{notes}}\n\nProvide:\n1. Key discussion points\n2. Decisions made\n3. Action items with owners\n4. Next steps'
      }
    ];

    const template = templates[id % templates.length];
    
    return {
      name: `${template.name} ${id}`,
      description: template.description,
      prompt: template.prompt,
      category: this.getPromptCategory(),
      tags: this.getPromptTags(),
      isPublic: Math.random() > 0.5,
      createdBy: null, // Will be set to actual user ID
      usageCount: Math.floor(Math.random() * 100),
      rating: Math.random() * 2 + 3, // 3-5 star rating
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate course categories
   * @returns {string} Course category
   */
  getCourseCategory() {
    const categories = [
      'Web Development',
      'Mobile Development',
      'Data Science',
      'DevOps',
      'Security',
      'Machine Learning',
      'Database',
      'Cloud Computing'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Generate course tags
   * @returns {Array} Course tags
   */
  getCourseTags() {
    const allTags = [
      'javascript', 'react', 'node.js', 'mongodb', 'api', 'testing',
      'beginner', 'intermediate', 'advanced', 'hands-on', 'theory',
      'frontend', 'backend', 'fullstack', 'mobile', 'web'
    ];
    const numTags = Math.floor(Math.random() * 4) + 2; // 2-5 tags
    return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
  }

  /**
   * Generate conversation tags
   * @returns {Array} Conversation tags
   */
  getConversationTags() {
    const allTags = [
      'help', 'debugging', 'review', 'planning', 'learning',
      'javascript', 'react', 'database', 'api', 'testing',
      'urgent', 'follow-up', 'resolved', 'ongoing'
    ];
    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags
    return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
  }

  /**
   * Generate prompt template categories
   * @returns {string} Prompt category
   */
  getPromptCategory() {
    const categories = [
      'Development',
      'Learning',
      'Problem Solving',
      'Code Review',
      'Planning',
      'Documentation',
      'Testing',
      'Analysis'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Generate prompt template tags
   * @returns {Array} Prompt tags
   */
  getPromptTags() {
    const allTags = [
      'coding', 'learning', 'review', 'analysis', 'planning',
      'beginner', 'advanced', 'quick', 'detailed', 'structured'
    ];
    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags
    return allTags.sort(() => 0.5 - Math.random()).slice(0, numTags);
  }

  /**
   * Generate lesson content
   * @param {string} lessonType - Type of lesson
   * @returns {string} Lesson content
   */
  generateLessonContent(lessonType) {
    return `# ${lessonType}

This lesson covers the essential concepts of ${lessonType.toLowerCase()}. 

## Learning Objectives
- Understand the core principles
- Apply practical techniques
- Identify common patterns
- Avoid common pitfalls

## Content Overview
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Key Takeaways
- Important concept 1
- Important concept 2
- Important concept 3

## Next Steps
Continue to the next lesson to build upon these concepts.`;
  }

  /**
   * Generate content blocks for lessons
   * @returns {Array} Content blocks
   */
  generateContentBlocks() {
    const blockTypes = ['text', 'code', 'video', 'interactive'];
    const numBlocks = Math.floor(Math.random() * 4) + 2; // 2-5 blocks
    
    return Array.from({ length: numBlocks }, (_, index) => {
      const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      
      switch (type) {
        case 'text':
          return {
            type: 'text',
            content: `This is text block ${index + 1} with educational content.`,
            order: index
          };
        case 'code':
          return {
            type: 'code',
            language: 'javascript',
            code: `// Example code block ${index + 1}\nconsole.log('Hello, World!');`,
            executable: Math.random() > 0.5,
            order: index
          };
        case 'video':
          return {
            type: 'video',
            url: `https://example.com/video${index + 1}`,
            duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
            order: index
          };
        case 'interactive':
          return {
            type: 'interactive',
            prompt: `Try this interactive exercise ${index + 1}`,
            expectedOutput: 'Expected result here',
            autoExecute: Math.random() > 0.7,
            order: index
          };
        default:
          return {
            type: 'text',
            content: `Default content block ${index + 1}`,
            order: index
          };
      }
    });
  }

  /**
   * Generate messages for conversations
   * @returns {Array} Messages
   */
  generateMessages() {
    const numMessages = Math.floor(Math.random() * 10) + 3; // 3-12 messages
    const messages = [];
    
    for (let i = 0; i < numMessages; i++) {
      const isUserMessage = i % 2 === 0;
      messages.push({
        content: isUserMessage 
          ? `User message ${i + 1}: This is a question or request for help.`
          : `AI response ${i + 1}: This is a helpful response from the AI assistant.`,
        sender: isUserMessage ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - (numMessages - i) * 60000), // Spaced 1 minute apart
        messageId: new ObjectId().toString()
      });
    }
    
    return messages;
  }

  /**
   * Create multiple users for testing
   * @param {number} count - Number of users to create
   * @param {Object} overrides - Common overrides for all users
   * @returns {Array} Array of user data
   */
  async createMultipleUsers(count = 5, overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUserData(overrides));
    }
    return users;
  }

  /**
   * Create a complete course structure (course + modules + lessons)
   * @param {Object} courseOverrides - Course overrides
   * @param {number} moduleCount - Number of modules
   * @param {number} lessonsPerModule - Number of lessons per module
   * @returns {Object} Complete course structure
   */
  createCourseStructure(courseOverrides = {}, moduleCount = 3, lessonsPerModule = 4) {
    const course = this.createCourseData(courseOverrides);
    const modules = [];
    
    for (let i = 0; i < moduleCount; i++) {
      const module = this.createModuleData({ order: i + 1 });
      const lessons = [];
      
      for (let j = 0; j < lessonsPerModule; j++) {
        lessons.push(this.createLessonData({ order: j + 1 }));
      }
      
      module.lessons = lessons;
      modules.push(module);
    }
    
    course.modules = modules;
    return course;
  }
}

// Export singleton instance
module.exports = new TestDataFactory();
