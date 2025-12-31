# Step-by-Step Deployment Guide

## Your Repository
- **GitHub URL**: https://github.com/bosspetite/farmsquare-connect
- **Repository Name**: farmsquare-connect
- **Your Site URL will be**: https://bosspetite.github.io/farmsquare-connect/

## Step 1: Fix Git Authentication & Push Changes

You need to authenticate with GitHub. Choose one method:

### Option A: Use GitHub Desktop (Easiest)
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account (bosspetite)
3. Open the repository
4. Commit and push the changes

### Option B: Use Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. When pushing, use the token as your password

### Option C: Use SSH (Recommended for future)
1. Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
2. Change remote URL: `git remote set-url origin git@github.com:bosspetite/farmsquare-connect.git`

### Quick Push Command (after authentication):
```bash
cd "C:\Users\user\Desktop\MY FARM SQUARE WORK\farmsquare-connect"
git push origin chore/security-vite-upgrade
```

Then merge to main:
```bash
git checkout main
git merge chore/security-vite-upgrade
git push origin main
```

## Step 2: Enable GitHub Pages

1. Go to: https://github.com/bosspetite/farmsquare-connect/settings/pages
2. Under **Source**, select: **GitHub Actions** (NOT "Deploy from a branch")
3. Click **Save**

## Step 3: Trigger Deployment

The workflow will automatically run when you push to `main` or `master` branch.

To manually trigger:
1. Go to: https://github.com/bosspetite/farmsquare-connect/actions
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → Select branch → Run workflow

## Step 4: Wait for Deployment

1. Go to the **Actions** tab: https://github.com/bosspetite/farmsquare-connect/actions
2. Wait for the workflow to complete (usually 2-3 minutes)
3. You'll see a green checkmark when it's done

## Step 5: Access Your Site

Once deployed, your site will be live at:
**https://bosspetite.github.io/farmsquare-connect/**

## Troubleshooting

### If you see a blank page:
1. Check browser console (F12) for errors
2. Verify the base path is correct in `.github/workflows/deploy.yml`
3. Make sure `public/404.html` exists (it should be there)

### If deployment fails:
1. Check the Actions tab for error messages
2. Make sure Node.js version is compatible
3. Verify all files were committed

### If routes don't work:
- The `404.html` file handles client-side routing
- Make sure it's in the `public` folder (it should be)

## Need Help?

If you're stuck, you can also:
1. Manually upload the `dist` folder after building locally
2. Use GitHub Desktop for easier git operations
3. Check the Actions tab for detailed error messages

