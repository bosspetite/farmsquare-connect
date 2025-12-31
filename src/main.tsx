import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages 404.html redirect
// The 404.html redirects to /?/path format, we need to convert it back to /path
(function() {
  const location = window.location;
  const search = location.search;
  
  // Check if we have a redirect query parameter (from 404.html)
  if (search.includes('?/')) {
    // Extract the path from the query string
    // Format: /repo-name/?/actual/path
    const pathMatch = search.match(/\?\/?(.+?)(?:&|$)/);
    if (pathMatch && pathMatch[1]) {
      let redirectPath = pathMatch[1]
        .replace(/~and~/g, '&')
        .replace(/~equals~/g, '=');
      
      // Get the base path (repository name)
      const basePath = import.meta.env.BASE_URL || '/';
      const basePathClean = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
      
      // Construct the new URL
      const newPath = basePathClean + '/' + redirectPath + location.hash;
      window.history.replaceState({}, '', newPath);
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
