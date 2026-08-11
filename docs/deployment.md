# Deployment

This document consolidates deployment guidance for FarmSquare Connect.

## GitHub Pages (via GitHub Actions)

The repository includes a GitHub Actions workflow that builds the Vite app and deploys the generated `dist/` folder to GitHub Pages.

Key steps (automated by `.github/workflows/deploy.yml`):

1. Checkout
2. Install dependencies (`npm ci`)
3. Build with a base path set to `/${{ github.event.repository.name }}/` (workflow sets `VITE_BASE_PATH`)
4. Upload the `dist/` artifact and deploy with `actions/deploy-pages`

Notes and troubleshooting:

- If you deploy to a project page (`username.github.io/repo`), ensure the workflow uses the correct base path (the workflow already sets `VITE_BASE_PATH` based on the repository name).
- For client-side routing to work on GitHub Pages, ensure `public/404.html` exists and is included in the build output.
- The workflow prints diagnostic checks (lists `dist/` and inspects `index.html`) to help debug missing assets.

### Manual deployment (alternative)

1. Build locally:

```bash
npm install
npm run build
```

2. Deploy the contents of `dist/` to the `gh-pages` branch or a static host of your choice.

## Vercel

FarmSquare is configured to deploy on Vercel. `vercel.json` contains settings for Vercel deployments (build command: `npm run build`, output: `dist`).

Quick deploy via Vercel dashboard:

1. Import repository in Vercel and confirm the build command is `npm run build` and output directory is `dist`.
2. Add required environment variables (see `.env.example`) in the Vercel project settings.

Or via CLI:

```bash
npm i -g vercel
vercel
```

Notes:

- Do not set `VITE_BASE_PATH` in Vercel — Vercel sets runtime environment variables automatically and the app detects Vercel at runtime.

## Other notes

- Keep `deploy-now.ps1` at the repository root (it is a deployment helper script and must not be moved).
- All deployment commands and scripts referenced in the original docs have been consolidated here. Original files have been archived.
