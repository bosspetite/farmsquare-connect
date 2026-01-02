import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages 404.html redirect for client-side routing
// The 404.html redirects routes like /farmsquare-connect/about to /farmsquare-connect/?/about
(function() {
  const location = window.location;
  const search = location.search;
  
  // Check if we have a redirect query parameter (from 404.html)
  if (search.startsWith('?/')) {
    // Extract the path from query string
    // Format: /farmsquare-connect/?/about becomes /farmsquare-connect/about
    let path = search.slice(2); // Remove '?/'
    
    // Handle encoded characters
    path = path.replace(/~and~/g, '&').replace(/~equals~/g, '=');
    
    // Remove any additional query parameters
    const pathOnly = path.split('&')[0];
    
    // Get base path
    const basePath = import.meta.env.BASE_URL || '/';
    const basePathClean = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    
    // Construct new path
    const newPath = basePathClean + '/' + pathOnly + location.hash;
    
    // Replace URL without reload
    window.history.replaceState({}, '', newPath);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
