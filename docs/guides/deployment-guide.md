# Pathfinder Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Pathfinder LLM Playground and Training Tool using the built-in CLI tooling. The deployment process is designed to be consistent across development, staging, and production environments.

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
   npm install
   ```

2. **Install CLI Dependencies:**
   ```bash
   # CLI dependencies should be installed automatically
   # Verify CLI is working
   node scripts/cli.js --help
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
MONGODB_URI=mongodb://localhost:27017/pathfinder-prod
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/pathfinder?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-jwt-key-256-bits-minimum
NODE_ENV=production

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
# Validate environment
pathfinder deploy validate-env

# For production environment
pathfinder deploy validate-env production --file .env.production
```

## Database Setup

### Step 1: Initialize Database Structure

```bash
# Connect and create collections/indexes
pathfinder setup init
```

### Step 2: Seed Initial Data

```bash
# Create admin user and sample data
pathfinder setup seed

# Or just create admin user
pathfinder setup seed --admin-only
```

### Step 3: Verify Database Setup

```bash
# Check database status and statistics
pathfinder db status
pathfinder db stats
```

## Development Deployment

### Local Development

```bash
# 1. Start development environment
pathfinder deploy service start --dev

# 2. Generate test data for development
pathfinder test generate --users 10 --courses 5

# 3. Monitor application
pathfinder deploy service status
pathfinder deploy logs view --follow
```

### Docker Development

```bash
# 1. Start development containers
pathfinder docker up --build

# 2. Monitor containers
pathfinder docker logs --follow

# 3. Stop when done
pathfinder docker down
```

## Production Deployment

### Method 1: Direct Node.js Deployment

#### Step 1: Prepare Production Build

```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Validate production configuration
pathfinder deploy validate-env production

# 3. Build application
pathfinder deploy build --prod

# 4. Run comprehensive health check
pathfinder deploy health
```

#### Step 2: Database Setup

```bash
# 1. Initialize production database
pathfinder setup init --force

# 2. Create admin user (use production credentials)
pathfinder setup seed --admin-only

# 3. Verify setup
pathfinder db status
pathfinder setup status
```

#### Step 3: Start Production Services

```bash
# Start services in production mode
pathfinder deploy service start

# Verify services are running
pathfinder deploy service status

# Monitor startup
pathfinder deploy logs view --follow
```

#### Step 4: Health Verification

```bash
# Comprehensive health check
pathfinder deploy health --url http://your-domain.com

# Monitor logs for issues
pathfinder deploy logs view --tail 100
```

### Method 2: Docker Production Deployment

#### Step 1: Prepare Docker Environment

```bash
# 1. Build production image
pathfinder docker build --no-cache --tag production

# 2. Update docker-compose.yml with production settings
# Edit mongodb credentials, JWT secrets, etc.
```

#### Step 2: Deploy with Docker

```bash
# 1. Start production containers
pathfinder docker up --detach

# 2. Initialize database in container
# Note: You may need to run CLI commands inside container
docker exec -it pathfinder-app node scripts/cli.js setup init
docker exec -it pathfinder-app node scripts/cli.js setup seed

# 3. Monitor deployment
pathfinder docker logs --follow
```

#### Step 3: Verify Docker Deployment

```bash
# Check container status
docker ps

# Check application health
pathfinder deploy health

# Monitor logs
pathfinder docker logs --tail 100
```

## Backup & Recovery

### Pre-Deployment Backup

```bash
# Create backup before deployment
pathfinder backup create "pre-deployment-$(date +%Y%m%d-%H%M)"

# List backups to confirm
pathfinder backup list
```

### Post-Deployment Verification

```bash
# Verify deployment success
pathfinder deploy health

# If issues occur, rollback
pathfinder backup restore pre-deployment-20250713-1430
```

### Regular Backup Schedule

```bash
# Create scheduled backup (add to cron/scheduler)
pathfinder backup create "scheduled-$(date +%Y%m%d)"

# Clean old backups (keep last 7 days)
pathfinder backup list
# Manually delete old backups with:
# pathfinder backup delete old-backup-name
```

## Monitoring & Maintenance

### Health Monitoring

```bash
# Regular health checks (add to monitoring system)
pathfinder deploy health

# Check service status
pathfinder deploy service status

# Database health
pathfinder db status
```

### Log Management

```bash
# View recent logs
pathfinder deploy logs view --tail 100

# Follow logs in real-time
pathfinder deploy logs view --follow

# Clear logs when they get large
pathfinder deploy logs clear
```

### Performance Monitoring

```bash
# Database statistics
pathfinder db stats

# Service status
pathfinder deploy service status

