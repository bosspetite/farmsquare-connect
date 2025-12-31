# GitHub Pages Deployment Guide

This guide will help you deploy your Farm Square Connect frontend to GitHub Pages.

## Quick Setup

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

### Step 2: Update Base Path (if needed)

If your repository name is different from what's in the workflow, update it:

1. Open `.github/workflows/deploy.yml`
2. Find the line: `VITE_BASE_PATH: /${{ github.event.repository.name }}/`
3. If your repo is at `github.com/username/repo-name`, the base path will be `/repo-name/`
4. For a user/organization page (like `username.github.io`), change it to: `VITE_BASE_PATH: /`

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Step 4: Wait for Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Wait for the workflow to complete (usually 2-3 minutes)
3. Once done, your site will be available at:
   - `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Manual Deployment (Alternative)

If you prefer to deploy manually:

1. Build the project:
   ```bash
   cd farmsquare-connect
   npm install
   npm run build
   ```

2. The `dist` folder contains your built files

3. Push the `dist` folder to the `gh-pages` branch or use GitHub Pages settings

## Troubleshooting

### Blank Page Issue

If you see a blank page:

1. **Check the base path**: Make sure `VITE_BASE_PATH` in the workflow matches your repository name
2. **Check browser console**: Open DevTools (F12) and check for errors
3. **Verify 404.html exists**: The `public/404.html` file is needed for client-side routing

### Routes Not Working

- The `404.html` file handles client-side routing for GitHub Pages
- Make sure it's in the `public` folder (it will be copied to `dist` during build)

### Assets Not Loading

- Check that all asset paths use relative paths
- Verify the base path is set correctly in `vite.config.ts`

## Your Site URL

After deployment, your site will be available at:
- **Project Pages**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
- **User Pages**: `https://YOUR_USERNAME.github.io/` (if repo is `username.github.io`)

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

