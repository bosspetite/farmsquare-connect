import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Search, Eye, RefreshCw, Calendar, DollarSign, MapPin, User } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatDate, formatNaira, formatTimeAgo } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { AdminOrderActivityItem, getAllEscrows, getAllOrders, getOrderActivityTimeline } from '@/services/adminService';
import { Escrow, Order } from '@/types';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [escrowByOrderId, setEscrowByOrderId] = useState<Record<string, Escrow>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderActivity, setOrderActivity] = useState<AdminOrderActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [orderRows, escrowRows] = await Promise.all([getAllOrders(), getAllEscrows()]);
      setOrders(orderRows);
      setEscrowByOrderId(
        escrowRows.reduce<Record<string, Escrow>>((acc, escrow) => {
          acc[escrow.orderId] = escrow;
          return acc;
        }, {})
      );
      console.log('[AdminOrders] Loaded orders', { count: orderRows.length, escrows: escrowRows.length });
    } catch (error) {
      console.error('[AdminOrders] Failed to load orders', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load orders from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    let active = true;

    const loadOrderActivity = async () => {
      if (!selectedOrder) {
        setOrderActivity([]);
        return;
      }

      try {
        setActivityLoading(true);
        const timeline = await getOrderActivityTimeline(selectedOrder.id);
        if (!active) return;
        setOrderActivity(timeline);
      } catch (error) {
        console.error('[AdminOrders] Failed to load order activity timeline', error);
        if (!active) return;
        setOrderActivity([]);
      } finally {
        if (active) {
          setActivityLoading(false);
        }
      }
    };

    void loadOrderActivity();

    return () => {
      active = false;
    };
  }, [selectedOrder]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch =
          order.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.buyerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [filterStatus, orders, searchQuery]
  );

  const statusCounts = {
    Paid: orders.filter((order) => order.status === 'Paid').length,
    Accepted: orders.filter((order) => order.status === 'Accepted').length,
    InTransit: orders.filter((order) => order.status === 'InTransit').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Order Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Monitor paid orders, disputes, and escrow status</p>
          </div>
          <button
            onClick={() => void loadOrders()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by commodity, farmer, or buyer..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Accepted">Accepted</option>
            <option value="Processing">Preparing</option>
            <option value="InTransit">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Disputed">Disputed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-warning">{statusCounts.Paid}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Paid</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-info">{statusCounts.Accepted}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Accepted</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-info">{statusCounts.InTransit}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Out for Delivery</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-success">{statusCounts.Delivered}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Delivered</p>
          </div>
        </div>

        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">All Orders</h3>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Could not load orders</p>
              <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => void loadOrders()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base">{order.commodity} - {order.quantityKg}kg</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {order.farmerName}
                      {' -> '}
                      {order.buyerName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.pickupLocation} - {formatTimeAgo(order.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escrow: {escrowByOrderId[order.id]?.status || 'n/a'} - Payment: {order.paymentStatus || 'Unpaid'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <StatusPill status={order.status} />
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{formatNaira(order.amount)}</span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedOrder && (
          <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order Details - ${selectedOrder.commodity}`}>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{selectedOrder.commodity}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.quantityKg}kg - {formatNaira(selectedOrder.pricePerKg)}/kg</p>
                  </div>
                  <StatusPill status={selectedOrder.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-farm-info" />
                    <h4 className="font-semibold text-foreground text-sm">Farmer</h4>
                  </div>
                  <p className="font-medium text-foreground">{selectedOrder.farmerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedOrder.farmerId}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-farm-success" />
                    <h4 className="font-semibold text-foreground text-sm">Buyer</h4>
                  </div>
                  <p className="font-medium text-foreground">{selectedOrder.buyerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedOrder.buyerId}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Pickup Location</h4>
                </div>
                <p className="text-sm text-foreground">{selectedOrder.pickupLocation}</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Timeline</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.acceptedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accepted</span>
                      <span className="text-foreground">{formatDate(selectedOrder.acceptedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="text-foreground">{formatDate(selectedOrder.deliveredAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Activity Tracking</h4>
                </div>
                {activityLoading ? (
                  <p className="text-xs text-muted-foreground">Loading activity...</p>
                ) : orderActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tracked activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orderActivity.map((activity) => (
                      <div key={activity.id} className="border-l-2 border-primary/30 pl-3">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Financial Details</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">{formatNaira(selectedOrder.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="text-foreground">{selectedOrder.paymentStatus || 'Unpaid'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Status</span>
                    <span className="text-foreground">{escrowByOrderId[selectedOrder.id]?.status || 'n/a'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
