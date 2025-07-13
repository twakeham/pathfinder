# Pathfinder Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Pathfinder LLM Playground and Training Tool using the modern monorepo architecture with built-in CLI tooling and npm scripts. The deployment process is designed to be consistent across development, staging, and production environments.

## Architecture Overview

Pathfinder is structured as a monorepo with:
- **Backend**: Express.js server in the root directory (`src/`)
- **Frontend**: React.js application in the `client/` directory
- **CLI Tools**: Comprehensive CLI tooling in `scripts/cli.js`
- **Development Tools**: ESLint, Prettier, concurrently, nodemon, and build tools

## Prerequisites

### System Requirements

**Development Environment:**
- Node.js 18+ 
- MongoDB 4.4+ (local or Atlas)
- Git
- npm 8+

**Production Environment:**
- Node.js 18+
- MongoDB 4.4+ (preferably Atlas or dedicated server)
- Docker & Docker Compose (optional)
- Reverse proxy (nginx/Apache)
- SSL certificates
- Process manager (PM2 recommended)

### Initial Setup

1. **Clone and Install Dependencies:**
   ```bash
   git clone <repository-url> pathfinder
   cd pathfinder
   
   # Install all dependencies (backend + frontend)
   npm run install:all
   ```

2. **Verify Installation:**
   ```bash
   # Verify CLI is working
   npm run pathfinder -- --help
   
   # Or use the CLI directly
   node scripts/cli.js --help
   
   # Verify environment validation
   npm run validate:env
   ```

## Environment Configuration

### Step 1: Create Environment Files

```bash
# Copy the example environment file
cp .env.example .env

# For production, create a separate file
cp .env.example .env.production
```

### Step 2: Configure Environment Variables

Edit your `.env` or `.env.production` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pathfinder-dev
# For production Atlas: mongodb+srv://username:password@cluster.mongodb.net/pathfinder?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-jwt-key-256-bits-minimum
NODE_ENV=development  # or production

# Application
PORT=3000

# Admin User (will be created on first setup)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=SecurePassword123!

# AI Integration (optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Email Configuration (optional)
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourcompany.com
EMAIL_PASS=your-email-password
```

### Step 3: Validate Configuration

```bash
# Validate environment variables
npm run validate:env

# Generate .env file from template
npm run generate:env

# For production environment validation
npm run deploy:validate

# Or use CLI directly
node scripts/cli.js deploy validate-env production --file .env.production
```

## Database Setup

### Step 1: Initialize Database Structure

```bash
# Using npm scripts (recommended)
npm run db:init

# Or using CLI directly
node scripts/cli.js setup init
```

### Step 2: Seed Initial Data

```bash
# Create admin user and sample data
npm run db:seed

# Or just create admin user
node scripts/cli.js setup seed --admin-only

# For development, reset and reseed
npm run db:reset
npm run db:seed
```

### Step 3: Verify Database Setup

```bash
# Check database status and statistics
npm run db:status

# Or using CLI directly
node scripts/cli.js db status
node scripts/cli.js db stats
```

## Development Deployment

### Local Development

**Option 1: Full Development Environment (Recommended)**
```bash
# Start both backend and frontend in development mode
npm run dev:all

# This runs:
# - Backend server with nodemon on http://localhost:3000
# - Frontend dev server with Vite on http://localhost:5173
# - Frontend proxies API calls to backend automatically
```

**Option 2: Individual Services**
```bash
# Start backend only
npm run dev:server

# Start frontend only (in separate terminal)
npm run dev:client

# Start backend with basic node
npm start
```

**Development Workflow:**
```bash
# 1. Install dependencies
npm run install:all

# 2. Set up environment
cp .env.example .env
npm run validate:env

# 3. Initialize database
npm run db:init
npm run db:seed

# 4. Start development
npm run dev:all

# 5. Generate test data for development
node scripts/cli.js test generate --users 10 --courses 5

# 6. Monitor application
npm run deploy:status
npm run logs:follow
```

### Code Quality in Development

```bash
# Run linting
npm run lint:all

# Fix linting issues
npm run quality:fix

# Format code
npm run format:all

# Check formatting
npm run format:check

# Run full quality check
npm run quality
```

### Docker Development

```bash
# 1. Start development containers
npm run docker:up

# 2. Monitor containers
npm run logs:follow

# 3. Stop when done
npm run docker:down

