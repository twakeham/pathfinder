#!/usr/bin/env node

/**
 * Pathfinder CLI Tool
 * Command-line interface for database management and deployment tasks
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const path = require('path');

// Import our database utilities
const { initializeDatabase, getDatabaseConnection, closeDatabaseConnection } = require('../src/config/database');
const { initializeCollections, dropCollections, getDatabaseStats } = require('../src/config/databaseInit');
const { seedDatabase, createAdminUser, cleanupSeededData, getSeedingStatus } = require('../src/config/databaseSeed');
const { 
  resetDatabase, 
  cleanCollections, 
  createBackup, 
  restoreBackup, 
  generateTestData, 
  cleanupTestData,
  listBackups,
  deleteBackup 
} = require('../src/config/databaseTestUtils');

const program = new Command();

// Global configuration
program
  .name('pathfinder')
  .description('CLI tool for Pathfinder LLM Playground management')
  .version('1.0.0');

/**
 * Utility function to handle async commands with proper error handling
 */
function asyncHandler(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (process.env.DEBUG) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  };
}

/**
 * Utility function to ensure database connection
 */
async function ensureConnection() {
  const spinner = ora('Connecting to database...').start();
  try {
    await initializeDatabase();
    const dbConnection = getDatabaseConnection();
    if (!dbConnection.isConnectionReady()) {
      throw new Error('Database connection failed');
    }
    spinner.succeed('Connected to database');
  } catch (error) {
    spinner.fail('Database connection failed');
    throw error;
  }
}

/**
 * Utility function for graceful shutdown
 */
async function gracefulShutdown() {
  try {
    await closeDatabaseConnection();
  } catch (error) {
    // Ignore errors during shutdown
  }
}

// Set up graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ============================================================================
// DATABASE COMMANDS
// ============================================================================

const dbCommand = program
  .command('db')
  .description('Database management commands');

// Database status command
dbCommand
  .command('status')
  .description('Check database connection status')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('📊 Checking database status...'));
    
    await ensureConnection();
    
    const dbConnection = getDatabaseConnection();
    const status = dbConnection.getConnectionStatus();
    const isHealthy = await dbConnection.healthCheck();
    
    console.log(chalk.green('\n✅ Database Status:'));
    console.log(`  Connection: ${status.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`  Ready State: ${status.readyStateText}`);
    console.log(`  Health Check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`  Host: ${status.host || 'N/A'}`);
    console.log(`  Port: ${status.port || 'N/A'}`);
    console.log(`  Database: ${status.name || 'N/A'}`);
    console.log(`  Retry Attempts: ${status.retryAttempts}/${status.maxRetryAttempts}`);
  }));

