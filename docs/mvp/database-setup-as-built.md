# Database Setup - As-Built Documentation

## Overview

This document details the complete database infrastructure implemented for the LLM Playground and Training Tool MVP. The database layer provides robust MongoDB connectivity, automatic schema setup, data seeding, and comprehensive testing utilities.

## Architecture Summary

```
Database Layer Architecture:
├── Connection Management (database.js)
├── Schema & Collections Setup (databaseInit.js)  
├── Initial Data Seeding (databaseSeed.js)
└── Testing & Utilities (databaseTestUtils.js)
```

## Components Implemented

### 1. Database Connection Manager (`src/config/database.js`)

**Purpose**: Manages MongoDB connections with enterprise-grade reliability

**Features**:
- Singleton connection pattern for application-wide access
- Exponential backoff retry logic (5 attempts, 1s-30s delays)
- Automatic reconnection on unexpected disconnections
- Health monitoring and status reporting
- Graceful shutdown handling
- Connection pooling optimization

**Configuration**:
```javascript
// Connection options (hard-coded, production-ready)
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  bufferCommands: false,
  bufferMaxEntries: 0
}
```

**Environment Variables**:
- `MONGODB_URI` (default: `mongodb://localhost:27017/pathfinder-dev`)

**API**:
- `initializeDatabase(enableRetry)` - Initialize connection
- `getDatabaseConnection()` - Get connection instance
- `closeDatabaseConnection()` - Close connection
- `healthCheck()` - Perform health check
- `getConnectionStatus()` - Get detailed status

### 2. Database Initialization (`src/config/databaseInit.js`)

**Purpose**: Sets up complete database schema with collections and indexes

**Collections Created**:
1. `users` - User accounts and profiles
2. `courses` - Course content structure
3. `modules` - Course modules/sections
4. `lessons` - Individual lessons
5. `conversations` - Chat conversations and history
6. `prompttemplates` - Prompt template library
7. `userprogress` - User learning progress tracking
8. `analytics` - Usage analytics and events
9. `invitations` - User invitation system
10. `departments` - Organizational departments

**Indexes Implemented** (25+ total):

**Performance Indexes**:
- `users.email` (unique) - User lookup
- `users.role` - Role-based queries
- `courses.instructor` - Course filtering
- `conversations.userId + createdAt` - User conversation history
- `prompttemplates.category` - Template browsing

**Search Indexes**:
- `courses.title + description` (text) - Course search
- `lessons.title` (text) - Lesson search
- `prompttemplates.title + description + tags` (text) - Template search

**TTL Indexes**:
- `conversations.createdAt` - 1 year retention
- `analytics.timestamp` - 90 day retention
- `invitations.expiresAt` - Automatic cleanup

**Data Validators**:
- Email format validation for users
- Role enumeration enforcement
- Required field validation

**API**:
- `initializeCollections()` - Set up all collections and indexes
- `dropCollections()` - Drop all collections (testing)
- `getDatabaseStats()` - Get database statistics

### 3. Database Seeding (`src/config/databaseSeed.js`)

**Purpose**: Populates database with initial admin user and sample data

**Default Admin User**:
```javascript
Email: admin@pathfinder.local
Password: PathfinderAdmin2025!
Role: Admin
Status: Pre-approved
```

**Environment Variable Overrides**:
- `ADMIN_EMAIL` - Override default admin email
- `ADMIN_PASSWORD` - Override default admin password

**Sample Data Created**:

**Departments** (5 default):
- Engineering - Software engineering and development teams
- Marketing - Marketing and communications teams  
- Sales - Sales and business development teams
- Support - Customer support and success teams
- Operations - Operations and administrative teams

**Prompt Templates** (4 production-ready):
1. **Code Review Assistant**
   - Category: Development
   - Variables: `{language}`, `{code}`
   - Purpose: Code review automation

2. **Learning Path Creator**
   - Category: Education
   - Variables: `{topic}`, `{level}`
   - Purpose: Curriculum development

3. **Problem Solver**
   - Category: Problem Solving
   - Variables: `{problem}`
   - Purpose: Systematic problem breakdown

4. **Meeting Summarizer**
   - Category: Business
   - Variables: `{notes}`
   - Purpose: Meeting notes processing

**API**:
- `seedDatabase(options)` - Complete seeding with options
- `createAdminUser(force)` - Create admin user only
- `cleanupSeededData()` - Remove seeded data
- `getSeedingStatus()` - Check seeding status

### 4. Testing Utilities (`src/config/databaseTestUtils.js`)

**Purpose**: Comprehensive testing and development support utilities

**Features**:

**Database Reset**:
- Complete database reset with optional reseeding
- Structure preservation during reset
- Configurable reset options

**Backup System**:
- Named backups with timestamp tracking
- Collection-level backup granularity
- Safe restore with optional pre-cleaning
- Backup management (list, delete)

**Test Data Generation**:
- Configurable user generation (default: 10 users)
- Realistic test data with proper structure
- Department-based organization
- Role distribution (2 instructors, 8 regular users)

**Development Utilities**:
- Selective collection cleaning
- Test data cleanup for CI/CD
- Database statistics and monitoring

**Test User Credentials**:
```javascript
Email Pattern: testuser{1-10}@pathfinder.local
Password: password123 (hashed)
Roles: Users 1-2 are Instructors, 3-10 are regular Users
```

**API**:
- `resetDatabase(options)` - Complete reset
- `cleanCollections(collections)` - Selective cleaning
- `createBackup(collections, name)` - Create backup
- `restoreBackup(name, clean)` - Restore backup
- `generateTestData(options)` - Generate test data
- `cleanupTestData()` - Clean test data

## Configuration Requirements

### Environment Variables

**Required**:
- `MONGODB_URI` - MongoDB connection string

