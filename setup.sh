#!/bin/bash

# Pathfinder Quick Setup Script
# This script helps set up the Pathfinder project quickly

set -e  # Exit on any error

echo "🚀 Pathfinder Quick Setup"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up environment
echo "🔧 Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your MongoDB URI and other settings"
else
    echo "✅ .env file already exists"
fi

# Validate environment
echo "🔍 Validating environment..."
if npm run deploy:validate; then
    echo "✅ Environment validation passed"
else
    echo "❌ Environment validation failed"
    echo "💡 Please check your .env file and ensure MongoDB is accessible"
    exit 1
fi

# Initialize database
echo "🗄️  Initializing database..."
if npm run db:init; then
    echo "✅ Database initialized"
else
    echo "❌ Database initialization failed"
    echo "💡 Please check MongoDB connection and try again"
    exit 1
fi

# Seed database
echo "🌱 Seeding database with initial data..."
if npm run db:seed; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Database seeding failed"
    exit 1
fi

# Health check
echo "🏥 Performing health check..."
if npm run deploy:health; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed - some issues detected"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your specific configuration"
echo "2. Start development server: npm run deploy:start --dev"
echo "3. Check service status: npm run deploy:status"
echo "4. View logs: npm run logs:follow"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@pathfinder.local"
echo "  Password: PathfinderAdmin2025!"
echo "  ⚠️  Please change these after first login!"
echo ""
echo "Useful commands:"
echo "  npm run pathfinder examples  # See all available commands"
echo "  npm run deploy:health        # System health check"
echo "  npm run db:status           # Database status"
echo ""
echo "Documentation:"
echo "  docs/mvp/cli-tool-documentation.md  # CLI reference"
echo "  docs/guides/deployment-guide.md     # Deployment guide"
echo "  docs/guides/cli-quick-reference.md  # Quick reference"
echo ""
echo "Happy coding! 🚀"
