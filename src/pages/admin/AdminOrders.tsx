import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, CheckCircle, Clock, XCircle, Truck, Eye, Package, User, MapPin, Calendar, Phone, DollarSign, AlertTriangle, CheckCircle2, XCircle as XCircleIcon, RefreshCw, Navigation } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatNaira, formatDate, formatTimeAgo, getWalletByUserId } from '@/lib/store';
import { useOrderStore } from '@/stores/orderStore';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { getProduceImage } from '@/utils/produceImages';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { OrderTrackingMap } from '@/components/tracking/OrderTrackingMap';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { getAllOrders, refreshOrders, subscribe, updateOrderStatus } = useOrderStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Get orders from Zustand store - always refresh first
  const ordersFromStore = useMemo(() => {
    refreshOrders();
    return getAllOrders();
  }, [refreshKey, getAllOrders, refreshOrders]);
  
  // Subscribe to order changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    
    refreshOrders();
    
    const interval = setInterval(() => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    }, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [subscribe, refreshOrders]);

  // Refresh state when refreshKey changes
  const state = useMemo(() => getAppState(), [refreshKey]);

  // Update selectedOrder when state refreshes
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = (state.orders || []).find(o => o.id === selectedOrder.id);
      if (updatedOrder && updatedOrder.status !== selectedOrder.status) {
        setSelectedOrder(updatedOrder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  
  // Get listing images for orders
  const getOrderImage = (order: typeof state.orders[0]) => {
    const listing = (state.listings || []).find(l => l.id === order.listingId);
    if (listing && listing.photos && listing.photos.length > 0) {
      return listing.photos[0];
    }
    return getProduceImage(order.commodity);
  };
  
  const orders = ordersFromStore.filter(order => {
    const matchesSearch = 
      order.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    Pending: ordersFromStore.filter(o => o.status === 'Pending').length,
    Accepted: ordersFromStore.filter(o => o.status === 'Accepted').length,
    InTransit: ordersFromStore.filter(o => o.status === 'InTransit').length,
    Delivered: ordersFromStore.filter(o => o.status === 'Delivered').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Order Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Monitor and manage all platform orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by commodity, farmer, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="PickupScheduled">Pickup Scheduled</option>
            <option value="InTransit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-warning">{statusCounts.Pending}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-info">{statusCounts.Accepted}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Accepted</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-info">{statusCounts.InTransit}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">In Transit</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-success">{statusCounts.Delivered}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Delivered</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">All Orders</h3>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={getOrderImage(order)} 
                        alt={order.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(order.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base">{order.commodity} - {order.quantityKg}kg</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(order.createdAt)}
                        {order.deliveredAt && ` • Delivered ${formatDate(order.deliveredAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex-shrink-0"><StatusPill status={order.status} /></div>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {formatNaira(order.amount)}
                    </span>
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

        {/* Order Details Modal */}
        {selectedOrder && (
          <Modal
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title={`Order Details - ${selectedOrder.commodity}`}
          >
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Order Image and Basic Info */}
              <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img 
                    src={getOrderImage(selectedOrder)} 
                    alt={selectedOrder.commodity} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getProduceImage(selectedOrder.commodity);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">{selectedOrder.commodity}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedOrder.quantityKg}kg</p>
                  <StatusPill status={selectedOrder.status} />
                </div>
              </div>

              {/* Financial Information */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Financial Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price per kg</span>
                    <span className="text-sm font-medium text-foreground">{formatNaira(selectedOrder.pricePerKg)}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <span className="text-sm font-medium text-foreground">{selectedOrder.quantityKg}kg</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">Total Amount</span>
                    <span className="text-lg font-bold text-primary">{formatNaira(selectedOrder.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Parties Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-farm-info" />
                    <h4 className="font-semibold text-foreground text-sm">Farmer</h4>
                  </div>
                  <p className="font-medium text-foreground">{selectedOrder.farmerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {selectedOrder.farmerId}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-farm-success" />
                    <h4 className="font-semibold text-foreground text-sm">Buyer</h4>
                  </div>
                  <p className="font-medium text-foreground">{selectedOrder.buyerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {selectedOrder.buyerId}</p>
                </div>
              </div>

              {/* Location Information */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Pickup Location</h4>
                </div>
                <p className="text-sm text-foreground">{selectedOrder.pickupLocation}</p>
              </div>

              {/* Order Tracking Map */}
              {selectedOrder.tracking && selectedOrder.tracking.pickup && selectedOrder.tracking.dropoff && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Order Tracking</h4>
                  </div>
                  <OrderTrackingMap
                    pickup={selectedOrder.tracking.pickup}
                    dropoff={selectedOrder.tracking.dropoff}
                    current={selectedOrder.tracking.current || selectedOrder.tracking.pickup}
                    isTracking={selectedOrder.tracking.isTracking || false}
                    progressPct={selectedOrder.tracking.progressPct}
                    lastUpdatedAt={selectedOrder.tracking.lastUpdatedAt}
                  />
                </div>
              )}

              {/* Timeline Information */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Timeline</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Created</span>
                    <span className="text-foreground">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.acceptedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accepted</span>
                      <span className="text-foreground">{formatDate(selectedOrder.acceptedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.processingAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing</span>
                      <span className="text-foreground">{formatDate(selectedOrder.processingAt)}</span>
                    </div>
                  )}
                  {selectedOrder.pickupScheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pickup Scheduled</span>
                      <span className="text-foreground">{formatDate(selectedOrder.pickupScheduledAt)}</span>
                    </div>
                  )}
                  {selectedOrder.inTransitAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In Transit</span>
                      <span className="text-foreground">{formatDate(selectedOrder.inTransitAt)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="text-foreground">{formatDate(selectedOrder.deliveredAt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Time Since Creation</span>
                    <span className="text-foreground font-medium">{formatTimeAgo(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Information */}
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const farmerWallet = getWalletByUserId(selectedOrder.farmerId);
                  const buyerWallet = getWalletByUserId(selectedOrder.buyerId);
                  return (
                    <>
                      <div className="p-4 bg-farm-info/5 border border-farm-info/20 rounded-xl">
                        <h4 className="font-semibold text-foreground text-sm mb-2">Farmer Wallet</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available</span>
                            <span className="text-foreground">{formatNaira(farmerWallet?.available || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending</span>
                            <span className="text-foreground">{formatNaira(farmerWallet?.pending || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-farm-success/5 border border-farm-success/20 rounded-xl">
                        <h4 className="font-semibold text-foreground text-sm mb-2">Buyer Wallet</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available</span>
                            <span className="text-foreground">{formatNaira(buyerWallet?.available || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">In Escrow</span>
                            <span className="text-foreground">{formatNaira(buyerWallet?.pending || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Admin Actions */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Admin Actions
                </h4>
                <div className="space-y-2">
                  {selectedOrder.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'Accepted');
                          refreshOrders();
                          setRefreshKey(prev => prev + 1);
                          toast({ title: 'Order status updated to Accepted' });
                          setRefreshKey(prev => prev + 1);
                          setSelectedOrder({ ...selectedOrder, status: 'Accepted' });
                        }}
                        className="flex-1 px-4 py-2.5 bg-farm-success text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept Order
                      </button>
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'Rejected');
                          toast({ title: 'Order status updated to Rejected' });
                          setRefreshKey(prev => prev + 1);
                          setSelectedOrder({ ...selectedOrder, status: 'Rejected' });
                        }}
                        className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Reject Order
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'Accepted' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'Processing');
                        refreshOrders();
                        setRefreshKey(prev => prev + 1);
                        toast({ title: 'Order status updated to Processing' });
                        setSelectedOrder({ ...selectedOrder, status: 'Processing' });
                      }}
                      className="w-full px-4 py-2.5 bg-farm-info text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Mark as Processing
                    </button>
                  )}
                  {selectedOrder.status === 'Processing' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'PickupScheduled');
                        refreshOrders();
                        setRefreshKey(prev => prev + 1);
                        toast({ title: 'Order status updated to Pickup Scheduled' });
                        setSelectedOrder({ ...selectedOrder, status: 'PickupScheduled' });
                      }}
                      className="w-full px-4 py-2.5 bg-farm-info text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Mark as Pickup Scheduled
                    </button>
                  )}
                  {selectedOrder.status === 'PickupScheduled' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'InTransit');
                        refreshOrders();
                        setRefreshKey(prev => prev + 1);
                        toast({ title: 'Order status updated to In Transit' });
                        setSelectedOrder({ ...selectedOrder, status: 'InTransit' });
                      }}
                      className="w-full px-4 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Mark as In Transit
                    </button>
                  )}
                  {selectedOrder.status === 'InTransit' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'Delivered');
                        refreshOrders();
                        setRefreshKey(prev => prev + 1);
                        toast({ title: 'Order status updated to Delivered' });
                        setSelectedOrder({ ...selectedOrder, status: 'Delivered' });
                      }}
                      className="w-full px-4 py-2.5 bg-farm-success text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Delivered
                    </button>
                  )}
                  {/* Allow admin to update any status directly */}
                  {!['Pending', 'Accepted', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered', 'Rejected'].includes(selectedOrder.status) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">Quick Status Update:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'Processing');
                            refreshOrders();
                            setRefreshKey(prev => prev + 1);
                            toast({ title: 'Order status updated to Processing' });
                            setSelectedOrder({ ...selectedOrder, status: 'Processing' });
                          }}
                          className="px-3 py-2 bg-farm-info/10 text-farm-info rounded-lg text-xs font-medium hover:bg-farm-info/20 transition-colors"
                        >
                          Processing
                        </button>
                        <button
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'PickupScheduled');
                            refreshOrders();
                            setRefreshKey(prev => prev + 1);
                            toast({ title: 'Order status updated to Pickup Scheduled' });
                            setSelectedOrder({ ...selectedOrder, status: 'PickupScheduled' });
                          }}
                          className="px-3 py-2 bg-farm-info/10 text-farm-info rounded-lg text-xs font-medium hover:bg-farm-info/20 transition-colors"
                        >
                          Pickup Scheduled
                        </button>
                        <button
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'InTransit');
                            refreshOrders();
                            setRefreshKey(prev => prev + 1);
                            toast({ title: 'Order status updated to In Transit' });
                            setSelectedOrder({ ...selectedOrder, status: 'InTransit' });
                          }}
                          className="px-3 py-2 bg-farm-warning/10 text-farm-warning rounded-lg text-xs font-medium hover:bg-farm-warning/20 transition-colors"
                        >
                          In Transit
                        </button>
                        <button
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'Delivered');
                            refreshOrders();
                            setRefreshKey(prev => prev + 1);
                            toast({ title: 'Order status updated to Delivered' });
                            setSelectedOrder({ ...selectedOrder, status: 'Delivered' });
                          }}
                          className="px-3 py-2 bg-farm-success/10 text-farm-success rounded-lg text-xs font-medium hover:bg-farm-success/20 transition-colors"
                        >
                          Delivered
                        </button>
                      </div>
                    </div>
                  )}
                  {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Rejected') && (
                    <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground text-center">
                      Order is {selectedOrder.status === 'Delivered' ? 'completed' : 'rejected'}. No further actions available.
                    </div>
                  )}
                </div>
              </div>

              {/* Order ID */}
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono text-foreground mt-1">{selectedOrder.id}</p>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;



