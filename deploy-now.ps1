# PowerShell script to deploy to GitHub Pages
# This will merge your changes to main and push them

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in the farmsquare-connect directory!" -ForegroundColor Red
    Write-Host "Please run this script from the farmsquare-connect folder" -ForegroundColor Yellow
    exit 1
}

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Add any uncommitted files
Write-Host "➕ Adding all files..." -ForegroundColor Yellow
git add .
Write-Host ""

# Commit if there are changes
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Final deployment setup - fix routing and base path"
    Write-Host ""
}

# First, push the current branch
Write-Host "📤 Step 1: Pushing current branch to GitHub..." -ForegroundColor Yellow
Write-Host "   (You may need to authenticate)" -ForegroundColor Gray
try {
    git push origin chore/security-vite-upgrade
    Write-Host "   ✅ Pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Push failed. You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Use GitHub Desktop instead, OR" -ForegroundColor Cyan
    Write-Host "   2. Set up authentication (see DEPLOY_SIMPLE.md)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Continuing with merge to main..." -ForegroundColor Yellow
}
Write-Host ""

# Switch to main branch
Write-Host "🔄 Step 2: Switching to main branch..." -ForegroundColor Yellow
git checkout main
Write-Host ""

# Pull latest changes
Write-Host "📥 Pulling latest changes from main..." -ForegroundColor Yellow
git pull origin main
Write-Host ""

# Merge the feature branch
Write-Host "🔀 Step 3: Merging changes into main..." -ForegroundColor Yellow
git merge chore/security-vite-upgrade --no-edit
Write-Host ""

# Push to GitHub
Write-Host "📤 Step 4: Pushing to GitHub (main branch)..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "   ✅ Pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Push failed. Please use GitHub Desktop or fix authentication." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ DEPLOYMENT INITIATED!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📊 Check deployment status:" -ForegroundColor Yellow
Write-Host "   https://github.com/bosspetite/farmsquare-connect/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚙️  IMPORTANT: Enable GitHub Pages:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://github.com/bosspetite/farmsquare-connect/settings/pages" -ForegroundColor Cyan
Write-Host "   2. Under 'Source', select 'GitHub Actions' (NOT 'Deploy from a branch')" -ForegroundColor Cyan
Write-Host "   3. Click 'Save'" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your site will be live at (after 2-3 minutes):" -ForegroundColor Green
Write-Host "   https://bosspetite.github.io/farmsquare-connect/" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Wait 2-3 minutes, then check the Actions tab for completion." -ForegroundColor Yellow

