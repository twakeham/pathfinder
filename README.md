# Pathfinder - LLM Playground and Training Tool

A comprehensive educational platform for AI training and interactive learning with large language models.

## 🚀 Features

- **Interactive LLM Playground**: Real-time chat interface with AI models
- **Training Content Management**: Structured courses, modules, and lessons
- **User Management**: Role-based access control (Admin, Instructor, User)
- **Prompt Template Library**: Reusable prompt templates for various use cases
- **Analytics & Progress Tracking**: User learning progress and usage analytics
- **Real-time Communication**: WebSocket-based chat functionality
- **Comprehensive CLI Tooling**: Database management, deployment, and development tools
- **Modern Frontend**: React with Vite build system and Material-UI components
- **Code Quality**: Integrated ESLint, Prettier, and automated quality checks

## 🏗️ Architecture

- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React with Vite, Material-UI, and TypeScript support
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT-based with role-based access control
- **Development**: Concurrently managed dev servers with hot reload
- **Build System**: Production-optimized builds with code quality gates
- **Deployment**: Docker support with production configurations

## 📋 Prerequisites

- **Node.js** 18+ 
- **MongoDB** 4.4+ (local installation or MongoDB Atlas)
- **npm** 8+
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-username/pathfinder.git
cd pathfinder

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# MONGODB_URI=mongodb://localhost:27017/pathfinder-dev
# JWT_SECRET=your-super-secure-secret-key-here
```

### 3. Database Setup

```bash
# Validate environment configuration
npm run deploy:validate

# Initialize database structure
npm run db:init

# Seed with initial data (creates admin user)
npm run db:seed
```

### 4. Start Development

```bash
# Option A: Start both backend and frontend simultaneously
npm run dev:all

# Option B: Start individually
npm run dev           # Backend only on http://localhost:3000
npm run dev:client    # Frontend only on http://localhost:5173

# Check system status
npm run deploy:status
```

### 5. Access Application

- **Frontend**: http://localhost:5173 (React dev server)
- **Backend API**: http://localhost:3000 (Express server)
- **Default Admin**: admin@pathfinder.local / PathfinderAdmin2025!

## 🛠️ Development Scripts

### Core Development
```bash
# Start development servers
npm run dev:all        # Both backend and frontend with hot reload
npm run dev             # Backend only (alias for dev:server)
npm run dev:server      # Backend with nodemon hot reload
npm run dev:client      # Frontend with Vite dev server

# Building applications
npm run build           # Build frontend only
npm run build:all       # Build both backend and frontend
npm run build:prod      # Production build with quality checks
```

### Code Quality
```bash
# Linting
npm run lint            # Lint backend code
npm run lint:client     # Lint frontend code  
npm run lint:all        # Lint both backend and frontend
npm run lint:fix        # Auto-fix linting issues

# Formatting
npm run format          # Format backend code with Prettier
npm run format:client   # Format frontend code
npm run format:all      # Format all code
npm run format:check    # Check formatting without changes

# Quality gates
npm run quality         # Run lint + format check
npm run quality:fix     # Fix all quality issues
```

### Testing
```bash
npm test                # Run test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Dependency Management
```bash
npm run install:all     # Install all dependencies (backend + frontend)
npm run update:all      # Update all dependencies
npm run clean           # Clean build artifacts
npm run clean:all       # Clean everything including node_modules
```

## 🛠️ CLI Tool

The project includes a comprehensive CLI tool accessible via `npm run pathfinder` or the `pathfinder` command:

### Database Operations
```bash
npm run db:status       # Check database connection and health
npm run db:init         # Initialize database schema
npm run db:seed         # Seed with initial data
npm run db:reset        # Reset database (clear all data)

# Advanced database operations
npm run pathfinder db stats              # Database statistics  
npm run pathfinder setup migrate         # Run database migrations
npm run pathfinder test generate --users 5  # Generate test data
```

### Deployment & Services
```bash
npm run deploy:validate # Validate environment configuration
npm run deploy:health   # System health check
npm run deploy:build    # Production build
npm run deploy:start    # Start application services
npm run deploy:stop     # Stop application services
npm run deploy:status   # Check service status
```

### Docker Operations
```bash
npm run docker:build    # Build Docker images
npm run docker:up       # Start containers (detached)
npm run docker:down     # Stop and remove containers

# Advanced Docker operations
npm run pathfinder docker logs --follow  # Follow container logs
npm run pathfinder docker clean          # Clean unused images
```