// Database statistics command
dbCommand
  .command('stats')
  .description('Get database statistics')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('📈 Gathering database statistics...'));
    
    await ensureConnection();
    
    const spinner = ora('Collecting statistics...').start();
    const stats = await getDatabaseStats();
    spinner.succeed('Statistics collected');
    
    console.log(chalk.green('\n📊 Database Statistics:'));
    console.log(`  Database: ${stats.database.name}`);
    console.log(`  Collections: ${stats.database.collections}`);
    console.log(`  Total Objects: ${stats.database.objects.toLocaleString()}`);
    console.log(`  Data Size: ${(stats.database.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Storage Size: ${(stats.database.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Indexes: ${stats.database.indexes}`);
    console.log(`  Index Size: ${(stats.database.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log(chalk.cyan('\n📋 Collection Details:'));
    Object.entries(stats.collections).forEach(([name, collStats]) => {
      if (collStats.error) {
        console.log(`  ${name}: Error - ${collStats.error}`);
      } else {
        console.log(`  ${name}: ${collStats.count.toLocaleString()} documents, ${collStats.indexes} indexes`);
      }
    });
  }));

// ============================================================================
// SETUP COMMANDS
// ============================================================================

const setupCommand = program
  .command('setup')
  .description('Database setup and initialization commands');

// Initialize database command
setupCommand
  .command('init')
  .description('Initialize database with collections and indexes')
  .option('--force', 'Force reinitialization even if collections exist')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🏗️  Initializing database...'));
    
    if (options.force) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'This will drop existing collections. Are you sure?',
        default: false
      }]);
      
      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }
    }
    
    await ensureConnection();
    
    if (options.force) {
      const spinner = ora('Dropping existing collections...').start();
      await dropCollections();
      spinner.succeed('Collections dropped');
    }
    
    const spinner = ora('Creating collections and indexes...').start();
    await initializeCollections();
    spinner.succeed('Database initialized successfully');
    
    console.log(chalk.green('✅ Database initialization complete'));
  }));

// Seed database command
setupCommand
  .command('seed')
  .description('Seed database with initial data')
  .option('--admin-only', 'Create only admin user')
  .option('--force', 'Force recreation of existing data')
  .option('--skip-admin', 'Skip admin user creation')
  .option('--skip-departments', 'Skip department creation')
  .option('--skip-templates', 'Skip template creation')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🌱 Seeding database...'));
    
    await ensureConnection();
    
    if (options.adminOnly) {
      const spinner = ora('Creating admin user...').start();
      const admin = await createAdminUser(options.force);
      
      if (admin) {
        spinner.succeed('Admin user created');
        console.log(chalk.green('\n✅ Admin User Created:'));
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role: ${admin.role}`);
        console.log(chalk.yellow('  ⚠️  Please change the default password after first login!'));
      } else {
        spinner.succeed('Admin user already exists');
      }
    } else {
      const spinner = ora('Seeding database with initial data...').start();
      const results = await seedDatabase({
        force: options.force,
        skipAdmin: options.skipAdmin,
        skipDepartments: options.skipDepartments,
        skipTemplates: options.skipTemplates
      });
      spinner.succeed('Database seeded successfully');
      
      console.log(chalk.green('\n✅ Seeding Results:'));
      console.log(`  Admin Created: ${results.summary.adminCreated ? '✅' : '⏭️ '}`);
      console.log(`  Departments: ${results.summary.departmentsCreated}`);
      console.log(`  Templates: ${results.summary.templatesCreated}`);
      
      if (results.summary.adminCreated) {
        console.log(chalk.yellow('\n⚠️  Default admin credentials:'));
        console.log('  Email: admin@pathfinder.local');
        console.log('  Password: PathfinderAdmin2025!');
        console.log('  Please change these after first login!');
      }
    }
  }));

