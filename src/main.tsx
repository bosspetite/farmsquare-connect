import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon path issue in Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});


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
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="padding: 40px; text-align: center; background: #0a0f0a; color: #ef4444; min-height: 100vh; display: flex; align-items: center; justify-content: center;"><h1>Error: Root element not found!</h1><p>Please check if index.html has a div with id="root"</p></div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("✅ App rendered successfully");
    console.log("📍 Base URL:", import.meta.env.BASE_URL);
    console.log("🌐 Current URL:", window.location.href);
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    rootElement.innerHTML = `<div style="padding: 40px; text-align: center; background: #0a0f0a; color: #ef4444; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">Error Loading App</h1>
      <p style="margin-bottom: 10px;">${error instanceof Error ? error.message : String(error)}</p>
      <p style="color: #94a3b8;">Check the browser console (F12) for more details.</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Reload Page</button>
    </div>`;
  }
}
