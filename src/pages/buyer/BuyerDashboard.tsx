import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, Clock, Store } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByBuyerId, getAppState, formatNaira, formatTimeAgo } from '@/lib/store';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  
  const orders = user ? getOrdersByBuyerId(user.id) : [];
  const activeOrders = orders.filter(o => !['Delivered', 'Rejected'].includes(o.status));
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeListings = state.listings.filter(l => l.status === 'Active');

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground lg:hidden">
          Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingCart}
            label="Active Orders"
            value={activeOrders.length}
            onClick={() => navigate('/buyer/orders')}
          />
          <StatCard
            icon={Package}
            label="Deliveries"
            value={deliveredOrders.length}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Spend"
            value={formatNaira(totalSpend)}
          />
          <StatCard
            icon={Store}
            label="Available Listings"
            value={activeListings.length}
            onClick={() => navigate('/buyer/marketplace')}
          />
        </div>

        {/* Browse CTA */}
        <button
          onClick={() => navigate('/buyer/marketplace')}
          className="w-full p-5 bg-primary text-primary-foreground rounded-2xl flex items-center justify-between btn-glow transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-lg">Browse Marketplace</p>
              <p className="text-sm opacity-80">{activeListings.length} listings available</p>
            </div>
          </div>
        </button>

        {/* Recent Orders */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
            <button onClick={() => navigate('/buyer/orders')} className="text-sm text-primary">
              View all
            </button>
          </div>
          
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/buyer/orders/${order.id}`)}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{order.commodity}</span>
                      <span className="text-sm text-muted-foreground">• {order.quantityKg}kg</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.farmerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatNaira(order.amount)}</p>
                    <StatusPill status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Summary */}
        <div className="farm-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Quality Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            {['A', 'B', 'C'].map((grade) => {
              const count = deliveredOrders.filter(o => 
                state.listings.find(l => l.id === o.listingId)?.grade === grade
              ).length;
              return (
                <div key={grade} className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">Grade {grade}</p>
                  <p className="text-sm text-muted-foreground">{count} orders</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerDashboard;