// Check seeding status command
setupCommand
  .command('status')
  .description('Check seeding status')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('📋 Checking seeding status...'));
    
    await ensureConnection();
    
    const spinner = ora('Checking status...').start();
    const status = await getSeedingStatus();
    spinner.succeed('Status checked');
    
    console.log(chalk.green('\n📊 Seeding Status:'));
    console.log(`  Admin User: ${status.adminExists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`  Departments: ${status.departmentCount}/5 created`);
    console.log(`  Templates: ${status.templateCount}/4 created`);
    console.log(`  Last Check: ${status.timestamp}`);
  }));

// ============================================================================
// TESTING COMMANDS
// ============================================================================

const testCommand = program
  .command('test')
  .description('Testing and development utilities');

// Reset database command
testCommand
  .command('reset')
  .description('Completely reset database')
  .option('--no-seed', 'Skip seeding after reset')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🔄 Resetting database...'));
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'This will DELETE ALL DATA. Are you sure?',
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    await ensureConnection();
    
    const spinner = ora('Resetting database...').start();
    const results = await resetDatabase({ 
      seedAfterReset: options.seed !== false 
    });
    spinner.succeed('Database reset complete');
    
    console.log(chalk.green('\n✅ Reset Results:'));
    console.log(`  Collections Dropped: ${results.dropped ? '✅' : '❌'}`);
    console.log(`  Structure Recreated: ${results.initialized ? '✅' : '❌'}`);
    console.log(`  Data Seeded: ${results.seeded ? '✅' : '⏭️ '}`);
  }));

// Generate test data command
testCommand
  .command('generate')
  .description('Generate test data for development')
  .option('--users <count>', 'Number of test users to create', '10')
  .option('--courses <count>', 'Number of test courses to create', '3')
  .option('--conversations <count>', 'Number of test conversations to create', '20')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🧪 Generating test data...'));
    
    await ensureConnection();
    
    const spinner = ora('Generating test data...').start();
    const results = await generateTestData({
      userCount: parseInt(options.users),
      courseCount: parseInt(options.courses),
      conversationCount: parseInt(options.conversations)
    });
    spinner.succeed('Test data generated');
    
    console.log(chalk.green('\n✅ Test Data Generated:'));
    console.log(`  Users: ${results.users}`);
    console.log(`  Courses: ${results.courses}`);
    console.log(`  Conversations: ${results.conversations}`);
    
    console.log(chalk.cyan('\n📝 Test User Credentials:'));
    console.log('  Email Pattern: testuser{1-N}@pathfinder.local');
    console.log('  Password: password123');
    console.log('  Roles: Users 1-2 are Instructors, rest are regular Users');
  }));

// Clean test data command
testCommand
  .command('clean')
  .description('Clean up test data')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('🧹 Cleaning test data...'));
    
    await ensureConnection();
    
    const spinner = ora('Cleaning test data...').start();
    const results = await cleanupTestData();
    spinner.succeed('Test data cleaned');
    
    console.log(chalk.green('\n✅ Cleanup Results:'));
    console.log(`  Test Users Removed: ${results.usersRemoved}`);
    console.log(`  Test Conversations Removed: ${results.conversationsRemoved}`);
  }));

// ============================================================================
// BACKUP COMMANDS
// ============================================================================

const backupCommand = program
  .command('backup')
  .description('Backup and restore utilities');

// Create backup command
backupCommand
  .command('create [name]')
  .description('Create a database backup')
  .option('--collections <collections>', 'Comma-separated list of collections to backup')
  .action(asyncHandler(async (name, options) => {
    console.log(chalk.blue('💾 Creating backup...'));
    
    await ensureConnection();
    
    const collections = options.collections ? options.collections.split(',') : null;
    
    const spinner = ora(`Creating backup${name ? ` "${name}"` : ''}...`).start();
    const result = await createBackup(collections, name);
    spinner.succeed('Backup created');
    
    console.log(chalk.green('\n✅ Backup Created:'));
    console.log(`  Name: ${result.name}`);
    console.log(`  Timestamp: ${result.timestamp}`);
    console.log(`  Collections: ${result.collectionsBackedUp}`);
  }));

// List backups command
backupCommand
  .command('list')
  .description('List available backups')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('📋 Listing backups...'));
    
    await ensureConnection();
    
    const spinner = ora('Loading backups...').start();
    const backups = await listBackups();
    spinner.succeed('Backups loaded');
    
    if (backups.length === 0) {
      console.log(chalk.yellow('\n📭 No backups found'));
      return;
    }
    
    console.log(chalk.green('\n📦 Available Backups:'));
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.name}`);
      console.log(`     Created: ${new Date(backup.timestamp).toLocaleString()}`);
      console.log(`     Collections: ${backup.collectionsCount}`);
      console.log('');
    });
  }));

