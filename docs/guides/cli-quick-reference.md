# Pathfinder CLI - Quick Reference

## Essential Commands

### Database Management
```bash
pathfinder db status              # Check database connection
pathfinder db stats               # Database statistics
pathfinder setup init             # Initialize database
pathfinder setup seed             # Seed initial data
```

### Deployment Operations
```bash
pathfinder deploy validate-env    # Validate environment config
pathfinder deploy build --prod    # Build for production
pathfinder deploy health          # System health check
pathfinder deploy service start   # Start all services
pathfinder deploy service stop    # Stop all services
pathfinder deploy service status  # Check service status
```

### Docker Operations
```bash
pathfinder docker build           # Build Docker image
pathfinder docker up --detach     # Start containers (background)
pathfinder docker down            # Stop containers
pathfinder docker logs --follow   # Follow container logs
```

### Log Management
```bash
pathfinder deploy logs view       # View application logs
pathfinder deploy logs view --follow  # Follow logs real-time
pathfinder deploy logs clear      # Clear logs
```

### Development & Testing
```bash
pathfinder test reset             # Reset database completely
pathfinder test generate          # Generate test data
pathfinder test clean             # Clean test data
pathfinder backup create name     # Create backup
pathfinder backup restore name    # Restore backup
```

## NPM Script Shortcuts

### Quick Access
```bash
npm run deploy:validate          # Environment validation
npm run deploy:build             # Production build
npm run deploy:health            # Health check
npm run deploy:start             # Start services
npm run deploy:stop              # Stop services
npm run docker:up                # Start Docker
npm run docker:down              # Stop Docker
npm run logs:follow              # Follow logs
```

### Database Operations
```bash
npm run db:status                 # Database status
npm run db:init                   # Initialize database
npm run db:seed                   # Seed data
npm run db:reset                  # Reset database
```

## Common Workflows

### Development Setup
```bash
# 1. Setup environment
cp .env.example .env
npm run deploy:validate

# 2. Initialize database  
npm run db:init
npm run db:seed

# 3. Start development
npm run deploy:start --dev
npm run logs:follow
```

### Production Deployment
```bash
# 1. Pre-deployment
npm run pathfinder -- backup create pre-deploy
npm run deploy:validate

# 2. Build & deploy
npm run deploy:build
npm run deploy:start

# 3. Verify
npm run deploy:health
npm run deploy:status
```

### Docker Development
```bash
# Start containers
npm run docker:up

# Monitor
npm run pathfinder -- docker logs --follow

# Stop
npm run docker:down
```

### Troubleshooting
```bash
# Check system health
npm run deploy:health

# View recent logs
npm run pathfinder -- deploy logs view --tail 100

# Check services
npm run deploy:status

# Database diagnostics
npm run db:status
npm run db:stats
```

## Emergency Procedures

### Service Issues
```bash
# Restart services
npm run deploy:stop
npm run deploy:start

# Check logs for errors
npm run logs:view | grep -i error
```

### Database Issues
```bash
# Create emergency backup
npm run pathfinder -- backup create emergency-$(date +%Y%m%d)

# Reset if needed
npm run db:reset
```

### Rollback Deployment
```bash
# List backups
npm run pathfinder -- backup list

# Restore previous state  
npm run pathfinder -- backup restore backup-name

# Restart services
npm run deploy:start
```

## Help & Examples

```bash
pathfinder --help                 # Main help
pathfinder [command] --help       # Command help
pathfinder examples               # Usage examples
```

---
*Quick Reference v1.0 - 2025-07-13*
