import React from 'react';
import { ShoppingCart, Search, CheckCircle, Clock, XCircle, Truck, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatNaira, formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { getProduceImage } from '@/utils/produceImages';
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  
  // Get listing images for orders
  const getOrderImage = (order: typeof state.orders[0]) => {
    const listing = state.listings.find(l => l.id === order.listingId);
    if (listing && listing.photos && listing.photos.length > 0) {
      return listing.photos[0];
    }
    return getProduceImage(order.commodity);
  };
  
  const orders = state.orders.filter(order => {
    const matchesSearch = 
      order.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    Pending: state.orders.filter(o => o.status === 'Pending').length,
    Accepted: state.orders.filter(o => o.status === 'Accepted').length,
    InTransit: state.orders.filter(o => o.status === 'InTransit').length,
    Delivered: state.orders.filter(o => o.status === 'Delivered').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Order Management</h1>
          <p className="text-muted-foreground">Monitor and manage all platform orders</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{statusCounts.Pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{statusCounts.Accepted}</p>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{statusCounts.InTransit}</p>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{statusCounts.Delivered}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
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
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                      <p className="text-sm text-muted-foreground">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(order.createdAt)}
                        {order.deliveredAt && ` • Delivered ${formatDate(order.deliveredAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status} />
                    <span className="text-sm font-semibold text-foreground">
                      {formatNaira(order.amount)}
                    </span>
                    <button
                      onClick={() => {
                        alert(`Order Details:\n\nCommodity: ${order.commodity}\nQuantity: ${order.quantityKg}kg\nPrice: ${formatNaira(order.pricePerKg)}/kg\nTotal: ${formatNaira(order.amount)}\nFarmer: ${order.farmerName}\nBuyer: ${order.buyerName}\nStatus: ${order.status}\nPickup: ${order.pickupLocation}`);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
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
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;



