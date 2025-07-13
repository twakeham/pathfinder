# Pathfinder CLI Tool Documentation

## Overview

The Pathfinder CLI is a comprehensive command-line interface for managing the LLM Playground database, deployments, Docker operations, and development workflows. It provides easy access to all operations with safety features and extensible architecture designed for both development and production environments.

## Installation & Setup

### Local Usage
```bash
# Run directly with npm
npm run pathfinder -- [command]

# Or run the script directly
node scripts/cli.js [command]
```

### Global Installation
```bash
# Install globally (future)
npm install -g llm-playground-training-tool
pathfinder [command]
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
# At minimum, set MONGODB_URI
```

## Command Structure

```
pathfinder [command] [subcommand] [options]
```

### Available Commands

1. **db** - Database management
2. **setup** - Database initialization and seeding  
3. **test** - Testing and development utilities
4. **backup** - Backup and restore operations
5. **clean** - Collection cleaning utilities
6. **deploy** - Deployment and production management
7. **docker** - Docker container management
8. **examples** - Usage examples

## Command Reference

### Database Management (`db`)

#### `pathfinder db status`
Check database connection status and health.

**Output:**
- Connection status
- Ready state
- Health check results
- Host/port information
- Retry attempt counts

**Example:**
```bash
npm run pathfinder -- db status
```

#### `pathfinder db stats`
Get comprehensive database statistics.

**Output:**
- Database size and object counts
- Collection-level statistics
- Index information
- Storage utilization

### Database Setup (`setup`)

#### `pathfinder setup init`
Initialize database with collections and indexes.

**Options:**
- `--force` - Force reinitialization (drops existing collections)

**What it does:**
- Creates all 10 required collections
- Sets up 25+ performance indexes
- Configures data validators
- Establishes TTL policies

**Example:**
```bash
npm run pathfinder -- setup init
npm run pathfinder -- setup init --force  # Dangerous: drops existing data
```

#### `pathfinder setup seed`
Seed database with initial data.

**Options:**
- `--admin-only` - Create only admin user
- `--force` - Force recreation of existing data
- `--skip-admin` - Skip admin user creation
- `--skip-departments` - Skip department creation  
- `--skip-templates` - Skip template creation

**What it creates:**
- Admin user (admin@pathfinder.local)
- 5 default departments
- 4 sample prompt templates

**Examples:**
```bash
npm run pathfinder -- setup seed                    # Full seeding
npm run pathfinder -- setup seed --admin-only       # Admin only
npm run pathfinder -- setup seed --force            # Force recreation
```

#### `pathfinder setup status`
Check seeding status and what data exists.

**Output:**
- Admin user existence
- Department count
- Template count
- Last check timestamp

### Testing Utilities (`test`)

#### `pathfinder test reset`
Completely reset database with confirmation prompt.

**Options:**
- `--no-seed` - Skip seeding after reset

**What it does:**
- Drops all collections
- Recreates structure
- Optionally reseeds with initial data

**Example:**
```bash
npm run pathfinder -- test reset           # Reset with seeding
npm run pathfinder -- test reset --no-seed # Reset without seeding
```

#### `pathfinder test generate`
Generate test data for development.

**Options:**
- `--users <count>` - Number of test users (default: 10)
- `--courses <count>` - Number of test courses (default: 3)
- `--conversations <count>` - Number of test conversations (default: 20)

**What it creates:**
- Test users with pattern: testuser{1-N}@pathfinder.local
- Password: password123 (hashed)
- Role distribution: Users 1-2 are Instructors, rest are Users

**Examples:**
```bash
npm run pathfinder -- test generate              # Default counts
npm run pathfinder -- test generate --users 5    # 5 test users only
```

#### `pathfinder test clean`
Clean up all test data.

**What it removes:**
- All users matching testuser pattern
- Test conversations
- Generated test content

### Backup & Restore (`backup`)

#### `pathfinder backup create [name]`
Create a database backup.

**Options:**
- `--collections <list>` - Comma-separated list of collections to backup

**Examples:**
```bash
npm run pathfinder -- backup create                        # Auto-named backup
npm run pathfinder -- backup create my-backup              # Named backup
npm run pathfinder -- backup create --collections users,courses  # Specific collections
```

#### `pathfinder backup list`
List all available backups with details.

**Output:**
- Backup names and timestamps
- Collection counts
- Creation dates

#### `pathfinder backup restore <name>`
Restore from a backup with confirmation prompt.

**Options:**
- `--no-clean` - Skip cleaning collections before restore

