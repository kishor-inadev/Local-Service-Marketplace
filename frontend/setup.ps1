# Quick Start Script for Windows PowerShell
# Run this script to set up the frontend application

Write-Host "🚀 Local Service Marketplace - Frontend Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18.x or higher from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Install dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow

# Create .env.local if it doesn't exist
if (-not (Test-Path .env.local)) {
    Copy-Item .env.example .env.local
    Write-Host "✅ Created .env.local from .env.example" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env.local already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure the backend API Gateway is running on http://localhost:3000" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📚 Available commands:" -ForegroundColor Cyan
Write-Host "  npm run dev        - Start development server" -ForegroundColor White
Write-Host "  npm run build      - Build for production" -ForegroundColor White
Write-Host "  npm start          - Start production server" -ForegroundColor White
Write-Host "  npm test           - Run tests" -ForegroundColor White
Write-Host "  npm run lint       - Run ESLint" -ForegroundColor White
Write-Host ""
Write-Host "🔥 Ready to start? Run: npm run dev" -ForegroundColor Green
Write-Host ""

# Ask if user wants to start dev server now
$response = Read-Host "Would you like to start the development server now? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    npm run dev
}
