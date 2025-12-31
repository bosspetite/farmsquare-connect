import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages 404.html redirect for client-side routing
(function() {
  const location = window.location;
  const search = location.search;
  
  // GitHub Pages 404.html redirects to /?/path format
  // We need to convert it back to proper path for React Router
  if (search.startsWith('?/')) {
    const path = search.slice(2).replace(/~and~/g, '&').replace(/~equals~/g, '=');
    const basePath = import.meta.env.BASE_URL || '/';
    const basePathClean = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const newPath = basePathClean + '/' + path.split('&')[0] + location.hash;
    window.history.replaceState({}, '', newPath);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
