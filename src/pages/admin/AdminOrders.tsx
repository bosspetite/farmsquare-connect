import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAllOrders, updateOrderStatus, getProfile } from '@/services/databaseService';
import { formatNaira, formatDate, formatTimeAgo } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { getProduceImage } from '@/utils/produceImages';
import { toast } from '@/hooks/use-toast';

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [buyerNames, setBuyerNames] = useState<Record<string, string>>({});
  const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const allOrders = await getAllOrders();
        setOrders(allOrders);

        // Load buyer and farmer names
        const buyerIds = [...new Set(allOrders.map(o => o.buyer_id))];
        const farmerIds = [...new Set(allOrders.map(o => o.farmer_id))];
        
        const buyerMap: Record<string, string> = {};
        const farmerMap: Record<string, string> = {};
        
        for (const id of buyerIds) {
          const prof = await getProfile(id);
          if (prof) buyerMap[id] = prof.full_name;
        }
        for (const id of farmerIds) {
          const prof = await getProfile(id);
          if (prof) farmerMap[id] = prof.full_name;
        }
        
        setBuyerNames(buyerMap);
        setFarmerNames(farmerMap);
      } catch (err: any) {
        console.error('Error loading orders:', err);
        toast({ title: 'Failed to load orders', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyerNames[order.buyer_id]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmerNames[order.farmer_id]?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Accepted: orders.filter(o => o.status === 'Accepted').length,
    InTransit: orders.filter(o => o.status === 'InTransit').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Order Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View and manage all platform orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders..."
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
            <option value="Processing">Processing</option>
            <option value="InTransit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{statusCounts.Pending}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{statusCounts.Accepted}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Accepted</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{statusCounts.InTransit}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">In Transit</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{statusCounts.Delivered}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Delivered</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Orders</h3>
            <p className="text-sm text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    <img 
                      src={getProduceImage('Maize')} 
                      alt="Produce" 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <p className="font-semibold text-foreground text-sm sm:text-base">Order #{order.id.slice(0, 8)}</p>
                        <StatusPill status={order.status} />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                        {farmerNames[order.farmer_id] || 'Unknown'} → {buyerNames[order.buyer_id] || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="text-right sm:text-left">
                      <p className="text-sm sm:text-base font-semibold text-primary">{formatNaira(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
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
            title={`Order #${selectedOrder.id.slice(0, 8)}`}
          >
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <StatusPill status={selectedOrder.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                    <p className="text-sm font-medium text-foreground">{selectedOrder.payment_status || 'Unpaid'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Farmer</p>
                    <p className="text-sm font-medium text-foreground">{farmerNames[selectedOrder.farmer_id] || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Buyer</p>
                    <p className="text-sm font-medium text-foreground">{buyerNames[selectedOrder.buyer_id] || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-sm font-medium text-primary">{formatNaira(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>
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
