import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LatLng } from '@/types';
import { MapPin, Navigation } from 'lucide-react';

// Ensure we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Custom marker icons
const createCustomIcon = (color: string, iconType: 'pickup' | 'dropoff' | 'current') => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
        font-weight: bold;
      ">
        ${iconType === 'pickup' ? 'P' : iconType === 'dropoff' ? 'D' : '🚚'}
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit map bounds
function FitBounds({ pickup, dropoff }: { pickup: LatLng; dropoff: LatLng }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && dropoff && map) {
      try {
        // Use Leaflet's LatLngBounds constructor properly
        const bounds = L.latLngBounds(
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.warn('Error fitting bounds:', error);
        // Fallback: just center the map
        try {
          map.setView(
            [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2],
            10
          );
        } catch (e) {
          // Ignore fallback errors
        }
      }
    }
  }, [map, pickup, dropoff]);

  return null;
}

interface OrderTrackingMapProps {
  pickup: LatLng;
  dropoff: LatLng;
  current: LatLng;
  isTracking: boolean;
  progressPct?: number;
  lastUpdatedAt?: string;
  className?: string;
}

export const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  pickup,
  dropoff,
  current,
  isTracking,
  progressPct = 0,
  lastUpdatedAt,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  // Only render map in browser
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate required props
  if (!pickup || !dropoff || !current) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg border border-border ${className}`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Tracking data not available</p>
        </div>
      </div>
    );
  }

  // Don't render map until mounted and Leaflet is available (SSR safety)
  if (!mounted || !isBrowser || typeof L === 'undefined' || !L.latLngBounds) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg border border-border ${className}`}>
        <div className="text-center text-muted-foreground">
          <Navigation className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative h-64 w-full rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={[(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2]}
          zoom={10}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={false}
          key={`map-${mounted}-${pickup.lat}-${pickup.lng}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds pickup={pickup} dropoff={dropoff} />
          
          {/* Pickup marker (green) */}
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={createCustomIcon('#22c55e', 'pickup')}
          />
          
          {/* Dropoff marker (red) */}
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={createCustomIcon('#ef4444', 'dropoff')}
          />
          
          {/* Current location marker (blue, moving) */}
          <Marker
            position={[current.lat, current.lng]}
            icon={createCustomIcon('#3b82f6', 'current')}
          />
          
          {/* Route polyline */}
          <Polyline
            positions={[
              [pickup.lat, pickup.lng],
              [current.lat, current.lng],
              [dropoff.lat, dropoff.lng],
            ]}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray={isTracking ? undefined : '10, 10'}
          />
        </MapContainer>
      </div>
      
      {/* Overlay badge */}
      <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-semibold text-foreground">
            {isTracking ? 'Tracking ON' : 'Tracking OFF'}
          </span>
        </div>
        {progressPct !== undefined && (
          <div className="text-xs text-muted-foreground mb-1">
            Progress: {progressPct}%
          </div>
        )}
        {lastUpdatedAt && (
          <div className="text-xs text-muted-foreground">
            Updated: {formatTime(lastUpdatedAt)}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Pickup</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Dropoff</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};

