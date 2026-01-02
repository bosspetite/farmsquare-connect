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

// Error handling for React rendering
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
  } else {
    createRoot(rootElement).render(<App />);
    console.log("App rendered successfully");
    console.log("Base URL:", import.meta.env.BASE_URL);
  }
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">
    <h1>Error Loading App</h1>
    <p>${error instanceof Error ? error.message : String(error)}</p>
    <p>Check the browser console (F12) for more details.</p>
  </div>`;
}