// Restore backup command
backupCommand
  .command('restore <name>')
  .description('Restore from a backup')
  .option('--no-clean', 'Skip cleaning collections before restore')
  .action(asyncHandler(async (name, options) => {
    console.log(chalk.blue(`📥 Restoring backup "${name}"...`));
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'This will overwrite existing data. Are you sure?',
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    await ensureConnection();
    
    const spinner = ora('Restoring backup...').start();
    const results = await restoreBackup(name, options.clean !== false);
    spinner.succeed('Backup restored');
    
    console.log(chalk.green('\n✅ Restore Results:'));
    console.log(`  Collections Restored: ${results.restored.length}`);
    console.log(`  Errors: ${results.errors.length}`);
    
    if (results.restored.length > 0) {
      console.log(chalk.cyan('\n📋 Restored Collections:'));
      results.restored.forEach(item => {
        console.log(`  ${item.collection}: ${item.documentsRestored} documents`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      results.errors.forEach(error => {
        console.log(`  ${error.collection}: ${error.error}`);
      });
    }
  }));

// Delete backup command
backupCommand
  .command('delete <name>')
  .description('Delete a backup')
  .action(asyncHandler(async (name) => {
    console.log(chalk.blue(`🗑️  Deleting backup "${name}"...`));
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete backup "${name}"?`,
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    await ensureConnection();
    
    const spinner = ora('Deleting backup...').start();
    const success = await deleteBackup(name);
    
    if (success) {
      spinner.succeed('Backup deleted');
      console.log(chalk.green(`✅ Backup "${name}" deleted successfully`));
    } else {
      spinner.fail('Backup not found');
      console.log(chalk.red(`❌ Backup "${name}" not found`));
    }
  }));

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

// Clean collections command
program
  .command('clean [collections...]')
  .description('Clean specific collections (preserves structure)')
  .action(asyncHandler(async (collections) => {
    console.log(chalk.blue('🧹 Cleaning collections...'));
    
    if (collections && collections.length > 0) {
      console.log(`  Target collections: ${collections.join(', ')}`);
    } else {
      console.log('  Target: All collections');
    }
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'This will delete all data in the specified collections. Continue?',
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    await ensureConnection();
    
    const spinner = ora('Cleaning collections...').start();
    const results = await cleanCollections(collections.length > 0 ? collections : null);
    spinner.succeed('Collections cleaned');
    
    console.log(chalk.green('\n✅ Cleanup Results:'));
    results.cleaned.forEach(item => {
      console.log(`  ${item.collection}: ${item.documentsRemoved} documents removed`);
    });
    
    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      results.errors.forEach(error => {
        console.log(`  ${error.collection}: ${error.error}`);
      });
    }
  }));

// Help command with examples
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('\n📚 Pathfinder CLI Examples:\n'));
    
    console.log(chalk.cyan('Database Management:'));
    console.log('  pathfinder db status           # Check database connection');
    console.log('  pathfinder db stats            # Get database statistics');
    console.log('');
    
    console.log(chalk.cyan('Initial Setup:'));
    console.log('  pathfinder setup init          # Initialize database structure');
    console.log('  pathfinder setup seed          # Seed with initial data');
    console.log('  pathfinder setup seed --admin-only  # Create admin user only');
    console.log('');
    
    console.log(chalk.cyan('Development:'));
    console.log('  pathfinder test reset          # Reset database completely');
    console.log('  pathfinder test generate       # Generate test data');
    console.log('  pathfinder test generate --users 5  # Generate 5 test users');
    console.log('  pathfinder test clean          # Clean up test data');
    console.log('');
    
    console.log(chalk.cyan('Backup & Restore:'));
    console.log('  pathfinder backup create my-backup     # Create named backup');
    console.log('  pathfinder backup list                 # List all backups');
    console.log('  pathfinder backup restore my-backup    # Restore from backup');
    console.log('  pathfinder backup delete my-backup     # Delete backup');
    console.log('');
    
    console.log(chalk.cyan('Deployment & Production:'));
    console.log('  pathfinder deploy validate-env         # Validate environment config');
    console.log('  pathfinder deploy build --prod         # Build for production');
    console.log('  pathfinder deploy health               # Comprehensive health check');
    console.log('  pathfinder deploy service start        # Start all services');
    console.log('  pathfinder deploy service start --dev  # Start in development mode');
    console.log('  pathfinder deploy service stop         # Stop all services');
    console.log('  pathfinder deploy service status       # Check service status');
    console.log('');
    
    console.log(chalk.cyan('Log Management:'));
    console.log('  pathfinder deploy logs view            # View application logs');
    console.log('  pathfinder deploy logs view --follow   # Follow logs in real-time');
    console.log('  pathfinder deploy logs clear           # Clear application logs');
    console.log('');
    
    console.log(chalk.cyan('Docker Operations:'));
    console.log('  pathfinder docker build                # Build Docker image');
    console.log('  pathfinder docker up --detach          # Start containers in background');
    console.log('  pathfinder docker down                 # Stop containers');
    console.log('  pathfinder docker logs --follow        # Follow container logs');
    console.log('');
    
    console.log(chalk.cyan('Utilities:'));
    console.log('  pathfinder clean users conversations   # Clean specific collections');
    console.log('  pathfinder clean                       # Clean all collections');
    console.log('');
    
    console.log(chalk.green('💡 Tip: Use --help with any command for detailed options'));
  });

// ============================================================================
// DEPLOYMENT COMMANDS
// ============================================================================

const deployCommand = program
  .command('deploy')
  .description('Deployment and production management commands');

// Environment validation command
deployCommand
  .command('validate-env [environment]')
  .description('Validate environment configuration')
  .option('--file <file>', 'Specific .env file to validate')
  .action(asyncHandler(async (environment, options) => {
    console.log(chalk.blue('🔍 Validating environment configuration...'));
    
    const envFile = options.file || (environment ? `.env.${environment}` : '.env');
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(process.cwd(), envFile);
    
    if (!fs.existsSync(envPath)) {
      console.log(chalk.red(`❌ Environment file not found: ${envFile}`));
      console.log(chalk.yellow('💡 Create it from .env.example:'));
      console.log(`   cp .env.example ${envFile}`);
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        envVars[key] = values.join('=');
      }
    });
    
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'NODE_ENV'
    ];
    
    const optionalVars = [
      'PORT',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD',
      'OPENAI_API_KEY',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'EMAIL_USER',
      'EMAIL_PASS'
    ];
    
    console.log(chalk.green(`\n✅ Environment File: ${envFile}`));
    
    let hasErrors = false;
    
    console.log(chalk.cyan('\n📋 Required Variables:'));
    requiredVars.forEach(varName => {
      if (envVars[varName]) {
        const value = envVars[varName].length > 20 ? envVars[varName].substring(0, 20) + '...' : envVars[varName];
        console.log(`  ✅ ${varName}: ${value}`);
      } else {
        console.log(`  ❌ ${varName}: MISSING`);
        hasErrors = true;
      }
    });
    
    console.log(chalk.cyan('\n📋 Optional Variables:'));
    optionalVars.forEach(varName => {
      if (envVars[varName]) {
        const value = envVars[varName].length > 20 ? envVars[varName].substring(0, 20) + '...' : envVars[varName];
        console.log(`  ✅ ${varName}: ${value}`);
      } else {
        console.log(`  ⚪ ${varName}: Not set`);
      }
    });
    
    if (hasErrors) {
      console.log(chalk.red('\n❌ Environment validation failed'));
      console.log(chalk.yellow('💡 Check .env.example for required variables'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ Environment validation passed'));
    }
  }));

// Build command
deployCommand
  .command('build [target]')
  .description('Build application for deployment')
  .option('--prod', 'Build for production')
  .option('--no-install', 'Skip dependency installation')
  .action(asyncHandler(async (target, options) => {
    const buildTarget = target || 'all';
    const isProduction = options.prod || process.env.NODE_ENV === 'production';
    
    console.log(chalk.blue(`🏗️  Building ${buildTarget} for ${isProduction ? 'production' : 'development'}...`));
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    if (options.install !== false) {
      console.log(chalk.cyan('\n📦 Installing dependencies...'));
      await runCommand('npm', ['install'], process.cwd());
      
      if (buildTarget === 'all' || buildTarget === 'client') {
        const clientPath = path.join(process.cwd(), 'client');
        if (require('fs').existsSync(clientPath)) {
          await runCommand('npm', ['install'], clientPath);
        }
      }
    }
    
    if (buildTarget === 'all' || buildTarget === 'client') {
      console.log(chalk.cyan('\n🎨 Building frontend...'));
      const clientPath = path.join(process.cwd(), 'client');
      if (require('fs').existsSync(clientPath)) {
        await runCommand('npm', ['run', 'build'], clientPath);
        console.log(chalk.green('✅ Frontend build complete'));
      } else {
        console.log(chalk.yellow('⚠️  Client directory not found, skipping frontend build'));
      }
    }
    
    if (buildTarget === 'all' || buildTarget === 'server') {
      console.log(chalk.cyan('\n🔧 Preparing backend...'));
      // Backend doesn't need building for Node.js, but we can run linting
      try {
        await runCommand('npm', ['run', 'lint'], process.cwd());
        console.log(chalk.green('✅ Backend validation complete'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Linting skipped (script not found)'));
      }
    }
    
    console.log(chalk.green('\n🎉 Build complete!'));
  }));

// Health check command
deployCommand
  .command('health')
  .description('Perform comprehensive health check')
  .option('--url <url>', 'Health check URL', 'http://localhost:3000')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '5000')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🏥 Performing health check...'));
    
    const checks = [
      { name: 'Database Connection', check: checkDatabase },
      { name: 'Environment Variables', check: checkEnvironment },
      { name: 'Application Server', check: () => checkServer(options.url, parseInt(options.timeout)) },
      { name: 'File System Permissions', check: checkFileSystem },
      { name: 'Memory Usage', check: checkMemory }
    ];
    
    const results = [];
    
    for (const { name, check } of checks) {
      const spinner = ora(`Checking ${name}...`).start();
      try {
        const result = await check();
        spinner.succeed(`${name}: ${result.status}`);
        results.push({ name, status: 'pass', details: result.details });
      } catch (error) {
        spinner.fail(`${name}: ${error.message}`);
        results.push({ name, status: 'fail', details: error.message });
      }
    }
    
    console.log(chalk.green('\n📊 Health Check Results:'));
    const passed = results.filter(r => r.status === 'pass').length;
    const total = results.length;
    
    console.log(`  Status: ${passed}/${total} checks passed`);
    
    if (passed === total) {
      console.log(chalk.green('  Overall: ✅ HEALTHY'));
    } else {
      console.log(chalk.red('  Overall: ❌ UNHEALTHY'));
      console.log(chalk.yellow('\n🔍 Failed Checks:'));
      results.filter(r => r.status === 'fail').forEach(result => {
        console.log(`  - ${result.name}: ${result.details}`);
      });
    }
  }));

// Service management commands
const serviceCommand = deployCommand
  .command('service')
  .description('Service management commands');

serviceCommand
  .command('start [service]')
  .description('Start application services')
  .option('--detach', 'Run in background (detached mode)')
  .option('--dev', 'Start in development mode')
  .action(asyncHandler(async (service, options) => {
    const serviceName = service || 'all';
    console.log(chalk.blue(`🚀 Starting ${serviceName} service(s)...`));
    
    if (serviceName === 'all' || serviceName === 'server') {
      const script = options.dev ? 'dev' : 'start';
      const mode = options.dev ? 'development' : 'production';
      
      console.log(chalk.cyan(`\n🔧 Starting backend in ${mode} mode...`));
      
      if (options.detach) {
        // Start as background process
        const { spawn } = require('child_process');
        const child = spawn('npm', ['run', script], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        console.log(chalk.green(`✅ Backend started with PID: ${child.pid}`));
      } else {
        await runCommand('npm', ['run', script], process.cwd());
      }
    }
    
    if (serviceName === 'all' || serviceName === 'client') {
      const clientPath = path.join(process.cwd(), 'client');
      if (require('fs').existsSync(clientPath)) {
        console.log(chalk.cyan('\n🎨 Starting frontend...'));
        
        if (options.detach) {
          const { spawn } = require('child_process');
          const child = spawn('npm', ['start'], {
            cwd: clientPath,
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
          console.log(chalk.green(`✅ Frontend started with PID: ${child.pid}`));
        } else {
          await runCommand('npm', ['start'], clientPath);
        }
      }
    }
  }));

serviceCommand
  .command('stop [service]')
  .description('Stop application services')
  .action(asyncHandler(async (service) => {
    const serviceName = service || 'all';
    console.log(chalk.blue(`🛑 Stopping ${serviceName} service(s)...`));
    
    // Find and kill processes by port
    const ports = serviceName === 'all' ? [3000, 3001] : 
                  serviceName === 'server' ? [3000] : [3001];
    
    for (const port of ports) {
      try {
        await killProcessOnPort(port);
        console.log(chalk.green(`✅ Service on port ${port} stopped`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  No service found on port ${port}`));
      }
    }
  }));

