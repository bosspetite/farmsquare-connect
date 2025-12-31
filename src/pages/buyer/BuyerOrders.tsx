import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByBuyerId, formatNaira, formatTimeAgo } from '@/lib/store';
import { OrderStatus } from '@/types';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Pending', 'Accepted', 'InTransit', 'Delivered'];

const BuyerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');

  const allOrders = user ? getOrdersByBuyerId(user.id) : [];
  const orders = activeFilter === 'All' ? allOrders : allOrders.filter(o => o.status === activeFilter);

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">My Orders</h1>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {filter === 'All' ? 'All' : filter === 'InTransit' ? 'In Transit' : filter}
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
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/buyer/orders/${order.id}`)}
                className="farm-card-interactive cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{order.commodity}</h3>
                    <p className="text-sm text-muted-foreground">{order.quantityKg}kg from {order.farmerName}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">{formatNaira(order.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrders;
