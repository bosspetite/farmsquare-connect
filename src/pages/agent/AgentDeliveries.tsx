import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Navigation, Package, RefreshCw } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { formatNaira, formatTimeAgo } from '@/lib/store';
import { StatusPill } from '@/components/ui/StatusPill';
import { MultiDeliveryMap } from '@/modules/delivery-tracking';
import { Order } from '@/types';
import { getDeliveries } from '@/services/agentService';

const AgentDeliveries = () => {
  const navigate = useNavigate();
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getDeliveries();
      setAssignedOrders(data);
      console.log('[AgentDeliveries] Loaded deliveries', { count: data.length });
    } catch (error) {
      console.error('[AgentDeliveries] Failed to load deliveries', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeliveries();
  }, []);

  const inTransitOrders = useMemo(() => assignedOrders.filter((order) => order.status === 'InTransit'), [assignedOrders]);
  const scheduledOrders = useMemo(() => assignedOrders.filter((order) => order.status === 'PickupScheduled'), [assignedOrders]);
  const mappableOrders = useMemo(
    () => assignedOrders.filter((order) => order.tracking?.pickup && order.tracking?.dropoff),
    [assignedOrders]
  );

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Active Deliveries</h1>
            <p className="text-muted-foreground">Manage real delivery assignments from Supabase orders</p>
          </div>
          <button
            onClick={() => void loadDeliveries()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

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
            <p className="text-sm text-muted-foreground">Assigned</p>
          </div>
        </div>

        {mappableOrders.length > 0 && (
          <div className="farm-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Delivery Routes</h3>
                  <p className="text-sm text-muted-foreground">View active delivery routes using real order tracking data</p>
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
                orders={mappableOrders}
                selectedOrderId={selectedOrderId}
                onOrderSelect={(orderId) => setSelectedOrderId(orderId)}
                showFilters
              />
            </div>
          </div>
        )}

        {errorMessage ? (
          <div className="farm-card text-center py-12">
            <Truck className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load deliveries</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        ) : loading ? (
          <div className="farm-card text-center py-12">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading deliveries...</p>
          </div>
        ) : assignedOrders.length > 0 ? (
          <div className="farm-card">
            <h3 className="font-semibold text-foreground mb-4">My Deliveries</h3>
            <div className="space-y-3">
              {assignedOrders.map((order) => (
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
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{order.farmerName} → {order.buyerName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.pickupLocation}
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status} />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/agent/inspections/${order.id}`)}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="farm-card text-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-2">No active deliveries</p>
            <p className="text-sm text-muted-foreground">Deliveries will appear here when qualifying orders exist</p>
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentDeliveries;