# Or using CLI directly
node scripts/cli.js docker up --build
node scripts/cli.js docker logs --follow
node scripts/cli.js docker down
```

## Production Deployment

### Method 1: Direct Node.js Deployment

#### Step 1: Prepare Production Build

```bash
# 1. Set production environment
export NODE_ENV=production  # Linux/Mac
# or
$env:NODE_ENV="production"  # Windows PowerShell

# 2. Install all dependencies
npm run install:all

# 3. Validate production configuration
npm run deploy:validate

# 4. Run quality checks and tests
npm run quality
npm test

# 5. Build application (frontend + backend)
npm run build:prod

# This automatically:
# - Runs quality checks and tests (prebuild:prod)
# - Builds the frontend React app
# - Prepares backend for production
# - Shows success message (postbuild:prod)

# 6. Run comprehensive health check
npm run deploy:health
```

#### Step 2: Database Setup

```bash
# 1. Initialize production database
npm run db:init

# 2. Create admin user (use production credentials)
npm run db:seed

# 3. Verify setup
npm run db:status
node scripts/cli.js setup status
```

#### Step 3: Start Production Services

```bash
# Start services in production mode
npm run deploy:start

# Verify services are running
npm run deploy:status

# Monitor startup
npm run logs:follow
```

#### Step 4: Health Verification

```bash
# Comprehensive health check
npm run deploy:health

# Monitor logs for issues
npm run logs:view
```

### Method 2: Docker Production Deployment

#### Step 1: Prepare Docker Environment

```bash
# 1. Build production image
npm run docker:build

# 2. Update docker-compose.yml with production settings
# Edit mongodb credentials, JWT secrets, etc.
```

#### Step 2: Deploy with Docker

```bash
# 1. Start production containers
npm run docker:up

# 2. Initialize database in container
# Note: You may need to run CLI commands inside container
docker exec -it pathfinder-app npm run db:init
docker exec -it pathfinder-app npm run db:seed

# 3. Monitor deployment
npm run logs:follow
```

#### Step 3: Verify Docker Deployment

```bash
# Check container status
docker ps

# Check application health
npm run deploy:health

# Monitor logs
docker logs pathfinder-app
```

### Method 3: PM2 Production Deployment (Recommended)

#### Step 1: Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pathfinder-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
```

#### Step 2: Deploy with PM2

```bash
# 1. Build for production
npm run build:prod

# 2. Start with PM2
pm2 start ecosystem.config.js --env production

# 3. Save PM2 configuration
pm2 save
pm2 startup

# 4. Monitor with PM2
pm2 status
pm2 logs
pm2 monit
```

## Backup & Recovery

### Pre-Deployment Backup

```bash
# Create backup before deployment
node scripts/cli.js backup create "pre-deployment-$(date +%Y%m%d-%H%M)"

# List backups to confirm
node scripts/cli.js backup list
```

### Post-Deployment Verification

```bash
# Verify deployment success
npm run deploy:health

# If issues occur, rollback
node scripts/cli.js backup restore pre-deployment-20250713-1430
```

### Regular Backup Schedule

```bash
# Create scheduled backup (add to cron/scheduler)
node scripts/cli.js backup create "scheduled-$(date +%Y%m%d)"

# Clean old backups (keep last 7 days)
node scripts/cli.js backup list
# Manually delete old backups with:
# node scripts/cli.js backup delete old-backup-name
```

## Monitoring & Maintenance

### Health Monitoring

```bash
# Regular health checks (add to monitoring system)
npm run deploy:health

# Check service status
npm run deploy:status

# Database health
npm run db:status

# Or using CLI directly
node scripts/cli.js deploy health
node scripts/cli.js deploy service status
node scripts/cli.js db status
```

### Log Management

```bash
# View recent logs
npm run logs:view

# Follow logs in real-time
npm run logs:follow

# Clear logs when they get large
node scripts/cli.js deploy logs clear

# For PM2 deployments
pm2 logs
pm2 flush  # Clear logs
```

### Performance Monitoring

```bash
# Database statistics
node scripts/cli.js db stats

# Service status
npm run deploy:status

# System health
npm run deploy:health

# For PM2 deployments
pm2 status
pm2 monit
```

### Code Quality Monitoring

```bash
# Regular code quality checks
npm run quality

# Update dependencies
npm run update:all

# Clean build artifacts
npm run clean

# Full cleanup (including node_modules)
npm run clean:all
```

## Scaling & Load Management

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer Setup:**
   - Configure nginx/Apache load balancer
   - Use multiple application instances with PM2 cluster mode
   - Implement session persistence

