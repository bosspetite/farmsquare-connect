import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Package, CheckCircle, Clock, AlertCircle, Eye, MapPin } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAppState, formatNaira, formatDate, formatTimeAgo } from '@/lib/store';
import { StatusPill } from '@/components/ui/StatusPill';
import { getProduceImage } from '@/utils/produceImages';

const AgentInspections = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const orders = state.orders;
  
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
  const inProgressOrders = orders.filter(o => ['PickupScheduled', 'InTransit', 'Processing'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Inspections</h1>
          <p className="text-muted-foreground">Manage produce inspections and quality grading</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{pendingOrders.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{inProgressOrders.length}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{completedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Pending Inspections */}
        {pendingOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-farm-warning" />
              <h3 className="font-semibold text-foreground">Pending Inspections</h3>
            </div>
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const listing = (state.listings || []).find(l => l.id === order.listingId);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/agent/inspections/${order.id}`)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(order.commodity)} 
                        alt={order.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(order.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{order.commodity}</p>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                          {order.quantityKg}kg
                        </span>
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
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusPill status={order.status} />
                      <span className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/agent/inspections/${order.id}`);
                        }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgressOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-farm-info" />
              <h3 className="font-semibold text-foreground">In Progress</h3>
            </div>
            <div className="space-y-3">
              {inProgressOrders.map((order) => {
                const listing = (state.listings || []).find(l => l.id === order.listingId);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/agent/inspections/${order.id}`)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-farm-info/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(order.commodity)} 
                        alt={order.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(order.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{order.commodity}</p>
                        <span className="px-2 py-0.5 bg-farm-info/10 text-farm-info rounded text-xs font-medium">
                          {order.quantityKg}kg
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.pickupLocation}
                        </span>
                        {order.pickupScheduledAt && (
                          <>
                            <span>•</span>
                            <span>Scheduled {formatDate(order.pickupScheduledAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusPill status={order.status} />
                      <span className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/agent/inspections/${order.id}`);
                        }}
                        className="px-3 py-1.5 bg-farm-info text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedOrders.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-farm-success" />
              <h3 className="font-semibold text-foreground">Completed Inspections</h3>
            </div>
            <div className="space-y-3">
              {completedOrders.slice(0, 10).map((order) => {
                const listing = (state.listings || []).find(l => l.id === order.listingId);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/agent/inspections/${order.id}`)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-farm-success/20 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(order.commodity)} 
                        alt={order.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(order.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{order.commodity}</p>
                        <span className="px-2 py-0.5 bg-farm-success/10 text-farm-success rounded text-xs font-medium">
                          {order.quantityKg}kg
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      {order.deliveredAt && (
                        <p className="text-xs text-muted-foreground">
                          Delivered {formatDate(order.deliveredAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusPill status={order.status} />
                      <span className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="farm-card text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No inspections found</p>
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentInspections;

