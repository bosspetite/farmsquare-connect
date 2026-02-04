import React, { useState } from 'react';
import { Truck, MapPin, Clock, CheckCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatDate } from '@/lib/store';
import { MultiDeliveryMap } from '@/modules/delivery-tracking';
import { Order } from '@/types';

const AdminLogistics = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const orders = state.orders;
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  
  const inTransitOrders = orders.filter(o => o.status === 'InTransit');
  const scheduledOrders = orders.filter(o => o.status === 'PickupScheduled');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const activeDeliveries = [...inTransitOrders, ...scheduledOrders];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Logistics Management</h1>
          <p className="text-muted-foreground">Monitor order fulfillment and delivery status</p>
        </div>

        {/* Stats */}
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

        {/* Logistics Overview Map */}
        {activeDeliveries.length > 0 && (
          <div className="farm-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Live Delivery Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor all active deliveries across Nigeria
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View All Orders
                </button>
              </div>
            </div>
            <div className="h-[600px]">
              <MultiDeliveryMap
                orders={activeDeliveries}
                selectedOrderId={selectedOrderId}
                onOrderSelect={(orderId) => {
                  setSelectedOrderId(orderId);
                  navigate(`/admin/orders`);
                }}
                showFilters={true}
              />
            </div>
          </div>
        )}

        {/* Scheduled Pickups */}
        {scheduledOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-farm-info" />
              <h3 className="font-semibold text-foreground">Scheduled Pickups</h3>
            </div>
            <div className="space-y-3">
              {scheduledOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                      <p className="text-sm text-muted-foreground">
                        Pickup: {order.pickupLocation}
                      </p>
                      {order.pickupScheduledAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled {formatDate(order.pickupScheduledAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{order.farmerName} → {order.buyerName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In Transit */}
        {inTransitOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-farm-info" />
              <h3 className="font-semibold text-foreground">In Transit</h3>
            </div>
            <div className="space-y-3">
              {inTransitOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Truck className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                      <p className="text-sm text-muted-foreground">
                        {order.pickupLocation} → {order.buyerName}
                      </p>
                      {order.inTransitAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Started {formatDate(order.inTransitAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">In Transit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Delivered */}
        {deliveredOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-farm-success" />
              <h3 className="font-semibold text-foreground">Recently Delivered</h3>
            </div>
            <div className="space-y-3">
              {deliveredOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-farm-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                      <p className="text-sm text-muted-foreground">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      {order.deliveredAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivered {formatDate(order.deliveredAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-farm-success">Delivered</p>
                  </div>
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
      </div>
    </AdminLayout>
  );
};

export default AdminLogistics;