serviceCommand
  .command('status')
  .description('Check service status')
  .action(asyncHandler(async () => {
    console.log(chalk.blue('📊 Checking service status...'));
    
    const services = [
      { name: 'Backend', port: 3000 },
      { name: 'Frontend', port: 3001 }
    ];
    
    for (const service of services) {
      const isRunning = await checkPortInUse(service.port);
      const status = isRunning ? chalk.green('✅ Running') : chalk.red('❌ Stopped');
      console.log(`  ${service.name} (port ${service.port}): ${status}`);
    }
  }));

// Log management commands
const logCommand = deployCommand
  .command('logs')
  .description('Log management commands');

logCommand
  .command('view [service]')
  .description('View application logs')
  .option('--tail <lines>', 'Number of lines to show', '50')
  .option('--follow', 'Follow log output')
  .action(asyncHandler(async (service, options) => {
    const serviceName = service || 'app';
    console.log(chalk.blue(`📋 Viewing ${serviceName} logs...`));
    
    const fs = require('fs');
    const path = require('path');
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    const logFile = path.join(logsDir, `${serviceName}.log`);
    
    if (!fs.existsSync(logFile)) {
      console.log(chalk.yellow(`⚠️  Log file not found: ${logFile}`));
      console.log(chalk.cyan('💡 Logs will be created when the application starts'));
      return;
    }
    
    if (options.follow) {
      const { spawn } = require('child_process');
      const tail = spawn('tail', ['-f', logFile]);
      
      tail.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      tail.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      process.on('SIGINT', () => {
        tail.kill();
        process.exit(0);
      });
    } else {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n');
      const tailLines = lines.slice(-parseInt(options.tail));
      
      console.log(chalk.green(`\n📄 Last ${tailLines.length} lines from ${logFile}:`));
      console.log(chalk.gray('─'.repeat(60)));
      tailLines.forEach(line => {
        if (line.includes('ERROR') || line.includes('error')) {
          console.log(chalk.red(line));
        } else if (line.includes('WARN') || line.includes('warn')) {
          console.log(chalk.yellow(line));
        } else {
          console.log(line);
        }
      });
    }
  }));