### Logging & Monitoring
```bash
npm run logs:view       # View application logs
npm run logs:follow     # Follow logs in real-time

# Advanced logging
npm run pathfinder deploy logs view --lines 100  # View last 100 lines
npm run pathfinder deploy logs clear             # Clear log files
```

### Development Utilities
```bash
# Environment validation
npm run validate:env    # Validate current environment
npm run generate:env    # Generate .env template

# Test data management
npm run pathfinder test reset                    # Reset test data
npm run pathfinder test generate --users 10     # Generate test users
npm run pathfinder test clean                   # Clean test artifacts

# Backup operations
npm run pathfinder backup create my-backup      # Create backup
npm run pathfinder backup restore my-backup     # Restore backup
npm run pathfinder backup list                  # List backups
```

## 📁 Project Structure

```
pathfinder/
├── src/                          # Backend source code
│   ├── config/                   # Database and app configuration
│   │   ├── config.js            # Centralized configuration
│   │   ├── database.js          # MongoDB connection manager
│   │   ├── databaseInit.js      # Database initialization
│   │   ├── databaseSeed.js      # Database seeding
│   │   └── validateEnv.js       # Environment validation
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Express middleware
│   ├── models/                   # Database models (Mongoose)
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic services
│   └── websocket/               # WebSocket handlers
├── client/                       # React frontend application
│   ├── src/                     # Frontend source code
│   │   ├── components/          # React components
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   └── LoginPage.jsx    # Authentication
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── utils/               # Frontend utilities
│   │   │   └── apiClient.js     # API client
│   │   ├── assets/              # Static assets
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Application entry point
│   ├── public/                  # Public assets
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   └── index.html               # HTML template
├── scripts/                      # CLI tools and utilities
│   └── cli.js                   # Main CLI tool (pathfinder command)
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── docs/                         # Documentation
│   ├── api/                     # API documentation
│   ├── guides/                  # User guides and tutorials
│   │   ├── cli-tool-documentation.md
│   │   ├── cli-quick-reference.md
│   │   └── deployment-guide.md
│   └── mvp/                     # MVP-specific documentation
│       ├── mvp-tasks.md         # Task tracking
│       ├── mvp-implementation-log.md
│       └── database-setup-as-built.md
├── config/                       # Environment configurations
│   ├── development/             # Development configs
│   └── production/              # Production configs
├── .env.example                 # Environment template
├── .env.development             # Development environment
├── .env.production              # Production environment
├── eslint.config.js             # ESLint configuration
├── .prettierrc.json             # Prettier configuration
├── nodemon.json                 # Nodemon configuration
├── docker-compose.yml           # Production Docker config
├── docker-compose.dev.yml       # Development Docker config
├── Dockerfile                   # Application container
├── package.json                 # Backend dependencies & scripts
└── README.md                    # This file
```

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start development environment with Docker
npm run docker:up

# Monitor container logs
npm run pathfinder docker logs --follow

# Check container status
npm run pathfinder docker status

# Stop when done
npm run docker:down
```

### Production Deployment

```bash
# Build production images
npm run docker:build --no-cache

# Deploy with production configuration
docker-compose up -d

# Verify deployment
npm run deploy:health

# Monitor production logs
npm run pathfinder docker logs --follow --service web
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Watch mode for development
npm run test:watch

# Coverage reporting
npm run test:coverage

# Specific test patterns
npm test -- --testNamePattern="User"
npm test -- src/models/User.test.js
```

### Test Data Management
```bash
# Reset test database
npm run pathfinder test reset

# Generate test data
npm run pathfinder test generate --users 10 --courses 5

# Clean test artifacts
npm run pathfinder test clean

# Database statistics for testing
npm run pathfinder db stats
```

## 📊 Database Schema

The application uses a comprehensive MongoDB schema with 10 collections:

- **users** - User accounts and profiles
- **courses** - Course content structure  
- **modules** - Course modules/sections
- **lessons** - Individual lessons
- **conversations** - Chat conversations and history
- **prompttemplates** - Prompt template library
- **userprogress** - User learning progress tracking
- **analytics** - Usage analytics and events
- **invitations** - User invitation system
- **departments** - Organizational departments

## 🔧 Development Workflow

### Initial Setup
```bash
# 1. Install all dependencies
npm run install:all

# 2. Environment validation
npm run validate:env

# 3. Database initialization  
npm run db:init
npm run db:seed

# 4. Code quality check
npm run quality

# 5. Health verification
npm run deploy:health
```

### Daily Development Cycle
```bash
# Start development (both frontend and backend)
npm run dev:all

# In separate terminals (optional):
npm run logs:follow     # Monitor logs
npm run deploy:status   # Check system status