# System health
pathfinder deploy health
```

## Scaling & Load Management

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer Setup:**
   - Configure nginx/Apache load balancer
   - Use multiple application instances
   - Implement session persistence

2. **Database Scaling:**
   - Use MongoDB Atlas for automatic scaling
   - Implement read replicas for read-heavy workloads
   - Consider sharding for very large datasets

3. **Monitoring Multiple Instances:**
   ```bash
   # Check each instance health
   pathfinder deploy health --url http://instance1.domain.com
   pathfinder deploy health --url http://instance2.domain.com
   ```

### Performance Optimization

```bash
# Monitor database performance
pathfinder db stats

# Optimize with indexes (done automatically by setup)
pathfinder setup init

# Clean up old data periodically
pathfinder clean conversations  # Removes old conversations
```

## Security Hardening

### Environment Security

1. **Secure Environment Variables:**
   ```bash
   # Validate all required security settings
   pathfinder deploy validate-env production
   
   # Ensure strong passwords and secrets
   # JWT_SECRET should be 256+ bits
   # Database passwords should be complex
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
   - Only expose necessary ports (80, 443)
   - Restrict database access to application servers
   - Use VPC/private networks when possible

2. **Monitoring:**
   ```bash
   # Monitor for security issues in logs
   pathfinder deploy logs view | grep -i error
   pathfinder deploy logs view | grep -i warn
   ```

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Failed:**
   ```bash
   # Check database connectivity
   pathfinder db status
   
   # Verify connection string
   pathfinder deploy validate-env
   
   # Test with simple connection
   node -e "require('./src/config/database').initializeDatabase().then(() => console.log('OK'))"
   ```

2. **Port Already in Use:**
   ```bash
   # Check what's running on ports
   pathfinder deploy service status
   
   # Stop services
   pathfinder deploy service stop
   
   # Start again
   pathfinder deploy service start
   ```

3. **Health Check Failures:**
   ```bash
   # Run detailed health check
   pathfinder deploy health
   
   # Check individual components
   pathfinder db status
   pathfinder deploy validate-env
   pathfinder deploy service status
   ```

4. **Memory/Performance Issues:**
   ```bash
   # Check system resources
   pathfinder deploy health
   
   # Monitor logs for memory issues
   pathfinder deploy logs view | grep -i memory
   
   # Database performance
   pathfinder db stats
   ```

### Emergency Procedures

1. **Service Restart:**
   ```bash
   # Quick service restart
   pathfinder deploy service stop
   pathfinder deploy service start
   
   # With health verification
   pathfinder deploy health
   ```

2. **Database Issues:**
   ```bash
   # Create emergency backup
   pathfinder backup create "emergency-$(date +%Y%m%d-%H%M)"
   
   # Reset database if corrupted
   pathfinder test reset
   pathfinder setup seed
   ```

3. **Rollback Deployment:**
   ```bash
   # List available backups
   pathfinder backup list
   
   # Restore from backup
   pathfinder backup restore pre-deployment-20250713
   
   # Restart services
   pathfinder deploy service start
   ```

## Automation & CI/CD Integration

### Automated Deployment Script

Create a deployment script that uses the CLI:

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "Starting Pathfinder deployment..."

# Validate environment
echo "Validating environment..."
pathfinder deploy validate-env production

# Create backup
echo "Creating backup..."
BACKUP_NAME="pre-deployment-$(date +%Y%m%d-%H%M)"
pathfinder backup create "$BACKUP_NAME"

# Build application
echo "Building application..."
pathfinder deploy build --prod

# Stop services
echo "Stopping services..."
pathfinder deploy service stop

# Start services
echo "Starting services..."
pathfinder deploy service start

# Health check
echo "Performing health check..."
sleep 10  # Wait for startup
pathfinder deploy health

echo "Deployment completed successfully!"
echo "Backup created: $BACKUP_NAME"
```

### CI/CD Pipeline Integration

Example GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy Pathfinder

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate environment
        run: pathfinder deploy validate-env production
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          
      - name: Build application
        run: pathfinder deploy build --prod
        
      - name: Deploy to production
        run: ./deploy.sh
        env:
          NODE_ENV: production
```

## Best Practices Summary

### Development
- Use CLI for consistent database management
- Generate test data with CLI tools
- Regular backups before major changes
- Monitor logs during development

### Staging
- Mirror production configuration
- Use production-like data volumes
- Test deployment procedures
- Validate health checks

### Production
- Always create backups before deployment
- Use environment-specific configurations
- Monitor health continuously
- Implement automated alerts
- Regular security updates
- Log rotation and cleanup

### Operations
- Document all CLI commands used
- Automate repetitive tasks
- Monitor resource usage
- Plan for scaling
- Regular backup testing
- Disaster recovery procedures

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2025-07-13  
**CLI Version Required:** 2.0.0+
