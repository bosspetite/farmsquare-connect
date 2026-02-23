import { useState, useEffect, useRef, useCallback } from 'react';
import { MockLocationStream, Location, getNigerianCityCoords } from './mockLocationStream';
import { Order } from '@/types';
import { getAppState } from '@/lib/store';

export interface DeliveryTrackingData {
  currentLocation: Location | null;
  progress: number; // 0-1
  eta: number; // Estimated seconds remaining
  isActive: boolean;
  distanceRemaining: number; // in km (estimated)
}

/**
 * Hook for tracking delivery location
 * Abstracts location source - can be easily replaced with real backend later
 */
export const useDeliveryTracking = (orderId: string | undefined) => {
  const [trackingData, setTrackingData] = useState<DeliveryTrackingData>({
    currentLocation: null,
    progress: 0,
    eta: 0,
    isActive: false,
    distanceRemaining: 0,
  });

  const streamRef = useRef<MockLocationStream | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Get order and calculate route
  const state = getAppState();
  const order = orderId ? state.orders.find((o) => o.id === orderId) : null;
  const listing = order ? state.listings.find((l) => l.id === order.listingId) : null;

  // Calculate origin and destination
  const getRoute = useCallback(() => {
    if (!order || !listing) {
      return null;
    }

    // Origin: Farmer's region
    const origin = getNigerianCityCoords(listing.region || order.pickupLocation);

    // Destination: Buyer's region (default to Lagos if not specified)
    // In real app, this would come from buyer's delivery address
    const destination = getNigerianCityCoords('Lagos');

    return { origin, destination };
  }, [order, listing]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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
    },
    []
  );

  // Start tracking
  const startTracking = useCallback(() => {
    if (!order || order.status !== 'InTransit') {
      return;
    }

    const route = getRoute();
    if (!route) {
      return;
    }

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.stop();
    }

    // Create new stream
    const stream = new MockLocationStream({
      origin: route.origin,
      destination: route.destination,
      updateInterval: 2000, // Update every 2 seconds
      speed: 0.015, // 1.5% progress per update (~30 minutes total)
      onLocationUpdate: (location: Location) => {
        const progress = stream.getProgress();
        const totalDistance = calculateDistance(
          route.origin.lat,
          route.origin.lng,
          route.destination.lat,
          route.destination.lng
        );
        const distanceRemaining = totalDistance * (1 - progress);

        // Calculate ETA based on progress and elapsed time
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        const eta = progress > 0 ? (elapsed / progress) * (1 - progress) : totalDistance * 1000; // Rough estimate

        setTrackingData({
          currentLocation: location,
          progress,
          eta: Math.round(eta / 1000), // Convert to seconds
          isActive: true,
          distanceRemaining: Math.round(distanceRemaining * 10) / 10, // Round to 1 decimal
        });
      },
    });

    streamRef.current = stream;
    startTimeRef.current = Date.now();
    stream.start();
  }, [order, getRoute, calculateDistance]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.stop();
      setTrackingData((prev) => ({ ...prev, isActive: false }));
    }
  }, []);

  // Reset tracking
  const resetTracking = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.reset();
      setTrackingData({
        currentLocation: null,
        progress: 0,
        eta: 0,
        isActive: false,
        distanceRemaining: 0,
      });
      startTimeRef.current = null;
    }
  }, []);

  // Auto-start if order is in transit
  useEffect(() => {
    if (order && order.status === 'InTransit' && !streamRef.current?.isRunning()) {
      startTracking();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.stop();
      }
    };
  }, [order?.id, order?.status, startTracking]);

  return {
    trackingData,
    startTracking,
    stopTracking,
    resetTracking,
    order,
    listing,
  };
};