2. **Database Scaling:**
   - Use MongoDB Atlas for automatic scaling
   - Implement read replicas for read-heavy workloads
   - Consider sharding for very large datasets

3. **Monitoring Multiple Instances:**
   ```bash
   # Check each instance health
   npm run deploy:health
   
   # With PM2 cluster mode
   pm2 status
   pm2 scale pathfinder-api 4  # Scale to 4 instances
   
   # Check individual instance health
   node scripts/cli.js deploy health --url http://instance1.domain.com
   node scripts/cli.js deploy health --url http://instance2.domain.com
   ```

### Performance Optimization

```bash
# Monitor database performance
npm run db:status
node scripts/cli.js db stats

# Optimize with indexes (done automatically by setup)
npm run db:init

# Clean up old data periodically
node scripts/cli.js clean conversations  # Removes old conversations

# Frontend optimization
npm run build:prod  # Includes React optimizations

# Monitor build performance
npm run build:all  # Check build times
```

## Security Hardening

### Environment Security

1. **Secure Environment Variables:**
   ```bash
   # Validate all required security settings
   npm run deploy:validate
   
   # Ensure strong passwords and secrets
   # JWT_SECRET should be 256+ bits
   # Database passwords should be complex
   
   # Generate secure environment template
   npm run generate:env
   ```

2. **Database Security:**
   ```bash
   # Use authentication
   MONGODB_URI=mongodb://username:password@host:port/database
   
   # Use TLS/SSL for connections
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?ssl=true
   ```

### Application Security

1. **HTTPS Configuration:**
   - Use reverse proxy (nginx) for SSL termination
   - Redirect HTTP to HTTPS
   - Use strong SSL ciphers

2. **Access Control:**
   - Change default admin password immediately
   - Implement proper user roles
   - Regular security audits

### Network Security

1. **Firewall Configuration:**
   - Only expose necessary ports (80, 443, 3000 for development)
   - Restrict database access to application servers
   - Use VPC/private networks when possible

2. **Frontend Security:**
   - React build process includes security optimizations
   - Vite dev server includes CORS handling
   - API proxy configuration for secure development

3. **Monitoring:**
   ```bash
   # Monitor for security issues in logs
   npm run logs:view | grep -i error
   npm run logs:view | grep -i warn
   
   # For PM2 deployments
   pm2 logs | grep -i error
   ```

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Failed:**
   ```bash
   # Check database connectivity
   npm run db:status
   
   # Verify connection string
   npm run validate:env
   
   # Test with simple connection
   node -e "require('./src/config/database').initializeDatabase().then(() => console.log('OK'))"
   ```

2. **Port Already in Use:**
   ```bash
   # Check what's running on ports
   npm run deploy:status
   
   # Stop services
   npm run deploy:stop
   
   # For PM2
   pm2 stop all
   
   # Start again
   npm run deploy:start
   ```

3. **Frontend Build Issues:**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build:prod
   
   # Check individual builds
   npm run build:client
   npm run build:server
   
   # Verify frontend dependencies
   cd client && npm install
   ```

4. **Health Check Failures:**
   ```bash
   # Run detailed health check
   npm run deploy:health
   
   # Check individual components
   npm run db:status
   npm run validate:env
   npm run deploy:status
   ```

5. **Memory/Performance Issues:**
   ```bash
   # Check system resources
   npm run deploy:health
   
   # Monitor logs for memory issues
   npm run logs:view | grep -i memory
   
   # Database performance
   npm run db:status
   
   # For PM2 deployments
   pm2 monit
   pm2 logs --err
   ```

6. **Code Quality Issues:**
   ```bash
   # Run quality checks
   npm run quality
   
   # Fix common issues
   npm run quality:fix
   
   # Check linting
   npm run lint:all
   ```

### Emergency Procedures

1. **Service Restart:**
   ```bash
   # Quick service restart
   npm run deploy:stop
   npm run deploy:start
   
   # With health verification
   npm run deploy:health
   
   # For PM2 deployments
   pm2 restart pathfinder-api
   pm2 status
   ```

2. **Database Issues:**
   ```bash
   # Create emergency backup
   node scripts/cli.js backup create "emergency-$(date +%Y%m%d-%H%M)"
   
   # Reset database if corrupted
   npm run db:reset
   npm run db:seed
   ```

3. **Rollback Deployment:**
   ```bash
   # List available backups
   node scripts/cli.js backup list
   
   # Restore from backup
   node scripts/cli.js backup restore pre-deployment-20250713
   
   # Restart services
   npm run deploy:start
   
   # For PM2
   pm2 restart all
   ```

4. **Frontend Issues:**
   ```bash
   # Serve static build directly
   cd client/dist && python -m http.server 5173
   
   # Or rebuild frontend
   npm run clean
   npm run build:client
   ```

## Automation & CI/CD Integration

### Automated Deployment Script

Create a deployment script that uses the npm scripts:

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "Starting Pathfinder deployment..."

# Install dependencies
echo "Installing dependencies..."
npm run install:all

# Validate environment
echo "Validating environment..."
npm run validate:env

# Create backup
echo "Creating backup..."
BACKUP_NAME="pre-deployment-$(date +%Y%m%d-%H%M)"
node scripts/cli.js backup create "$BACKUP_NAME"

# Run quality checks
echo "Running quality checks..."
npm run quality

# Build application
echo "Building application..."
npm run build:prod

# Stop services
echo "Stopping services..."
npm run deploy:stop 2>/dev/null || true

# Start services
echo "Starting services..."
npm run deploy:start

# Health check
echo "Performing health check..."
sleep 10  # Wait for startup
npm run deploy:health

echo "Deployment completed successfully!"
echo "Backup created: $BACKUP_NAME"
```