**Example:**
```bash
npm run pathfinder -- backup restore my-backup              # Clean restore
npm run pathfinder -- backup restore my-backup --no-clean   # Merge restore
```

#### `pathfinder backup delete <name>`
Delete a backup with confirmation prompt.

### Collection Utilities

#### `pathfinder clean [collections...]`
Clean specific collections while preserving structure.

**Examples:**
```bash
npm run pathfinder -- clean                    # Clean all collections
npm run pathfinder -- clean users courses      # Clean specific collections
```

## Safety Features

### Confirmation Prompts
Destructive operations require confirmation:
- Database reset
- Backup restoration
- Collection cleaning
- Backup deletion

### Data Validation
- Connection status checks before operations
- Collection existence validation
- Backup integrity verification

### Error Handling
- Graceful error messages
- Detailed debug information (with DEBUG=true)
- Proper cleanup on failures

## npm Script Shortcuts

Common operations have npm script shortcuts:

```bash
npm run db:status    # Check database status
npm run db:init      # Initialize database
npm run db:seed      # Seed database
npm run db:reset     # Reset database
```

## Development Workflow Examples

### Initial Project Setup
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI

# 2. Initialize database
npm run db:init

# 3. Seed with initial data
npm run db:seed

# 4. Check status
npm run db:status
```

### Development Cycle
```bash
# Start with fresh data
npm run pathfinder -- test reset

# Generate test data
npm run pathfinder -- test generate --users 5

# Work on features...

# Clean up test data when done
npm run pathfinder -- test clean
```

### Backup Workflow
```bash
# Create backup before major changes
npm run pathfinder -- backup create pre-feature-x

# Make changes...

# If something goes wrong, restore
npm run pathfinder -- backup restore pre-feature-x

# Clean up old backups
npm run pathfinder -- backup list
npm run pathfinder -- backup delete old-backup-name
```

### CI/CD Integration
```bash
# In CI pipeline, start with clean state
npm run pathfinder -- test reset --no-seed

# Run tests with test data
npm run pathfinder -- test generate --users 3
npm test
npm run pathfinder -- test clean
```

## Extensibility

### Adding New Commands

1. **Add command structure:**
```javascript
const newCommand = program
  .command('new')
  .description('New feature commands');

newCommand
  .command('action')
  .description('Perform new action')
  .option('--param <value>', 'Parameter description')
  .action(asyncHandler(async (options) => {
    // Implementation
  }));