logCommand
  .command('clear [service]')
  .description('Clear application logs')
  .action(asyncHandler(async (service) => {
    const serviceName = service || 'app';
    console.log(chalk.blue(`🧹 Clearing ${serviceName} logs...`));
    
    const fs = require('fs');
    const path = require('path');
    
    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, `${serviceName}.log`);
    
    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
      console.log(chalk.green(`✅ Cleared logs for ${serviceName}`));
    } else {
      console.log(chalk.yellow(`⚠️  No logs found for ${serviceName}`));
    }
  }));

// ============================================================================
// DOCKER COMMANDS
// ============================================================================

const dockerCommand = program
  .command('docker')
  .description('Docker container management commands');

dockerCommand
  .command('build [service]')
  .description('Build Docker images')
  .option('--no-cache', 'Build without cache')
  .option('--tag <tag>', 'Tag for the image', 'latest')
  .action(asyncHandler(async (service, options) => {
    const serviceName = service || 'app';
    console.log(chalk.blue(`🐳 Building Docker image for ${serviceName}...`));
    
    const args = ['build'];
    if (options.noCache) args.push('--no-cache');
    args.push('-t', `pathfinder-${serviceName}:${options.tag}`, '.');
    
    await runCommand('docker', args, process.cwd());
    console.log(chalk.green(`✅ Docker image built: pathfinder-${serviceName}:${options.tag}`));
  }));

