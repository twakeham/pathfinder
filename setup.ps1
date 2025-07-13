# Pathfinder Quick Setup Script (PowerShell)
# This script helps set up the Pathfinder project quickly on Windows

Write-Host "🚀 Pathfinder Quick Setup" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "❌ Error: Node.js 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Set up environment
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your MongoDB URI and other settings" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Validate environment
Write-Host "🔍 Validating environment..." -ForegroundColor Yellow
npm run deploy:validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Environment validation failed" -ForegroundColor Red
    Write-Host "💡 Please check your .env file and ensure MongoDB is accessible" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Environment validation passed" -ForegroundColor Green
}

# Initialize database
Write-Host "🗄️  Initializing database..." -ForegroundColor Yellow
npm run db:init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database initialization failed" -ForegroundColor Red
    Write-Host "💡 Please check MongoDB connection and try again" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Database initialized" -ForegroundColor Green
}

# Seed database
Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database seeding failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
}

# Health check
Write-Host "🏥 Performing health check..." -ForegroundColor Yellow
npm run deploy:health
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Health check failed - some issues detected" -ForegroundColor Yellow
} else {
    Write-Host "✅ Health check passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit .env file with your specific configuration"
Write-Host "2. Start development server: npm run deploy:start --dev"
Write-Host "3. Check service status: npm run deploy:status"
Write-Host "4. View logs: npm run logs:follow"
Write-Host ""
Write-Host "Default admin credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@pathfinder.local"
Write-Host "  Password: PathfinderAdmin2025!"
Write-Host "  ⚠️  Please change these after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  npm run pathfinder examples  # See all available commands"
Write-Host "  npm run deploy:health        # System health check"
Write-Host "  npm run db:status           # Database status"
Write-Host ""
Write-Host "Documentation:"
Write-Host "  docs/mvp/cli-tool-documentation.md  # CLI reference"
Write-Host "  docs/guides/deployment-guide.md     # Deployment guide"
Write-Host "  docs/guides/cli-quick-reference.md  # Quick reference"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
