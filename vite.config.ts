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
  // Priority: VITE_BASE_PATH > default root
  // Vercel: Uses "/" (no VITE_BASE_PATH set)
  // GitHub Pages: Uses "/farmsquare-connect/" (VITE_BASE_PATH set in workflow)
  // Local dev: Uses "/" (no VITE_BASE_PATH set)
  let base = "/"; // Default to root (works for Vercel and local dev)
  
  // Only use repo path if explicitly set (GitHub Actions/GitHub Pages)
  if (process.env.VITE_BASE_PATH) {
    base = process.env.VITE_BASE_PATH;
  }
  
  // Log for debugging (only in build, not in dev)
  if (mode === "production") {
    console.log(`[Vite Config] Base path: "${base}" | VERCEL: ${process.env.VERCEL} | VITE_BASE_PATH: ${process.env.VITE_BASE_PATH || "not set"} | GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS || "not set"}`);
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