# Code quality during development
npm run quality:fix     # Fix linting and formatting issues
npm test               # Run tests
```

### Frontend Development
```bash
# Frontend-only development
npm run dev:client      # Start Vite dev server (http://localhost:5173)

# Frontend-specific operations
cd client
npm run dev             # Alternative: direct Vite dev
npm run build           # Build frontend
npm run lint            # Lint frontend code
npm run preview         # Preview built frontend
```

### Backend Development  
```bash
# Backend-only development
npm run dev:server      # Start Express server with nodemon

# Backend-specific operations
npm run lint            # Lint backend code
npm run format          # Format backend code
npm test               # Run backend tests
```

### Before Committing
```bash
# Quality gate (required before commits)
npm run quality         # Lint + format check
npm test               # Run test suite
npm run build:prod      # Test production build

# If issues found, fix them:
npm run quality:fix     # Auto-fix quality issues
```

### Testing Workflow
```bash
# Generate fresh test data
npm run pathfinder test reset
npm run pathfinder test generate --users 10

# Run tests
npm test                # Unit tests
npm run test:coverage   # With coverage
npm run test:watch      # Watch mode for TDD

# Clean test artifacts
npm run pathfinder test clean
```

### Production Deployment Preparation
```bash
# Create backup
npm run pathfinder backup create pre-deployment-$(date +%Y%m%d)

# Validate production environment
NODE_ENV=production npm run validate:env

# Production build with all quality checks
npm run build:prod

# Final health verification
npm run deploy:health
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Watch mode for development
npm run test:watch

# Coverage reporting
npm run test:coverage

# Specific test patterns
npm test -- --testNamePattern="User"
npm test -- src/models/User.test.js
```

### Test Data Management
```bash
# Reset test database
npm run pathfinder test reset

# Generate test data
npm run pathfinder test generate --users 10 --courses 5

# Clean test artifacts
npm run pathfinder test clean

# Database statistics for testing
npm run pathfinder db stats
```

## 📚 Documentation

- **[CLI Tool Documentation](docs/guides/cli-tool-documentation.md)** - Comprehensive CLI reference
- **[CLI Quick Reference](docs/guides/cli-quick-reference.md)** - Essential commands cheat sheet
- **[Deployment Guide](docs/guides/deployment-guide.md)** - Production deployment procedures
- **[Contributing Guide](CONTRIBUTING.md)** - Development guidelines and workflows
- **[Database Setup](docs/mvp/database-setup-as-built.md)** - Database architecture and setup
- **[MVP Implementation Log](docs/mvp/mvp-implementation-log.md)** - Development progress tracking

## 🔧 Configuration

### Environment Variables

**Required:**
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret (256+ bits recommended)
- `NODE_ENV` - Environment (development/production)

**Optional:**
- `PORT` - Application port (default: 3000)
- `OPENAI_API_KEY` - OpenAI integration
- `CORS_ORIGIN` - CORS allowed origins
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

### Frontend Configuration
The frontend is configured via `client/vite.config.js` with:
- Development proxy to backend API
- Environment-specific builds
- Code splitting and optimization
- ESLint integration

### Code Quality Configuration
- **ESLint**: `eslint.config.js` (backend), `client/eslint.config.js` (frontend)
- **Prettier**: `.prettierrc.json` with consistent formatting rules
- **Git hooks**: Pre-commit quality checks (future enhancement)
- **CI/CD**: Automated quality gates in build pipeline

## 🔐 Security

- JWT-based authentication with configurable expiration
- bcrypt password hashing with 12 salt rounds
- Role-based access control (Admin, Instructor, User)
- Environment variable validation
- Input sanitization and validation
- Secure default configurations

## 🚀 Production Deployment

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] MongoDB 4.4+ accessible
- [ ] Environment variables configured
- [ ] SSL certificates (for HTTPS)
- [ ] Firewall rules configured

### Environment Variables

**Required:**
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - Strong JWT signing secret (256+ bits)
- `NODE_ENV=production` - Environment setting

**Optional:**
- `PORT` - Application port (default: 3000)
- `OPENAI_API_KEY` - OpenAI integration
- `CORS_ORIGIN` - Allowed CORS origins
- `LOG_LEVEL` - Logging verbosity
- Email configuration (SMTP settings)

### Deployment Steps

1. **Environment Preparation**
   ```bash
   # Validate production environment
   NODE_ENV=production npm run validate:env
   ```

2. **Application Build**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Production build with quality checks
   npm run build:prod
   ```

3. **Database Setup**
   ```bash
   # Initialize database schema
   npm run db:init
   
   # Seed with minimal production data
   npm run pathfinder setup seed --admin-only
   ```

