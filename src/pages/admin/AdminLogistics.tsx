import React, { useEffect, useMemo, useState } from 'react';
import { Truck, MapPin, Clock, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatDate } from '@/lib/store';
import { MultiDeliveryMap } from '@/modules/delivery-tracking';
import { getAllOrders } from '@/services/adminService';
import { Order } from '@/types';

const AdminLogistics = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getAllOrders();
      setOrders(data);
      console.log('[AdminLogistics] Loaded logistics orders', { count: data.length });
    } catch (error) {
      console.error('[AdminLogistics] Failed to load logistics data', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load logistics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const inTransitOrders = useMemo(() => orders.filter((order) => order.status === 'InTransit'), [orders]);
  const scheduledOrders = useMemo(() => orders.filter((order) => order.status === 'PickupScheduled'), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === 'Delivered'), [orders]);
  const activeDeliveries = useMemo(
    () => [...inTransitOrders, ...scheduledOrders].filter((order) => order.tracking?.pickup && order.tracking?.dropoff),
    [inTransitOrders, scheduledOrders]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Logistics Management</h1>
            <p className="text-muted-foreground">Monitor real order fulfillment and delivery status</p>
          </div>
          <button
            onClick={() => void loadOrders()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <Clock className="w-8 h-8 text-farm-info mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{scheduledOrders.length}</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </div>
          <div className="farm-card text-center">
            <Truck className="w-8 h-8 text-farm-info mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{inTransitOrders.length}</p>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </div>
          <div className="farm-card text-center">
            <CheckCircle className="w-8 h-8 text-farm-success mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{deliveredOrders.length}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </div>
          <div className="farm-card text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{activeDeliveries.length}</p>
            <p className="text-sm text-muted-foreground">Active Deliveries</p>
          </div>
        </div>

        {activeDeliveries.length > 0 && (
          <div className="farm-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Live Delivery Map</h3>
                  <p className="text-sm text-muted-foreground">Monitor active deliveries with real tracking data</p>
                </div>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Orders
                </button>
              </div>
            </div>
            <div className="h-[600px]">
              <MultiDeliveryMap
                orders={activeDeliveries}
                selectedOrderId={selectedOrderId}
                onOrderSelect={(orderId) => {
                  setSelectedOrderId(orderId);
                  navigate('/admin/orders');
                }}
                showFilters
              />
            </div>
          </div>
        )}

        {errorMessage ? (
          <div className="farm-card text-center py-12">
            <Truck className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load logistics data</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        ) : loading ? (
          <div className="farm-card text-center py-12">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading logistics data...</p>
          </div>
        ) : (
          <>
            {scheduledOrders.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-farm-info" />
                  <h3 className="font-semibold text-foreground">Scheduled Pickups</h3>
                </div>
                <div className="space-y-3">
                  {scheduledOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                        <p className="text-sm text-muted-foreground">Pickup: {order.pickupLocation}</p>
                        {order.pickupScheduledAt && (
                          <p className="text-xs text-muted-foreground mt-1">Scheduled {formatDate(order.pickupScheduledAt)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{order.farmerName} → {order.buyerName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inTransitOrders.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-farm-info" />
                  <h3 className="font-semibold text-foreground">In Transit</h3>
                </div>
                <div className="space-y-3">
                  {inTransitOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                        <p className="text-sm text-muted-foreground">{order.farmerName} → {order.buyerName}</p>
                        {order.inTransitAt && <p className="text-xs text-muted-foreground mt-1">Started {formatDate(order.inTransitAt)}</p>}
                      </div>
                      <p className="text-sm font-medium text-foreground">In Transit</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deliveredOrders.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-farm-success" />
                  <h3 className="font-semibold text-foreground">Recently Delivered</h3>
                </div>
                <div className="space-y-3">
                  {deliveredOrders.slice(0, 10).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                        <p className="text-sm text-muted-foreground">{order.farmerName} → {order.buyerName}</p>
                        {order.deliveredAt && <p className="text-xs text-muted-foreground mt-1">Delivered {formatDate(order.deliveredAt)}</p>}
                      </div>
                      <p className="text-sm font-medium text-farm-success">Delivered</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <div className="farm-card text-center py-12">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No logistics data available</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogistics;
