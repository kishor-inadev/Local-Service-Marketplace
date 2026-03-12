# GitHub Push Helper Script
# This script will help you push your code to GitHub

Write-Host "
╔══════════════════════════════════════════════════════════╗
║   GitHub Push Helper - Local Service Marketplace        ║
╚══════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "✅ Git repository initialized and committed!" -ForegroundColor Green
Write-Host ""

# Check current git status
Write-Host "📊 Current Git Status:" -ForegroundColor Yellow
git log --oneline -1
Write-Host ""

# Get GitHub username
Write-Host "📝 Let's set up GitHub remote..." -ForegroundColor Cyan
Write-Host ""
$username = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "❌ Username is required!" -ForegroundColor Red
    exit 1
}

# Suggest repository name
$repoName = "local-service-marketplace"
Write-Host ""
Write-Host "📦 Suggested repository name: $repoName" -ForegroundColor Gray
$customName = Read-Host "Press Enter to use this name, or type a different name"

if (-not [string]::IsNullOrWhiteSpace($customName)) {
    $repoName = $customName
}

$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "🌐 Repository URL will be: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Check if repository exists on GitHub
Write-Host "⚠️  IMPORTANT: You need to create the repository on GitHub first!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Steps to create repository:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: $repoName" -ForegroundColor White
Write-Host "3. Description: Complete microservices marketplace platform" -ForegroundColor White
Write-Host "4. Choose Public or Private" -ForegroundColor White
Write-Host "5. DO NOT check 'Initialize with README' (we already have one)" -ForegroundColor White
Write-Host "6. Click 'Create repository'" -ForegroundColor White
Write-Host ""

$created = Read-Host "Have you created the repository on GitHub? (Y/N)"

if ($created -ne "Y" -and $created -ne "y") {
    Write-Host ""
    Write-Host "Please create the repository first, then run this script again." -ForegroundColor Yellow
    Write-Host "Opening GitHub in your browser..." -ForegroundColor Gray
    Start-Process "https://github.com/new"
    exit 0
}

Write-Host ""
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow

# Remove existing remote if any
git remote remove origin 2>$null

# Add new remote
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote added successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add remote" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "This may take a few minutes for the first push..." -ForegroundColor Gray
Write-Host ""

# Set branch to main and push
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   🎉 SUCCESS! Code pushed to GitHub!                   ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your repository: https://github.com/$username/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Add repository description on GitHub" -ForegroundColor White
    Write-Host "2. Add topics/tags: nextjs, nestjs, microservices, typescript, docker" -ForegroundColor White
    Write-Host "3. Set up branch protection rules (optional)" -ForegroundColor White
    Write-Host "4. Share with your team!" -ForegroundColor White
    Write-Host ""
    
    $openRepo = Read-Host "Open repository in browser? (Y/N)"
    if ($openRepo -eq "Y" -or $openRepo -eq "y") {
        Start-Process "https://github.com/$username/$repoName"
    }
    
} else {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Repository doesn't exist on GitHub - create it first" -ForegroundColor White
    Write-Host "2. Authentication required - you may need to enter username/password or use token" -ForegroundColor White
    Write-Host "3. Repository URL is incorrect - check your username and repo name" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running this command manually:" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Gray
}
