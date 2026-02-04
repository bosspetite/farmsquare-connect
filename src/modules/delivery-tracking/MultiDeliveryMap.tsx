import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getNigerianCityCoords } from './mockLocationStream';
import { Order } from '@/types';
import { getAppState } from '@/lib/store';
import { Package, Truck, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 9.0765, // Abuja, Nigeria
  lng: 7.3986,
};

const defaultZoom = 6;

interface MultiDeliveryMapProps {
  orders: Order[];
  selectedOrderId?: string;
  onOrderSelect?: (orderId: string) => void;
  className?: string;
  showFilters?: boolean;
}

/**
 * Multi-delivery map showing all active deliveries
 * Used in Admin Logistics and Agent operational views
 */
export const MultiDeliveryMap: React.FC<MultiDeliveryMapProps> = ({
  orders,
  selectedOrderId,
  onOrderSelect,
  className,
  showFilters = true,
}) => {
  const [map, setMap] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(selectedOrderId || null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'InTransit' | 'PickupScheduled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const state = getAppState();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Update loading state when API key is missing
  useEffect(() => {
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setIsLoading(false);
      setMapsLoaded(false);
    }
  }, [apiKey]);

  // Filter orders by status
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // Calculate marker positions for each order
  const getOrderMarkers = useCallback(() => {
    return filteredOrders.map((order) => {
      const listing = (state.listings || []).find((l) => l.id === order.listingId);
      const origin = getNigerianCityCoords(listing?.region || order.pickupLocation);
      const destination = getNigerianCityCoords('Lagos'); // Default destination

      return {
        order,
        origin,
        destination,
        // For now, use origin as current location (in real app, this would be agent location)
        currentLocation: origin,
      };
    });
  }, [filteredOrders, state.listings]);

  const markers = getOrderMarkers();

  // Update map bounds when orders change
  useEffect(() => {
    if (map && markers.length > 0 && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(new window.google.maps.LatLng(marker.origin.lat, marker.origin.lng));
        bounds.extend(new window.google.maps.LatLng(marker.destination.lat, marker.destination.lng));
        bounds.extend(new window.google.maps.LatLng(marker.currentLocation.lat, marker.currentLocation.lng));
      });
      map.fitBounds(bounds);
      setIsLoading(false);
    }
  }, [map, markers]);

  // Handle marker click
  const handleMarkerClick = (orderId: string) => {
    setSelectedMarker(orderId);
    if (onOrderSelect) {
      onOrderSelect(orderId);
    }
  };

  // Get marker icon based on status
  const getMarkerIcon = (status: string) => {
    const baseIcon = {
      url: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${status === 'InTransit' ? '#3b82f6' : status === 'PickupScheduled' ? '#f59e0b' : '#22c55e'}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `),
      scaledSize: { width: 32, height: 32 },
      anchor: { x: 16, y: 16 },
    };
    return baseIcon;
  };

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-xl border-2 border-dashed border-border', className)} style={{ minHeight: '500px' }}>
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
      <div className={cn('relative rounded-xl overflow-hidden bg-muted', className)} style={{ minHeight: '500px' }}>
        {/* Status Filters */}
        {showFilters && (
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {(['all', 'PickupScheduled', 'InTransit'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm transition-all',
                  statusFilter === filter
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-white/90 text-foreground hover:bg-white'
                )}
              >
                {filter === 'all' ? 'All' : filter === 'PickupScheduled' ? 'Scheduled' : 'In Transit'}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading deliveries...</p>
            </div>
          </div>
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={defaultZoom}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            mapRef.current = mapInstance;
            setMapsLoaded(true);
            setIsLoading(false);
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
          {/* Render markers for each order */}
          {markers.map((markerData) => {
            const { order, origin, destination, currentLocation } = markerData;
            const isSelected = selectedMarker === order.id;

            return (
              <div key={order.id}>
                {/* Origin marker */}
                {(
                  <Marker
                    position={origin}
                    icon={{
                      url: 'data:image/svg+xml;base64,' + btoa(`
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="2"/>
                          <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>
                      `),
                      scaledSize: { width: 24, height: 24 },
                      anchor: { x: 12, y: 12 },
                    }}
                    onClick={() => handleMarkerClick(order.id)}
                  />
                )}

                {/* Destination marker */}
                {(
                  <Marker
                    position={destination}
                    icon={{
                      url: 'data:image/svg+xml;base64,' + btoa(`
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
                          <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>
                      `),
                      scaledSize: { width: 24, height: 24 },
                      anchor: { x: 12, y: 12 },
                    }}
                    onClick={() => handleMarkerClick(order.id)}
                  />
                )}

                {/* Current location marker (delivery agent) */}
                {order.status === 'InTransit' && (
                  <>
                    {/* Pulsing circle */}
                    <Marker
                      position={currentLocation}
                      icon={{
                        url: 'data:image/svg+xml;base64,' + btoa(`
                          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.3" class="animate-pulse"/>
                          </svg>
                        `),
                        scaledSize: { width: 40, height: 40 },
                        anchor: { x: 20, y: 20 },
                      }}
                    />
                    {/* Truck icon */}
                    <Marker
                      position={currentLocation}
                      icon={{
                        url: 'data:image/svg+xml;base64,' + btoa(`
                          <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="10" width="22" height="14" rx="2" fill="#3b82f6"/>
                            <rect x="5" y="12" width="18" height="10" fill="white" opacity="0.3"/>
                            <circle cx="9" cy="23" r="2.5" fill="#1e40af"/>
                            <circle cx="19" cy="23" r="2.5" fill="#1e40af"/>
                            <rect x="7" y="7" width="14" height="5" rx="1" fill="#3b82f6"/>
                          </svg>
                        `),
                        scaledSize: { width: 28, height: 28 },
                        anchor: { x: 14, y: 24 },
                      }}
                      onClick={() => handleMarkerClick(order.id)}
                    />
                  </>
                )}

                {/* Info window for selected marker */}
                {isSelected && (
                  <InfoWindow
                    position={currentLocation}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-start gap-2 mb-2">
                        <Package className="w-4 h-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">{order.commodity}</p>
                          <p className="text-xs text-muted-foreground">{order.quantityKg}kg</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{order.farmerName} → {order.buyerName}</p>
                        <p className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.status === 'InTransit' ? 'In Transit' : 'Scheduled'}
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </div>
            );
          })}
        </GoogleMap>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Origin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">In Transit</span>
            </div>
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

// Loading skeleton component
const MapLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center bg-muted rounded-xl', className)} style={{ minHeight: '500px' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);