4. **Service Deployment**
   ```bash
   # Start application services
   npm run deploy:start
   
   # Verify deployment
   npm run deploy:health
   ```

5. **Health Verification**
   ```bash
   # Comprehensive health check
   npm run deploy:health
   
   # Monitor initial logs
   npm run logs:follow
   ```

### Docker Production Deployment

```bash
# Build optimized production image
npm run docker:build --prod

# Deploy with production compose
docker-compose -f docker-compose.yml up -d

# Health verification
npm run deploy:health

# Monitor containers
npm run pathfinder docker logs --follow
```

## 🤝 Contributing

We welcome contributions! Please follow our development workflow:

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/pathfinder.git`
3. Set up development environment: `npm run install:all`
4. Create feature branch: `git checkout -b feature/amazing-feature`

### Development Workflow
1. **Environment Setup**: `npm run validate:env && npm run db:init && npm run db:seed`
2. **Start Development**: `npm run dev:all`
3. **Code Quality**: `npm run quality:fix` (run frequently)
4. **Testing**: `npm test` (before committing)
5. **Documentation**: Update relevant docs in `/docs`

### Code Standards
- **ESLint**: Follow configured rules (auto-fix with `npm run lint:fix`)
- **Prettier**: Consistent formatting (auto-fix with `npm run format`)
- **Testing**: Write tests for new features
- **Documentation**: Update CLI docs and README for new features

### Commit Process
```bash
# Before committing
npm run quality         # Lint + format check
npm test               # Run test suite
npm run build:prod      # Verify production build

# Commit with descriptive message
git commit -m "feat: add amazing feature with tests and docs"

# Push and create PR
git push origin feature/amazing-feature
```

### Pull Request Guidelines
- Descriptive title and detailed description
- Reference related issues
- Include tests for new functionality
- Update documentation (CLI docs, README, etc.)
- Ensure CI checks pass

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection Problems:**
```bash
# Check MongoDB status
npm run db:status

# Validate environment
npm run validate:env

# Reset database if corrupted
npm run db:reset && npm run db:init && npm run db:seed
```

**Port Conflicts:**
```bash
# Check what's running on ports
npm run deploy:status

# Kill processes on specific ports (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

**Development Server Issues:**
```bash
# Clean everything and restart
npm run clean:all
npm run install:all
npm run quality:fix
npm run dev:all
```

**Build/Quality Issues:**
```bash
# Fix all code quality issues
npm run quality:fix

# Clean build artifacts
npm run clean

# Fresh production build
npm run build:prod
```

### Getting Help

1. **Documentation**: Check [CLI Documentation](docs/guides/cli-tool-documentation.md)
2. **Quick Reference**: See [CLI Quick Reference](docs/guides/cli-quick-reference.md)
3. **Troubleshooting**: Review [Deployment Guide](docs/guides/deployment-guide.md#troubleshooting)
4. **Debug Mode**: Use `DEBUG=true npm run pathfinder [command]`
5. **Health Check**: Run `npm run deploy:health` for diagnostic information
6. **Logs**: Monitor with `npm run logs:follow` for real-time debugging

### Debug Commands
```bash
# System health and diagnostics
npm run deploy:health

# Environment validation
npm run validate:env

# Database statistics
npm run pathfinder db stats

# Service status
npm run deploy:status

# View recent logs
npm run logs:view --lines 50
```

## 🏷️ Version Information

**Current Version**: 1.0.0  
**CLI Version**: 2.0.0 (integrated)  
**Frontend**: React 19.1.0 + Vite 7.0.4  
**Backend**: Node.js 18+ + Express 5.1.0  
**Database**: MongoDB 4.4+ + Mongoose 8.16.3  

### Technology Stack

**Backend:**
- Express 5.1.0 (web framework)
- Mongoose 8.16.3 (MongoDB ODM)
- Socket.io 4.8.1 (WebSocket communication)
- JWT + bcryptjs (authentication)
- Helmet + CORS (security)

**Frontend:**
- React 19.1.0 + React DOM 19.1.0
- Vite 7.0.4 (build tool and dev server)
- Material-UI 7.2.0 (component library)
- React Router DOM 7.6.3 (routing)
- Axios 1.10.0 (HTTP client)

**Development Tools:**
- ESLint 9.31.0 (linting)
- Prettier 3.6.2 (formatting)
- Nodemon 3.1.10 (hot reload)
- Concurrently 9.2.0 (process management)
- Jest 30.0.4 (testing)

---

**Built with ❤️ for the AI education community**
