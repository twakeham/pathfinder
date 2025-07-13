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

### Code Quality & Development Workflow
```bash
# Linting and formatting
npm run lint                      # Lint backend code
npm run lint:fix                  # Fix linting issues automatically
npm run lint:client              # Lint frontend code
npm run lint:all                  # Lint both backend and frontend

# Code formatting
npm run format                    # Format backend code
npm run format:check              # Check formatting without fixing
npm run format:client             # Format frontend code
npm run format:all                # Format both backend and frontend

# Quality checks
npm run quality                   # Run lint + format check
npm run quality:fix               # Fix all quality issues

# Environment validation
npm run validate:env              # Validate environment variables
npm run generate:env              # Generate secure environment defaults
```

### Build & Development
```bash
# Development servers
npm run dev                       # Start backend only
npm run dev:server                # Start backend with nodemon
npm run dev:client                # Start frontend only
npm run dev:all                   # Start both frontend and backend concurrently

# Building
npm run build                     # Build frontend for production
npm run build:client             # Build frontend only
npm run build:server             # Prepare server for production
npm run build:all                # Build both frontend and backend
npm run build:prod               # Full production build with quality checks

# Cleanup
npm run clean                     # Clean build artifacts and logs
npm run clean:all                 # Clean everything including node_modules
npm run install:all               # Install dependencies for both projects
npm run update:all                # Update dependencies for both projects
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
npm run validate:env

# 2. Initialize database  
npm run db:init
npm run db:seed

# 3. Start development (concurrent frontend + backend)
npm run dev:all

# 4. Monitor in separate terminal
npm run logs:follow
```

### Code Quality Workflow
```bash
# Check code quality
npm run quality

# Fix issues automatically
npm run quality:fix

# Before committing
npm run lint:all
npm run format:all
npm test
```

### Production Deployment
```bash
# 1. Pre-deployment checks
npm run pathfinder -- backup create pre-deploy
npm run validate:env
npm run quality
npm test

# 2. Build for production (includes quality checks)
npm run build:prod

# 3. Deploy and start
npm run deploy:start

# 4. Verify deployment
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

### Development Issues
```bash
# Check concurrent development
npm run dev:all

# If nodemon issues
npm run clean
npm run install:all

# Check code quality
npm run quality

# Reset development environment
npm run clean:all
npm run install:all
npm run db:reset
npm run db:seed
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