**Optional**:
- `ADMIN_EMAIL` - Override default admin email
- `ADMIN_PASSWORD` - Override default admin password

**Example `.env` file**:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pathfinder-dev

# Admin User Configuration (Optional)
ADMIN_EMAIL=admin@pathfinder.local
ADMIN_PASSWORD=PathfinderAdmin2025!
```

### MongoDB Requirements

**Minimum MongoDB Version**: 4.4+
**Required Features**:
- Text search indexes
- TTL indexes
- Collection validators
- Aggregation pipeline

**Recommended Setup**:
```bash
# Local MongoDB (Docker)
docker run -d \
  --name pathfinder-mongo \
  -p 27017:27017 \
  -v pathfinder-data:/data/db \
  mongo:7.0

# Or MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pathfinder?retryWrites=true&w=majority
```

## Deployment Procedures

### Initial Setup

1. **Install Dependencies**:
   ```bash
   npm install mongoose bcryptjs
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI
   ```

3. **Initialize Database**:
   ```javascript
   const { initializeDatabase } = require('./src/config/database');
   const { initializeCollections } = require('./src/config/databaseInit');
   const { seedDatabase } = require('./src/config/databaseSeed');

   // Connect to database
   await initializeDatabase();

   // Set up collections and indexes
   await initializeCollections();

   // Seed with initial data
   await seedDatabase();
   ```

### Development Setup

```javascript
const { resetDatabase } = require('./src/config/databaseTestUtils');

// Complete reset with test data
await resetDatabase({ seedAfterReset: true });
```

### Testing Setup

```javascript
const { 
  createBackup, 
  generateTestData, 
  cleanupTestData 
} = require('./src/config/databaseTestUtils');

// Before tests
await createBackup(null, 'pre-test-backup');
await generateTestData({ userCount: 5 });

// After tests
await cleanupTestData();
```

## Security Considerations

### Implemented Security Features

1. **Password Security**:
   - bcrypt hashing with 12 salt rounds
   - Secure default passwords with complexity requirements
   - Password change recommendations

2. **Database Security**:
   - Connection pooling limits
   - Timeout configurations
   - Error message sanitization

3. **Data Validation**:
   - Email format validation
   - Role enumeration enforcement
   - Required field validation

### Security Recommendations

1. **Production Deployment**:
   - Change default admin password immediately
   - Use MongoDB Atlas or secured MongoDB instance
   - Enable MongoDB authentication
   - Use TLS/SSL for connections
   - Implement IP whitelisting

2. **Access Control**:
   - Create dedicated database user with limited privileges
   - Use connection string with authentication
   - Rotate admin credentials regularly

## Monitoring and Maintenance

### Health Monitoring

```javascript
const { healthCheck, getConnectionStatus } = require('./src/config/database');

// Check database health
const isHealthy = await healthCheck();

// Get detailed status
const status = await getConnectionStatus();
console.log(status);
```

### Database Statistics

```javascript
const { getDatabaseStats } = require('./src/config/databaseInit');

// Get comprehensive database statistics
const stats = await getDatabaseStats();
console.log(stats);
```

### Backup Procedures

```javascript
const { createBackup, listBackups } = require('./src/config/databaseTestUtils');

// Create scheduled backup
await createBackup(null, `scheduled_${new Date().toISOString()}`);

// List all backups
const backups = await listBackups();
```

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Check MongoDB URI format
   - Verify MongoDB server is running
   - Check network connectivity
   - Review firewall settings

2. **Authentication Errors**:
   - Verify database user credentials
   - Check database permissions
   - Ensure authentication database is correct

3. **Index Creation Failures**:
   - Check for conflicting indexes
   - Verify collection exists
   - Review MongoDB version compatibility

### Debug Tools

```javascript
// Connection diagnostics
const { getConnectionStatus, resetRetryState } = require('./src/config/database');

// Reset retry state if stuck
await resetRetryState();

// Get detailed connection info
const status = await getConnectionStatus();
```

## Performance Considerations

### Index Strategy

- **Primary Indexes**: Unique constraints and frequent queries
- **Compound Indexes**: Multi-field query optimization
- **Text Indexes**: Full-text search capabilities
- **TTL Indexes**: Automatic data lifecycle management

### Connection Optimization

- **Pool Size**: 10 connections (adjustable based on load)
- **Timeouts**: Balanced for responsiveness and reliability
- **Retry Logic**: Exponential backoff prevents connection storms

### Data Retention

- **Conversations**: 1-year automatic cleanup
- **Analytics**: 90-day retention for performance
- **Invitations**: Automatic cleanup on expiration

## Future Considerations

### Scalability

1. **Sharding Preparation**:
   - Indexes designed for potential sharding keys
   - User-based data partitioning ready

2. **Read Replicas**:
   - Connection manager supports multiple endpoints
   - Read preference configuration ready

3. **Caching Layer**:
   - Database abstraction allows for caching integration
   - Redis integration points identified

### Monitoring Integration

- Application Performance Monitoring (APM) ready
- Custom metrics collection points available
- Health check endpoints for load balancers

## Summary

The database layer provides a production-ready foundation with:

✅ **Robust Connection Management** - Retry logic, health monitoring  
✅ **Complete Schema Setup** - 10 collections, 25+ indexes, validators  
✅ **Initial Data Seeding** - Admin user, departments, sample templates  
✅ **Comprehensive Testing** - Backup/restore, test data, cleanup utilities  
✅ **Security Features** - Password hashing, validation, error handling  
✅ **Performance Optimization** - Strategic indexing, connection pooling  
✅ **Monitoring Ready** - Health checks, statistics, status reporting  

The system is ready for immediate development and can scale to production requirements with minimal configuration changes.

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-13  
**Next Review**: Before production deployment
