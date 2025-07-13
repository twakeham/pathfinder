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

## 🏗️ Architecture

- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React (in `/client` directory)
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT-based with role-based access control
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
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (at minimum, set MONGODB_URI)
# MONGODB_URI=mongodb://localhost:27017/pathfinder-dev
```

### 3. Database Setup

```bash
# Validate environment
npm run deploy:validate

# Initialize database structure
npm run db:init

# Seed with initial data (creates admin user)
npm run db:seed
```

### 4. Start Development

```bash
# Start backend in development mode
npm run deploy:start --dev

# In another terminal, check status
npm run deploy:status

# View logs
npm run logs:follow
```

### 5. Access Application

- **Backend API**: http://localhost:3000
- **Default Admin**: admin@pathfinder.local / PathfinderAdmin2025!

## 🛠️ CLI Tool

The project includes a comprehensive CLI tool for all operations:

```bash
# Database management
npm run db:status              # Check database connection
npm run db:stats               # Database statistics

# Deployment operations  
npm run deploy:health          # System health check
npm run deploy:build           # Production build
npm run deploy:start           # Start services

# Docker operations
npm run docker:up              # Start containers
npm run docker:down            # Stop containers

# Development utilities
npm run pathfinder -- test generate --users 5    # Generate test data
npm run pathfinder -- backup create my-backup    # Create backup

# See all available commands
npm run pathfinder examples
```

## 📁 Project Structure

```
pathfinder/
├── src/                          # Backend source code
│   ├── config/                   # Database and configuration
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Express middleware
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic services
│   └── websocket/               # WebSocket handlers
├── client/                       # React frontend (future)
├── scripts/                      # CLI tools and utilities
│   └── cli.js                   # Main CLI tool
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── docs/                         # Documentation
│   ├── api/                     # API documentation
│   ├── guides/                  # User guides
│   └── mvp/                     # MVP-specific docs
├── config/                       # Environment configurations
├── docker-compose.yml           # Production Docker config
├── docker-compose.dev.yml       # Development Docker config
└── Dockerfile                   # Application container
```

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start development environment
npm run docker:up

# Monitor logs
npm run pathfinder -- docker logs --follow

# Stop when done
npm run docker:down
```

### Production Deployment

```bash
# Build production image
npm run docker:build --no-cache

# Deploy with production config
docker-compose up -d

# Health check
npm run deploy:health
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
# Environment validation
npm run deploy:validate

# Database initialization
npm run db:init
npm run db:seed

# Health check
npm run deploy:health
```

### Development Cycle
```bash
# Start with fresh test data
npm run pathfinder -- test reset

# Generate test users
npm run pathfinder -- test generate --users 10

# Start development server
npm run deploy:start --dev

# Monitor in real-time
npm run logs:follow
```

### Before Deployment
```bash
# Create backup
npm run pathfinder -- backup create pre-deployment-$(date +%Y%m%d)

# Build for production
npm run deploy:build

# Health verification
npm run deploy:health
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Clean test data
npm run pathfinder -- test clean
```

## 📚 Documentation

- **[CLI Tool Documentation](docs/mvp/cli-tool-documentation.md)** - Comprehensive CLI reference
- **[Deployment Guide](docs/guides/deployment-guide.md)** - Production deployment procedures
- **[Database Setup](docs/mvp/database-setup-as-built.md)** - Database architecture and setup
- **[Quick Reference](docs/guides/cli-quick-reference.md)** - Essential commands cheat sheet

## 🔐 Security

- JWT-based authentication with configurable expiration
- bcrypt password hashing with 12 salt rounds
- Role-based access control (Admin, Instructor, User)
- Environment variable validation
- Input sanitization and validation
- Secure default configurations

## 🚀 Production Deployment

### Environment Variables

Required:
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret (256+ bits)
- `NODE_ENV` - Environment (production)

Optional:
- `PORT` - Application port (default: 3000)
- `OPENAI_API_KEY` - OpenAI integration
- Email configuration for notifications

### Deployment Steps

1. **Environment Setup**
   ```bash
   pathfinder deploy validate-env production
   ```

2. **Build Application**
   ```bash
   npm run deploy:build
   ```

3. **Database Setup**
   ```bash
   npm run db:init
   npm run db:seed --admin-only
   ```

4. **Start Services**
   ```bash
   npm run deploy:start
   ```

5. **Health Verification**
   ```bash
   npm run deploy:health
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Database Connection**: Check MongoDB is running and `MONGODB_URI` is correct
- **Port Conflicts**: Use `npm run deploy:service status` to check ports
- **Health Checks**: Run `npm run deploy:health` for diagnostic information

### Getting Help

- Check the [CLI Documentation](docs/mvp/cli-tool-documentation.md)
- Review [Troubleshooting Guide](docs/guides/deployment-guide.md#troubleshooting)
- Use debug mode: `DEBUG=true npm run pathfinder [command]`

## 🏷️ Version

**Current Version**: 1.0.0  
**CLI Version**: 2.0.0  
**Node.js**: 18+  
**MongoDB**: 4.4+

---

**Built with ❤️ for the AI education community**