```

2. **Import required modules:**
```javascript
const { newFunction } = require('../src/services/newService');
```

3. **Add npm shortcuts:**
```json
{
  "scripts": {
    "new:action": "node scripts/cli.js new action"
  }
}
```

### Adding New Options

```javascript
.option('--new-option <value>', 'Description', 'default-value')
.option('--flag', 'Boolean flag description')
```

## Error Handling

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB is running
   - Verify MONGODB_URI in .env
   - Check network connectivity

2. **Permission Errors**
   - Ensure database user has proper permissions
   - Check authentication credentials

3. **Collection Not Found**
   - Run `npm run db:init` to initialize collections
   - Check if database name is correct

### Debug Mode

```bash
DEBUG=true npm run pathfinder -- [command]
```

This provides:
- Detailed error stack traces
- Additional logging information
- Connection diagnostics

## Deployment Commands

### Environment Management

#### `deploy validate-env [environment]`
Validates environment configuration and checks for required variables.

**Options:**
- `--file <file>` - Specific .env file to validate

**Examples:**
```bash
pathfinder deploy validate-env                  # Validate .env
pathfinder deploy validate-env production       # Validate .env.production
pathfinder deploy validate-env --file .env.dev  # Validate specific file
```

**Required Variables:**
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JSON Web Token secret key
- `NODE_ENV` - Environment (development/production)

**Optional Variables:**
- `PORT` - Application port (default: 3000)
- `ADMIN_EMAIL` - Override default admin email
- `ADMIN_PASSWORD` - Override default admin password
- `OPENAI_API_KEY` - OpenAI API integration
- Email configuration (EMAIL_HOST, EMAIL_PORT, etc.)

### Build Management

#### `deploy build [target]`
Builds the application for deployment.

**Arguments:**
- `target` - Build target: `all`, `client`, `server` (default: all)

**Options:**
- `--prod` - Build for production
- `--no-install` - Skip dependency installation

**Examples:**
```bash
pathfinder deploy build --prod        # Production build
pathfinder deploy build client        # Frontend only
pathfinder deploy build --no-install  # Skip npm install
```

### Health Monitoring

#### `deploy health`
Performs comprehensive application health checks.

**Options:**
- `--url <url>` - Health check URL (default: http://localhost:3000)
- `--timeout <ms>` - Request timeout in milliseconds (default: 5000)

**Health Checks:**
1. Database connectivity and health
2. Environment variable validation  
3. Application server responsiveness
4. File system permissions
5. Memory usage monitoring

**Examples:**
```bash
pathfinder deploy health                           # Standard health check
pathfinder deploy health --url http://localhost:8080  # Custom URL
pathfinder deploy health --timeout 10000              # 10 second timeout
```

### Service Management

#### `deploy service start [service]`
Starts application services.

**Arguments:**
- `service` - Service to start: `all`, `server`, `client` (default: all)

**Options:**
- `--detach` - Run in background (detached mode)
- `--dev` - Start in development mode

**Examples:**
```bash
pathfinder deploy service start           # Start all services
pathfinder deploy service start --dev     # Development mode
pathfinder deploy service start --detach  # Background mode
pathfinder deploy service start server    # Backend only
```

#### `deploy service stop [service]`
Stops application services by killing processes on standard ports.

**Examples:**
```bash
pathfinder deploy service stop        # Stop all services
pathfinder deploy service stop server # Stop backend only
```

#### `deploy service status`
Checks the status of application services.

**Examples:**
```bash
pathfinder deploy service status  # Check all service status
```

### Log Management

#### `deploy logs view [service]`
Views application logs with filtering and formatting.

**Arguments:**
- `service` - Service logs to view (default: app)

**Options:**
- `--tail <lines>` - Number of lines to show (default: 50)
- `--follow` - Follow log output in real-time

**Examples:**
```bash
pathfinder deploy logs view              # View last 50 lines
pathfinder deploy logs view --tail 100   # View last 100 lines
pathfinder deploy logs view --follow     # Follow logs in real-time
pathfinder deploy logs view backend      # View backend logs
```

#### `deploy logs clear [service]`
Clears application logs.

**Examples:**
```bash
pathfinder deploy logs clear        # Clear app logs
pathfinder deploy logs clear backend # Clear backend logs
```

## Docker Commands

### Container Management

#### `docker build [service]`
Builds Docker images for the application.

**Arguments:**
- `service` - Service to build (default: app)

**Options:**
- `--no-cache` - Build without using cache
- `--tag <tag>` - Tag for the image (default: latest)

**Examples:**
```bash
pathfinder docker build                  # Build main app image
pathfinder docker build --no-cache       # Fresh build without cache
pathfinder docker build --tag v1.2.0     # Tag with version
```

#### `docker up [service]`
Starts Docker containers using docker-compose.

**Arguments:**
- `service` - Specific service to start (optional)

**Options:**
- `--detach` - Run in detached mode
- `--build` - Build images before starting

**Examples:**
```bash
pathfinder docker up                     # Start all containers
pathfinder docker up --detach            # Start in background
pathfinder docker up --build             # Build and start
pathfinder docker up mongodb             # Start MongoDB only
```

#### `docker down`
Stops and removes Docker containers.

**Options:**
- `--volumes` - Remove volumes as well

**Examples:**
```bash
pathfinder docker down           # Stop containers
pathfinder docker down --volumes # Stop and remove volumes
```

#### `docker logs [service]`
Views Docker container logs.

**Arguments:**
- `service` - Service logs to view (optional)

**Options:**
- `--follow` - Follow log output
- `--tail <lines>` - Number of lines to show (default: 50)

**Examples:**
```bash
pathfinder docker logs                # All container logs
pathfinder docker logs --follow       # Follow all logs
pathfinder docker logs mongodb        # MongoDB logs only
pathfinder docker logs --tail 100     # Last 100 lines
```

## NPM Script Shortcuts

For convenience, many deployment commands have NPM script shortcuts:

```bash
# Environment & Build
npm run deploy:validate   # Validate environment
npm run deploy:build      # Production build
npm run deploy:health     # Health check

# Service Management
npm run deploy:start      # Start services
npm run deploy:stop       # Stop services
npm run deploy:status     # Service status

# Docker Operations
npm run docker:build      # Build Docker image
npm run docker:up         # Start containers
npm run docker:down       # Stop containers

# Log Management
npm run logs:view         # View logs
npm run logs:follow       # Follow logs
```

## Development Workflow Examples

### Initial Project Setup
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# 2. Validate environment
npm run deploy:validate

# 3. Initialize database
npm run db:init

# 4. Seed with initial data
npm run db:seed

# 5. Check overall health
npm run deploy:health
```

