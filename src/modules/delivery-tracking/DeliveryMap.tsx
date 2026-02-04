import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { Location } from './mockLocationStream';
import { Truck, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 9.0765, // Abuja, Nigeria
  lng: 7.3986,
};

const defaultZoom = 7;

interface DeliveryMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  currentLocation: Location | null;
  className?: string;
  showInfoPanel?: boolean;
  orderInfo?: {
    commodity: string;
    quantity: string;
    status: string;
    eta?: number;
    distanceRemaining?: number;
  };
}

/**
 * DeliveryMap component - Shows delivery route and live tracking
 */
export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  origin,
  destination,
  currentLocation,
  className,
  showInfoPanel = true,
  orderInfo,
}) => {
  const [directions, setDirections] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const directionsServiceRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Log API key status (without exposing the key)
  useEffect(() => {
    if (apiKey && apiKey !== 'your_google_maps_api_key_here' && apiKey.trim() !== '') {
      console.log('✅ Google Maps API key configured');
    } else {
      console.warn('⚠️ Google Maps API key not configured. Maps will not load.');
      setIsLoading(false);
      setMapsLoaded(false);
    }
  }, [apiKey]);

  // Calculate route using Directions API
  const calculateRoute = useCallback(() => {
    if (!directionsServiceRef.current || !window.google?.maps) {
      setIsLoading(false);
      return;
    }

    try {
      if (!window.google?.maps) {
        setIsLoading(false);
        return;
      }
      directionsServiceRef.current.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            setIsLoading(false);
          } else {
            console.error('Directions request failed:', status);
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error calculating route:', error);
      setIsLoading(false);
    }
  }, [origin, destination]);

  // Calculate route when map and directions service are ready
  useEffect(() => {
    if (mapsLoaded && directionsServiceRef.current && window.google?.maps) {
      calculateRoute();
    }
  }, [mapsLoaded, calculateRoute]);

  // Update map bounds when location changes
  useEffect(() => {
    if (map && currentLocation && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));
      bounds.extend(new window.google.maps.LatLng(destination.lat, destination.lng));
      bounds.extend(new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng));
      map.fitBounds(bounds);
    }
  }, [map, currentLocation, origin, destination]);

  // Format ETA
  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-xl border-2 border-dashed border-border', className)} style={{ minHeight: '400px' }}>
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold text-lg mb-2">Google Maps Not Configured</p>
          <p className="text-sm text-muted-foreground mb-4">
            To enable map tracking, please add your Google Maps API key to the .env file
          </p>
          <div className="bg-card border border-border rounded-lg p-4 text-left text-xs space-y-2">
            <p className="font-semibold text-foreground">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Get API key from Google Cloud Console</li>
              <li>Enable Maps JavaScript API & Directions API</li>
              <li>Add to .env: <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your_key</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            See ENV_SETUP.md for detailed instructions
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={apiKey} 
      loadingElement={<MapLoadingSkeleton className={className} />}
    >
      <div className={cn('relative rounded-xl overflow-hidden bg-muted', className)} style={{ minHeight: '400px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading route...</p>
            </div>
          </div>
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : defaultCenter}
          zoom={defaultZoom}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            setMapsLoaded(true);
            setIsLoading(false);
            // Initialize directions service after map loads
            if (window.google?.maps && directionsServiceRef.current === null) {
              try {
                directionsServiceRef.current = new window.google.maps.DirectionsService();
                calculateRoute();
              } catch (error) {
                console.error('Error initializing DirectionsService:', error);
              }
            }
          }}
          onUnmount={() => {
            setMapsLoaded(false);
          }}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
            }}
          >
          {/* Route */}
          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}

          {/* Origin marker */}
          {(
            <Marker
              position={origin}
              icon={{
                url: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#22c55e" stroke="white" stroke-width="2"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                  </svg>
                `),
                scaledSize: { width: 32, height: 32 },
                anchor: { x: 16, y: 16 },
              }}
              label={{
                text: 'Origin',
                className: 'text-xs sm:text-sm font-semibold text-foreground bg-white px-2 py-1 rounded shadow',
              }}
            />
          )}

          {/* Destination marker */}
          {(
            <Marker
              position={destination}
              icon={{
                url: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="2"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                  </svg>
                `),
                scaledSize: { width: 32, height: 32 },
                anchor: { x: 16, y: 16 },
              }}
              label={{
                text: 'Destination',
                className: 'text-xs sm:text-sm font-semibold text-foreground bg-white px-2 py-1 rounded shadow',
              }}
            />
          )}

          {/* Current location marker (delivery agent) - with pulsing effect */}
          {currentLocation && (
            <>
              {/* Pulsing circle */}
              <Marker
                position={currentLocation}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="24" cy="24" r="20" fill="#3b82f6" opacity="0.3" class="animate-pulse"/>
                    </svg>
                  `),
                  scaledSize: { width: 48, height: 48 },
                  anchor: { x: 24, y: 24 },
                }}
              />
              {/* Truck icon */}
              <Marker
                position={currentLocation}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="12" width="24" height="16" rx="2" fill="#3b82f6"/>
                      <rect x="6" y="14" width="20" height="12" fill="white" opacity="0.3"/>
                      <circle cx="10" cy="26" r="3" fill="#1e40af"/>
                      <circle cx="22" cy="26" r="3" fill="#1e40af"/>
                      <rect x="8" y="8" width="16" height="6" rx="1" fill="#3b82f6"/>
                    </svg>
                  `),
                  scaledSize: { width: 32, height: 32 },
                  anchor: { x: 16, y: 28 },
                }}
                label={{
                  text: 'Delivery Agent',
                  className: 'text-xs sm:text-sm font-semibold text-foreground bg-white px-2 py-1 rounded shadow',
                }}
              />
            </>
          )}
        </GoogleMap>

        {/* Info Panel - Outside GoogleMap so it overlays properly */}
        {showInfoPanel && orderInfo && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-card border border-border rounded-xl p-4 shadow-lg z-10">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{orderInfo.commodity}</h3>
                <p className="text-sm text-muted-foreground">{orderInfo.quantity}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground">{orderInfo.status}</span>
              </div>

              {orderInfo.eta !== undefined && orderInfo.eta > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    ETA
                  </span>
                  <span className="font-medium text-primary">{formatETA(orderInfo.eta)}</span>
                </div>
              )}

              {orderInfo.distanceRemaining !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance Remaining</span>
                  <span className="font-medium text-foreground">{orderInfo.distanceRemaining} km</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

// Loading skeleton component
const MapLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center bg-muted rounded-xl', className)} style={{ minHeight: '400px' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