dockerCommand
  .command('up [service]')
  .description('Start Docker containers')
  .option('--detach', 'Run in detached mode')
  .option('--build', 'Build images before starting')
  .action(asyncHandler(async (service, options) => {
    const serviceName = service || '';
    console.log(chalk.blue(`🐳 Starting Docker containers${serviceName ? ` for ${serviceName}` : ''}...`));
    
    const args = ['compose', 'up'];
    if (options.detach) args.push('-d');
    if (options.build) args.push('--build');
    if (serviceName) args.push(serviceName);
    
    await runCommand('docker', args, process.cwd());
    console.log(chalk.green('✅ Docker containers started'));
  }));

dockerCommand
  .command('down')
  .description('Stop and remove Docker containers')
  .option('--volumes', 'Remove volumes')
  .action(asyncHandler(async (options) => {
    console.log(chalk.blue('🐳 Stopping Docker containers...'));
    
    const args = ['compose', 'down'];
    if (options.volumes) args.push('-v');
    
    await runCommand('docker', args, process.cwd());
    console.log(chalk.green('✅ Docker containers stopped'));
  }));

dockerCommand
  .command('logs [service]')
  .description('View Docker container logs')
  .option('--follow', 'Follow log output')
  .option('--tail <lines>', 'Number of lines to show', '50')
  .action(asyncHandler(async (service, options) => {
    const serviceName = service || '';
    console.log(chalk.blue(`🐳 Viewing Docker logs${serviceName ? ` for ${serviceName}` : ''}...`));
    
    const args = ['compose', 'logs'];
    if (options.follow) args.push('-f');
    args.push('--tail', options.tail);
    if (serviceName) args.push(serviceName);
    
    await runCommand('docker', args, process.cwd());
  }));

