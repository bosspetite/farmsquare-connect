import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, MapPin } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByBuyerId, formatNaira, formatTimeAgo, getAppState } from '@/lib/store';
import { OrderStatus } from '@/types';
import { getProduceImage } from '@/utils/produceImages';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Pending', 'Accepted', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered', 'Cancelled'];

const BuyerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');

  const allOrders = user ? getOrdersByBuyerId(user.id) : [];
  const orders = activeFilter === 'All' ? allOrders : allOrders.filter(o => o.status === activeFilter);
  
  const stats = {
    all: allOrders.length,
    pending: allOrders.filter(o => o.status === 'Pending').length,
    active: allOrders.filter(o => !['Delivered', 'Cancelled', 'Rejected'].includes(o.status)).length,
    delivered: allOrders.filter(o => o.status === 'Delivered').length,
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your produce orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{stats.all}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{stats.delivered}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {filter === 'All' ? 'All' : filter === 'InTransit' ? 'In Transit' : filter === 'PickupScheduled' ? 'Pickup Scheduled' : filter}
            </button>
          ))}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Browse the marketplace to place your first order"
            action={{ label: 'Browse Marketplace', onClick: () => navigate('/buyer/marketplace') }}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const listing = state.listings.find(l => l.id === order.listingId);
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/buyer/orders/${order.id}`)}
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
                      <h3 className="font-semibold text-foreground">{order.commodity}</h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        {order.quantityKg}kg
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{order.farmerName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.pickupLocation}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground mb-2">{formatNaira(order.amount)}</p>
                    <StatusPill status={order.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrders;
