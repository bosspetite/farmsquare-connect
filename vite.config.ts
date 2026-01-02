import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages project site:
  // https://<USERNAME>.github.io/<REPO>/
  // Vercel serves from root, so no base path needed
  const repoName = "farmsquare-connect";
  
  // Determine base path:
  // Priority: VERCEL > VITE_BASE_PATH > default production
  // Vercel always uses root "/"
  // GitHub Pages uses "/farmsquare-connect/"
  let base = "/";
  
  // Check for Vercel first (Vercel sets VERCEL=1 automatically)
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    base = "/"; // Vercel - always root
  } else if (process.env.VITE_BASE_PATH) {
    // Explicitly set for GitHub Actions/GitHub Pages
    base = process.env.VITE_BASE_PATH;
  } else if (mode === "production") {
    // Default production build (GitHub Pages)
    base = `/${repoName}/`;
  }
  
  // Log for debugging (only in build, not in dev)
  if (mode === "production") {
    console.log(`[Vite Config] Base path: "${base}" | VERCEL: ${process.env.VERCEL} | VITE_BASE_PATH: ${process.env.VITE_BASE_PATH || "not set"}`);
  }

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
