import { Order, OrderTracking } from '@/types';
import { useOrderStore } from '@/stores/orderStore';
import { MockLocationStream, Location } from '@/modules/delivery-tracking/mockLocationStream';
import { getNigerianCityCoords } from '@/modules/delivery-tracking';

/**
 * Global Tracking Service
 * Manages delivery tracking for all orders
 * Updates shared order store in real-time
 */
class TrackingService {
  private streams: Map<string, MockLocationStream> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start tracking an order
   * Creates a simulated delivery movement and updates the shared store
   */
  startTracking(order: Order): void {
    if (this.streams.has(order.id)) {
      return; // Already tracking
    }

    if (!order.farmerLocation || !order.deliveryLocation) {
      console.warn(`Order ${order.id} missing location data`);
      return;
    }

    const origin = order.farmerLocation;
    const destination = order.deliveryLocation;

    // Calculate route points (simplified - in production use Directions API)
    const route = this.calculateRoute(origin, destination);

    const stream = new MockLocationStream({
      origin,
      destination,
      updateInterval: 2000, // Update every 2 seconds
      speed: 0.02, // 2% progress per update
      onLocationUpdate: (location: Location) => {
        const progress = stream.getProgress();
        const distanceRemaining = this.calculateDistance(
          location.lat,
          location.lng,
          destination.lat,
          destination.lng
        );

        // Update order tracking in shared store
        const tracking: Partial<OrderTracking> = {
          currentLocation: location,
          route: route.slice(0, Math.floor(route.length * progress)),
          progressPercentage: Math.round(progress * 100),
          distanceRemaining: Math.round(distanceRemaining * 10) / 10,
        };

        useOrderStore.getState().updateOrderTracking(order.id, tracking);

        // Auto-update status based on progress
        if (progress >= 1 && order.status !== 'Delivered') {
          useOrderStore.getState().updateOrderStatus(order.id, 'Delivered');
          this.stopTracking(order.id);
        } else if (progress > 0.1 && order.status === 'PickupScheduled') {
          // Auto-transition to InTransit when movement starts
          useOrderStore.getState().updateOrderStatus(order.id, 'InTransit');
        }
      },
    });

    this.streams.set(order.id, stream);
    stream.start();
  }

  /**
   * Stop tracking an order
   */
  stopTracking(orderId: string): void {
    const stream = this.streams.get(orderId);
    if (stream) {
      stream.stop();
      this.streams.delete(orderId);
    }

    const interval = this.intervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(orderId);
    }
  }

  /**
   * Check if an order is being tracked
   */
  isTracking(orderId: string): boolean {
    return this.streams.has(orderId);
  }

  /**
   * Calculate route between two points (simplified)
   * In production, use Google Directions API
   */
  private calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [origin];
    const steps = 20; // Number of intermediate points

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t,
      });
    }

    points.push(destination);
    return points;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Auto-start tracking for orders in transit
   */
  autoStartTracking(): void {
    const orders = useOrderStore.getState().getAllOrders();
    
    orders.forEach((order) => {
      if (
        (order.status === 'InTransit' || order.status === 'PickupScheduled') &&
        !this.isTracking(order.id)
      ) {
        this.startTracking(order);
      }
    });
  }

  /**
   * Cleanup - stop all tracking
   */
  cleanup(): void {
    this.streams.forEach((stream, orderId) => {
      this.stopTracking(orderId);
    });
  }
}

// Singleton instance
export const trackingService = new TrackingService();

// Auto-start tracking for orders that should be tracked
if (typeof window !== 'undefined') {
  // Listen for order status changes
  const handleOrderInTransit = (e: CustomEvent) => {
    const orderId = e.detail?.orderId;
    if (orderId) {
      const order = useOrderStore.getState().getOrderById(orderId);
      if (order) {
        trackingService.startTracking(order);
      }
    }
  };
  
  const handleOrderDelivered = (e: CustomEvent) => {
    const orderId = e.detail?.orderId;
    if (orderId) {
      trackingService.stopTracking(orderId);
    }
  };
  
  window.addEventListener('farmsquare:order-in-transit', handleOrderInTransit as EventListener);
  window.addEventListener('farmsquare:order-delivered', handleOrderDelivered as EventListener);
  
  // Initialize tracking service after a delay to ensure store is ready
  const initTracking = () => {
    // Start tracking when store updates
    const unsubscribe = useOrderStore.subscribe(() => {
      trackingService.autoStartTracking();
    });

    // Initial check
    setTimeout(() => {
      trackingService.autoStartTracking();
    }, 1000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      trackingService.cleanup();
      unsubscribe();
      window.removeEventListener('farmsquare:order-in-transit', handleOrderInTransit as EventListener);
      window.removeEventListener('farmsquare:order-delivered', handleOrderDelivered as EventListener);
    });
  };

  // Delay initialization to avoid circular dependency issues
  setTimeout(initTracking, 100);
}

