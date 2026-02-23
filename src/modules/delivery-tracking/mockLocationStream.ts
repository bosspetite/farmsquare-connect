/**
 * Mock location stream for simulating delivery agent movement
 * This can be easily replaced with real WebSocket or Supabase Realtime later
 */

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface LocationStreamOptions {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onLocationUpdate: (location: Location) => void;
  updateInterval?: number; // milliseconds between updates
  speed?: number; // percentage of route per update (0-1)
}

/**
 * Simulates movement along a route from origin to destination
 * Uses linear interpolation with slight randomization for realism
 */
export class MockLocationStream {
  private intervalId: NodeJS.Timeout | null = null;
  private currentProgress = 0;
  private options: Required<LocationStreamOptions>;
  private isActive = false;

  constructor(options: LocationStreamOptions) {
    this.options = {
      updateInterval: options.updateInterval || 2000, // 2 seconds default
      speed: options.speed || 0.02, // 2% progress per update
      ...options,
    };
  }

  /**
   * Start the location stream
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.currentProgress = 0;

    this.intervalId = setInterval(() => {
      // Update progress
      this.currentProgress += this.options.speed;

      // Add slight randomness for realism (±5%)
      const randomizedProgress = Math.max(
        0,
        Math.min(
          1,
          this.currentProgress + (Math.random() - 0.5) * 0.1
        )
      );

      // Calculate current position using linear interpolation
      const location = this.interpolateLocation(
        this.options.origin,
        this.options.destination,
        randomizedProgress
      );

      // Notify listener
      this.options.onLocationUpdate({
        ...location,
        timestamp: Date.now(),
      });

      // Stop when reached destination
      if (this.currentProgress >= 1) {
        this.stop();
      }
    }, this.options.updateInterval);
  }

  /**
   * Stop the location stream
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
  }

  /**
   * Reset to start position
   */
  reset() {
    this.stop();
    this.currentProgress = 0;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    return Math.min(1, this.currentProgress);
  }

  /**
   * Check if stream is active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Interpolate between two coordinates
   */
  private interpolateLocation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    progress: number
  ): { lat: number; lng: number } {
    // Linear interpolation
    const lat = origin.lat + (destination.lat - origin.lat) * progress;
    const lng = origin.lng + (destination.lng - origin.lng) * progress;

    // Add slight random variation for realism (±0.001 degrees ≈ 100m)
    const variation = 0.001;
    return {
      lat: lat + (Math.random() - 0.5) * variation,
      lng: lng + (Math.random() - 0.5) * variation,
    };
  }
}

/**
 * Helper to get Nigerian city coordinates
 */
export const getNigerianCityCoords = (cityName: string): { lat: number; lng: number } => {
  const cities: Record<string, { lat: number; lng: number }> = {
    Lagos: { lat: 6.5244, lng: 3.3792 },
    Abuja: { lat: 9.0765, lng: 7.3986 },
    Kano: { lat: 12.0022, lng: 8.5919 },
    Kaduna: { lat: 10.5264, lng: 7.4383 },
    PortHarcourt: { lat: 4.8156, lng: 7.0498 },
    Ibadan: { lat: 7.3776, lng: 3.9470 },
    Benin: { lat: 6.3350, lng: 5.6037 },
    Enugu: { lat: 6.4474, lng: 7.5139 },
    Zaria: { lat: 11.1112, lng: 7.7227 },
    Sokoto: { lat: 13.0627, lng: 5.2433 },
    Benue: { lat: 7.3369, lng: 8.7404 },
  };

  // Try exact match first
  if (cities[cityName]) {
    return cities[cityName];
  }

  // Try case-insensitive match
  const normalized = cityName.toLowerCase();
  for (const [key, value] of Object.entries(cities)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }

  // Default to Lagos if not found
  return cities.Lagos;
};