### PowerShell Deployment Script (Windows)

```powershell
# deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "Starting Pathfinder deployment..." -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install:all

# Validate environment
Write-Host "Validating environment..." -ForegroundColor Yellow
npm run validate:env

# Create backup
Write-Host "Creating backup..." -ForegroundColor Yellow
$backupName = "pre-deployment-$(Get-Date -Format 'yyyyMMdd-HHmm')"
node scripts/cli.js backup create $backupName

# Run quality checks
Write-Host "Running quality checks..." -ForegroundColor Yellow
npm run quality

# Build application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build:prod

# Stop services
Write-Host "Stopping services..." -ForegroundColor Yellow
try { npm run deploy:stop } catch { }

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
npm run deploy:start

# Health check
Write-Host "Performing health check..." -ForegroundColor Yellow
Start-Sleep 10  # Wait for startup
npm run deploy:health

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Backup created: $backupName" -ForegroundColor Green
```

### CI/CD Pipeline Integration

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy Pathfinder

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm run install:all
        
      - name: Validate environment
        run: npm run validate:env
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          
      - name: Run quality checks
        run: npm run quality
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build:prod

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Deploy to production
        run: ./deploy.sh
        env:
          NODE_ENV: production
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

**Docker-based CI/CD:**

```yaml
# .github/workflows/docker-deploy.yml
name: Docker Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          npm run docker:build
          
      - name: Deploy with Docker
        run: |
          npm run docker:up
          
      - name: Health check
        run: |
          sleep 30
          npm run deploy:health
```

## Best Practices Summary

### Development
- Use `npm run dev:all` for full-stack development
- Run `npm run quality` before committing code
- Generate test data with CLI tools: `node scripts/cli.js test generate`
- Regular backups before major changes
- Monitor logs during development with `npm run logs:follow`
- Use `npm run validate:env` to ensure environment is correct

### Staging
- Mirror production configuration exactly
- Use production-like data volumes
- Test deployment procedures with `npm run build:prod`
- Validate health checks with `npm run deploy:health`
- Use separate staging environment variables

### Production
- Always create backups before deployment
- Use environment-specific configurations (`.env.production`)
- Monitor health continuously with automated checks
- Implement automated alerts for failures
- Regular security updates with `npm run update:all`
- Log rotation and cleanup
- Use PM2 for process management in production

### Operations
- Document all commands used (npm scripts + CLI)
- Automate repetitive tasks with deployment scripts
- Monitor resource usage with `pm2 monit` or similar
- Plan for scaling with PM2 cluster mode
- Regular backup testing
- Disaster recovery procedures with backup/restore

### Code Quality
- Use `npm run quality:fix` to automatically fix common issues
- Run `npm run lint:all` for comprehensive linting
- Use `npm run format:all` for consistent code formatting
- Include quality gates in CI/CD pipelines
- Regular dependency updates with `npm run update:all`

### Monorepo Management
- Use `npm run install:all` for full dependency installation
- Build both frontend and backend with `npm run build:prod`
- Clean build artifacts with `npm run clean`
- Monitor both services in development with `npm run dev:all`
- Separate linting for frontend and backend

---

**Deployment Guide Version:** 2.0  
**Last Updated:** 2025-01-27  
**CLI Version Required:** 2.0.0+  
**Node.js Version Required:** 18+  
**Architecture:** Monorepo (React + Express.js)