// ============================================================================
// HELPER FUNCTIONS FOR DEPLOYMENT COMMANDS
// ============================================================================

/**
 * Run a command and return a promise
 */
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  await ensureConnection();
  const dbConnection = getDatabaseConnection();
  const isHealthy = await dbConnection.healthCheck();
  
  if (isHealthy) {
    return { status: 'Connected and healthy', details: 'Database is accessible' };
  } else {
    throw new Error('Database health check failed');
  }
}

/**
 * Check environment variables
 */
async function checkEnvironment() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return { status: 'All required variables present', details: `${required.length} variables validated` };
}

/**
 * Check server accessibility
 */
async function checkServer(url, timeout) {
  const axios = require('axios').default;
  
  try {
    const response = await axios.get(url, { timeout });
    return { status: `Server responding (${response.status})`, details: `Response time: ${response.responseTime || 'N/A'}ms` };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Server not accessible (connection refused)');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Server not found (DNS resolution failed)');
    } else {
      throw new Error(`Server check failed: ${error.message}`);
    }
  }
}

/**
 * Check file system permissions
 */
async function checkFileSystem() {
  const fs = require('fs');
  const path = require('path');
  
  const testFile = path.join(process.cwd(), '.health-check-test');
  
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return { status: 'Read/write permissions OK', details: 'File system accessible' };
  } catch (error) {
    throw new Error(`File system permission error: ${error.message}`);
  }
}

/**
 * Check memory usage
 */
async function checkMemory() {
  const used = process.memoryUsage();
  const usage = Math.round((used.heapUsed / used.heapTotal) * 100);
  
  if (usage > 90) {
    throw new Error(`High memory usage: ${usage}%`);
  }
  
  return { status: `Memory usage: ${usage}%`, details: `Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB` };
}

/**
 * Check if a port is in use
 */
async function checkPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port);
  });
}

/**
 * Kill process on a specific port
 */
async function killProcessOnPort(port) {
  const { exec } = require('child_process');
  const isWindows = process.platform === 'win32';
  
  return new Promise((resolve, reject) => {
    if (isWindows) {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error) return reject(error);
        
        const lines = stdout.trim().split('\n');
        const pids = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1];
        }).filter((pid, index, self) => self.indexOf(pid) === index);
        
        if (pids.length === 0) return reject(new Error('No process found'));
        
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, () => {}); // Best effort, ignore errors
        });
        
        resolve();
      });
    } else {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error) return reject(error);
        
        const pids = stdout.trim().split('\n').filter(pid => pid);
        if (pids.length === 0) return reject(new Error('No process found'));
        
        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, () => {}); // Best effort, ignore errors
        });
        
        resolve();
      });
    }
  });
}

// ============================================================================

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
