import React from 'react';
import { Truck, MapPin, Clock, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatDate } from '@/lib/store';

const AdminLogistics = () => {
  const state = getAppState();
  const orders = state.orders;
  
  const inTransitOrders = orders.filter(o => o.status === 'InTransit');
  const scheduledOrders = orders.filter(o => o.status === 'PickupScheduled');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

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
            <p className="text-2xl font-semibold text-foreground">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
        </div>

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



