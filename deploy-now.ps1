# PowerShell script to deploy to GitHub Pages
# This will merge your changes to main and push them

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in the farmsquare-connect directory!" -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "`n📋 Checking git status..." -ForegroundColor Yellow
git status

# Add any uncommitted files
Write-Host "`n➕ Adding files..." -ForegroundColor Yellow
git add .

# Commit if there are changes
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Update deployment configuration"
}

# Switch to main branch
Write-Host "`n🔄 Switching to main branch..." -ForegroundColor Yellow
git checkout main

# Pull latest changes
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Merge the feature branch
Write-Host "`n🔀 Merging chore/security-vite-upgrade into main..." -ForegroundColor Yellow
git merge chore/security-vite-upgrade --no-edit

# Push to GitHub
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Deployment initiated! Check GitHub Actions:" -ForegroundColor Green
Write-Host "   https://github.com/bosspetite/farmsquare-connect/actions" -ForegroundColor Cyan
Write-Host "`n📝 Don't forget to enable GitHub Pages:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://github.com/bosspetite/farmsquare-connect/settings/pages" -ForegroundColor Cyan
Write-Host "   2. Select 'GitHub Actions' as the source" -ForegroundColor Cyan
Write-Host "   3. Save" -ForegroundColor Cyan
Write-Host "`n🌐 Your site will be live at:" -ForegroundColor Green
Write-Host "   https://bosspetite.github.io/farmsquare-connect/" -ForegroundColor Cyan

