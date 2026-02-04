import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Play, Square, Navigation, Package } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAppState, formatNaira, formatTimeAgo } from '@/lib/store';
import { StatusPill } from '@/components/ui/StatusPill';
import { MultiDeliveryMap } from '@/modules/delivery-tracking';
import { MockLocationStream, getNigerianCityCoords } from '@/modules/delivery-tracking';
import { Order } from '@/types';
import { useOrderStore } from '@/stores/orderStore';
import { toast } from '@/hooks/use-toast';

const AgentDeliveries = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const { getAllOrders, refreshOrders, subscribe, startTracking, stopTracking } = useOrderStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to order changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    
    refreshOrders();
    
    const interval = setInterval(() => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    }, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [subscribe, refreshOrders]);

  // Get orders assigned to agent (for now, all in-transit and scheduled orders)
  const assignedOrders = useMemo(() => {
    refreshOrders();
    return getAllOrders().filter(
      (o) => o.status === 'InTransit' || o.status === 'PickupScheduled' || o.status === 'Accepted' || o.status === 'Processing'
    );
  }, [refreshKey, getAllOrders, refreshOrders]);

  const inTransitOrders = assignedOrders.filter((o) => o.status === 'InTransit');
  const scheduledOrders = assignedOrders.filter((o) => o.status === 'PickupScheduled');

  // Start tracking for an order using shared store
  const handleStartTracking = (order: Order) => {
    const { updateOrderTracking } = useOrderStore.getState();
    
    if (!order.tracking || !order.tracking.pickup || !order.tracking.dropoff) {
      // Initialize tracking if missing
      const listing = (state.listings || []).find((l) => l.id === order.listingId);
      const pickup = order.farmerLocation || getNigerianCityCoords(listing?.region || order.pickupLocation || 'Lagos');
      const dropoff = order.deliveryLocation || order.buyerLocation || getNigerianCityCoords('Lagos');
      
      if (pickup && dropoff) {
        // Update order with tracking data first
        updateOrderTracking(order.id, {
          pickup,
          dropoff,
          current: pickup,
          isTracking: false,
          progressPct: 0,
        });
        // Wait a bit for state to update
        setTimeout(() => {
          startTracking(order.id);
          setRefreshKey(prev => prev + 1);
        }, 100);
        return;
      } else {
        toast({
          title: 'Cannot start tracking',
          description: 'Order is missing location data',
          variant: 'destructive',
        });
        return;
      }
    }
    
    startTracking(order.id);
    setRefreshKey(prev => prev + 1);
  };

  // Stop tracking for an order
  const handleStopTracking = (orderId: string) => {
    stopTracking(orderId);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Active Deliveries</h1>
          <p className="text-muted-foreground">Manage and track your assigned deliveries</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="farm-card text-center">
            <Truck className="w-8 h-8 text-farm-info mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{inTransitOrders.length}</p>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </div>
          <div className="farm-card text-center">
            <MapPin className="w-8 h-8 text-farm-warning mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{scheduledOrders.length}</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </div>
          <div className="farm-card text-center">
            <Package className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{assignedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Total Assigned</p>
          </div>
        </div>

        {/* Operational Map */}
        {assignedOrders.length > 0 && (
          <div className="farm-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Delivery Routes</h3>
                  <p className="text-sm text-muted-foreground">
                    View all your assigned deliveries and suggested routes
                  </p>
                </div>
                <button
                  onClick={() => navigate('/agent/inspections')}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  View Inspections
                </button>
              </div>
            </div>
            <div className="h-[500px]">
              <MultiDeliveryMap
                orders={assignedOrders}
                selectedOrderId={selectedOrderId}
                onOrderSelect={(orderId) => {
                  setSelectedOrderId(orderId);
                }}
                showFilters={true}
              />
            </div>
          </div>
        )}

        {/* Assigned Deliveries List */}
        {assignedOrders.length > 0 ? (
          <div className="farm-card">
            <h3 className="font-semibold text-foreground mb-4">My Deliveries</h3>
            <div className="space-y-3">
              {assignedOrders.map((order) => {
                const listing = (state.listings || []).find((l) => l.id === order.listingId);
                const isTracking = order.tracking?.isTracking || false;
                const canStartTracking = ['Accepted', 'Processing', 'PickupScheduled'].includes(order.status);

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{order.commodity}</p>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                            {order.quantityKg}kg
                          </span>
                          {isTracking && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs font-medium flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Tracking
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {order.farmerName} → {order.buyerName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.pickupLocation}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(order.createdAt)}</span>
                          {order.tracking?.progressPct !== undefined && (
                            <>
                              <span>•</span>
                              <span>Progress: {order.tracking.progressPct}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={order.status} />
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</p>
                      </div>
                      {canStartTracking && (
                        <button
                          onClick={() => handleStartTracking(order)}
                          disabled={isTracking}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="w-4 h-4" />
                          Start Tracking
                        </button>
                      )}
                      {isTracking && (
                        <button
                          onClick={() => handleStopTracking(order.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Square className="w-4 h-4" />
                          Stop Tracking
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/buyer/orders/${order.id}`)}
                        className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="farm-card text-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-2">No active deliveries</p>
            <p className="text-sm text-muted-foreground">
              Deliveries will appear here when orders are assigned to you
            </p>
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentDeliveries;