### Development Cycle
```bash
# Start development environment
npm run deploy:start --dev

# Generate test data
npm run pathfinder -- test generate --users 5

# Work on features...

# Check service status
npm run deploy:status

# View logs
npm run logs:follow

# Clean up when done
npm run pathfinder -- test clean
npm run deploy:stop
```

### Production Deployment Cycle
```bash
# 1. Validate production environment
pathfinder deploy validate-env production

# 2. Build for production
npm run deploy:build

# 3. Run health checks
npm run deploy:health

# 4. Start production services
npm run deploy:start

# 5. Monitor logs
npm run logs:follow
```

### Docker Development Workflow
```bash
# Start development containers
npm run docker:up

# Check container status
pathfinder docker logs

# Make changes and rebuild
pathfinder docker build --no-cache
pathfinder docker up --build

# Clean up
npm run docker:down --volumes
```

### Backup & Deployment Workflow
```bash
# Create pre-deployment backup
npm run pathfinder -- backup create pre-deployment-$(date +%Y%m%d)

# Deploy new version
npm run deploy:build
npm run deploy:stop
npm run deploy:start

# Verify deployment
npm run deploy:health

# If issues, rollback
npm run pathfinder -- backup restore pre-deployment-20250713
```

## Extensibility & Customization

### Adding New Commands

The CLI is designed for easy extension. To add new commands:

1. **Create Command Structure:**
```javascript
const newCommand = program
  .command('new-feature')
  .description('Description of new feature');
```

2. **Add Subcommands:**
```javascript
newCommand
  .command('action')
  .description('Action description')
  .option('--flag', 'Flag description')
  .action(asyncHandler(async (options) => {
    // Implementation
  }));
```

3. **Add Helper Functions:**
```javascript
async function newFeatureHelper() {
  // Helper implementation
}
```

4. **Update Examples:**
```javascript
// Add to examples command
console.log(chalk.cyan('New Feature:'));
console.log('  pathfinder new-feature action  # Description');
```

### Custom Environment Configurations

Create environment-specific configurations:

```bash
# Development
.env.development

# Staging  
.env.staging

# Production
.env.production
```

Validate specific environments:
```bash
pathfinder deploy validate-env staging
pathfinder deploy validate-env production
```

### Docker Configuration

The CLI supports custom Docker configurations:

- `Dockerfile` - Main application container
- `docker-compose.yml` - Production setup
- `docker-compose.dev.yml` - Development setup
- `.dockerignore` - Build optimization

Customize for your environment by editing these files.

## Security Best Practices

### Environment Security
- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Rotate secrets regularly
- Use environment-specific configurations

### Deployment Security
- Validate all environment variables before deployment
- Use HTTPS in production
- Implement proper authentication and authorization
- Monitor and log security events

### CLI Security
- Confirmation prompts for destructive operations
- Secure handling of sensitive data
- Input validation and sanitization
- Error message sanitization

## Troubleshooting

### Common Issues

1. **CLI Command Not Found**
   ```bash
   # Make sure you're in the project directory
   cd /path/to/pathfinder
   node scripts/cli.js [command]
   ```

2. **Environment Validation Failed**
   ```bash
   # Check .env file exists
   ls -la .env
   
   # Copy from example if missing
   cp .env.example .env
   ```

3. **Service Start/Stop Issues**
   ```bash
   # Check port conflicts
   pathfinder deploy service status
   
   # Force kill processes if needed
   pathfinder deploy service stop
   ```

4. **Docker Issues**
   ```bash
   # Check Docker is running
   docker --version
   
   # Clean up containers
   pathfinder docker down --volumes
   ```

5. **Health Check Failures**
   ```bash
   # Run individual checks
   pathfinder deploy validate-env
   pathfinder db status
   
   # Check logs for errors
   pathfinder deploy logs view
   ```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
DEBUG=true pathfinder [command]
```

This provides:
- Detailed error stack traces
- Additional logging information
- Connection diagnostics
- Step-by-step execution details

## Future Extensions

The CLI is designed to easily accommodate additional features:

1. **Authentication Management**
   - User creation and management utilities
   - Password reset and recovery tools
   - Role and permission management

2. **Content Management**
   - Course import/export functionality
   - Content validation and migration
   - Template management and sharing

3. **Analytics & Monitoring**
   - Usage reports and metrics
   - Performance monitoring
   - Cost tracking and optimization

4. **AI Integration**
   - Model testing and validation
   - API key management
   - Response quality monitoring

5. **Advanced Deployment**
   - Multi-environment management
   - Automated testing integration
   - CI/CD pipeline support

---

**Version:** 2.0.0  
**Last Updated:** 2025-07-13  
**Compatible with:** Pathfinder v1.0.0+
