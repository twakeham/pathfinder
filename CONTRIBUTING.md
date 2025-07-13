# Contributing to Pathfinder

We love your input! We want to make contributing to Pathfinder as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Git

### Setup Steps

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/pathfinder.git
   cd pathfinder
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local MongoDB URI
   ```

4. **Database Setup**
   ```bash
   npm run db:init
   npm run db:seed
   ```

5. **Verify Setup**
   ```bash
   npm run deploy:health
   npm test
   ```

## Development Workflow

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development Cycle**
   ```bash
   # Start with fresh test data
   npm run pathfinder -- test reset
   
   # Generate test data for development
   npm run pathfinder -- test generate --users 5
   
   # Start development server
   npm run deploy:start --dev
   
   # In another terminal, monitor logs
   npm run logs:follow
   ```

3. **Testing**
   ```bash
   # Run tests
   npm test
   
   # Test CLI functionality
   npm run pathfinder examples
   
   # Clean up test data
   npm run pathfinder -- test clean
   ```

4. **Before Committing**
   ```bash
   # Lint code
   npm run lint:fix
   
   # Run full test suite
   npm test
   
   # Health check
   npm run deploy:health
   ```

### CLI Development

When adding new CLI commands:

1. **Add Command Structure**
   ```javascript
   // In scripts/cli.js
   const newCommand = program
     .command('new-feature')
     .description('New feature description');
   
   newCommand
     .command('action')
     .description('Action description')
     .option('--param <value>', 'Parameter description')
     .action(asyncHandler(async (options) => {
       // Implementation
     }));
   ```

2. **Add NPM Scripts**
   ```json
   // In package.json
   {
     "scripts": {
       "new:action": "node scripts/cli.js new-feature action"
     }
   }
   ```

3. **Update Documentation**
   - Add to `docs/mvp/cli-tool-documentation.md`
   - Update examples in CLI help
   - Add to quick reference if appropriate

4. **Test New Commands**
   ```bash
   # Test command directly
   node scripts/cli.js new-feature action --help
   
   # Test npm script
   npm run new:action
   ```

## Code Style

### JavaScript Style Guide

- Use ES6+ features where appropriate
- Use async/await for asynchronous operations
- Include JSDoc comments for functions
- Use descriptive variable and function names
- Follow existing code patterns

### Example Code Style

```javascript
/**
 * Create a new user with validation
 * @param {Object} userData - User data object
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Created user object
 */
async function createUser(userData) {
  try {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = new User({
      email: userData.email,
      password: hashedPassword
    });
    
    return await user.save();
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
}
```

### CLI Command Style

```javascript
// Good CLI command structure
command
  .command('action [required] [optional]')
  .description('Clear, concise description')
  .option('--param <value>', 'Parameter description', 'default-value')
  .option('--flag', 'Boolean flag description')
  .action(asyncHandler(async (required, optional, options) => {
    console.log(chalk.blue('🔄 Starting action...'));
    
    // Implementation with proper error handling
    const spinner = ora('Processing...').start();
    
    try {
      // Do work
      const result = await performAction(required, options);
      spinner.succeed('Action completed');
      
      console.log(chalk.green('✅ Results:'));
      console.log(`  Items processed: ${result.count}`);
    } catch (error) {
      spinner.fail('Action failed');
      throw error;
    }
  }));
```

## Testing

### Test Structure

```bash
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
└── e2e/           # End-to-end tests for complete workflows
```

### Writing Tests

1. **Unit Tests**
   ```javascript
   // tests/unit/services/userService.test.js
   const { createUser } = require('../../../src/services/userService');
   
   describe('UserService', () => {
     test('should create user with valid data', async () => {
       const userData = {
         email: 'test@example.com',
         password: 'password123'
       };
       
       const user = await createUser(userData);
       expect(user.email).toBe(userData.email);
       expect(user.password).not.toBe(userData.password); // Should be hashed
     });
   });
   ```

2. **Integration Tests**
   ```javascript
   // tests/integration/auth.test.js
   const request = require('supertest');
   const app = require('../../src/app');
   
   describe('Authentication Endpoints', () => {
     test('POST /api/auth/login should authenticate user', async () => {
       const response = await request(app)
         .post('/api/auth/login')
         .send({
           email: 'test@example.com',
           password: 'password123'
         });
       
       expect(response.status).toBe(200);
       expect(response.body.token).toBeDefined();
     });
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/services/userService.test.js

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Documentation

### Required Documentation

When adding features:

1. **Code Comments**: JSDoc for all public functions
2. **CLI Documentation**: Update `docs/mvp/cli-tool-documentation.md`
3. **README Updates**: Update main README if needed
4. **API Documentation**: Document new API endpoints
5. **Implementation Log**: Update `docs/mvp/mvp-implementation-log.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Provide both basic and advanced usage examples
- Keep documentation up to date with code changes

## Database Changes

### Schema Changes

When modifying database schema:

1. **Update Models**
   ```javascript
   // src/models/User.js
   const userSchema = new mongoose.Schema({
     // Add new fields with proper validation
     newField: {
       type: String,
       required: true,
       validate: {
         validator: function(v) {
           return /^[a-zA-Z ]+$/.test(v);
         },
         message: 'Invalid format'
       }
     }
   });
   ```

2. **Update Database Init**
   ```javascript
   // src/config/databaseInit.js
   // Add new indexes if needed
   await User.createIndex({ newField: 1 });
   ```

3. **Update Seeding**
   ```javascript
   // src/config/databaseSeed.js
   // Include new fields in seed data
   ```

4. **Migration Strategy**
   - Document breaking changes
   - Provide migration scripts if needed
   - Update version requirements

## Issue Reporting

### Bug Reports

When filing a bug report, please include:

1. **Environment Information**
   ```bash
   # Include output of:
   node --version
   npm --version
   npm run deploy:health
   npm run db:status
   ```

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Error messages (full stack trace if available)

3. **Code Examples**
   - Minimal reproduction case
   - Relevant configuration

### Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: How you envision the feature working
3. **Alternatives**: Other solutions you've considered
4. **Impact**: Who would benefit from this feature

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Pre-Release Checklist

Before releasing:

1. **Code Quality**
   ```bash
   npm run lint
   npm test
   npm run deploy:health
   ```

2. **Documentation**
   - Update CHANGELOG.md
   - Update version numbers
   - Review README accuracy

3. **Database**
   ```bash
   # Test database operations
   npm run pathfinder -- test reset
   npm run db:init
   npm run db:seed
   ```

4. **CLI Testing**
   ```bash
   # Test all major CLI functions
   npm run pathfinder examples
   npm run deploy:validate
   npm run deploy:build
   ```

## Community

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

### Getting Help

- **Documentation**: Check docs/ directory first
- **Issues**: Search existing issues before creating new ones
- **CLI Help**: Use `npm run pathfinder --help` and `npm run pathfinder examples`
- **Health Checks**: Use `npm run deploy:health` for diagnostics

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes for significant contributions
- Special recognition for major features

Thank you for contributing to Pathfinder! 🚀
