import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages project site:
  // https://<USERNAME>.github.io/<REPO>/
  // Vite must use base "/<REPO>/" for correct asset paths in production.
  const repoName = "farmsquare-connect";
  // Always use env var if set (for GitHub Actions), otherwise use repo name in production
  const base = process.env.VITE_BASE_PATH || (mode === "production" ? `/${repoName}/` : "/");

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
