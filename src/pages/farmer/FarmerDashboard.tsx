import { useNavigate } from 'react-router-dom';
import { Plus, Package, ShoppingCart, Wallet, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { WalletCard } from '@/components/ui/WalletCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletByUserId, getOrdersByFarmerId, formatNaira, formatTimeAgo, getAppState } from '@/lib/store';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const wallet = user ? getWalletByUserId(user.id) : null;
  const orders = user ? getOrdersByFarmerId(user.id).slice(0, 3) : [];
  const state = getAppState();
  
  const userListing = state.listings.find(l => l.farmerId === user?.id);
  const marketPrice = state.marketPrices.find(m => m.commodity === userListing?.commodity);
  
  const priceDiff = userListing && marketPrice 
    ? userListing.pricePerKg - marketPrice.regionalPricePerKg 
    : 0;

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Mobile Welcome */}
        <div className="lg:hidden">
          <h1 className="text-xl font-display font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Farmer'} 🚜
          </h1>
        </div>

        {/* Wallet Card */}
        <WalletCard
          available={wallet?.available || 0}
          pending={wallet?.pending || 0}
          onWithdraw={() => navigate('/farmer/wallet')}
        />

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/farmer/create-listing')}
          className="w-full p-5 bg-primary text-primary-foreground rounded-2xl flex items-center justify-between btn-glow transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-lg">List New Produce</p>
              <p className="text-sm opacity-80">Start selling today</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: 'Inventory', path: '/farmer/listings' },
            { icon: ShoppingCart, label: 'Orders', path: '/farmer/orders' },
            { icon: Wallet, label: 'Wallet', path: '/farmer/wallet' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="farm-card-interactive flex flex-col items-center py-5"
            >
              <action.icon className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Market Price Intel */}
        {userListing && marketPrice && (
          <div className="farm-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Market Price Intel</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{userListing.commodity}</p>
                <p className="text-lg font-semibold text-foreground">
                  Your price: {formatNaira(userListing.pricePerKg)}/kg
                </p>
                <p className="text-sm text-muted-foreground">
                  Regional avg: {formatNaira(marketPrice.regionalPricePerKg)}/kg
                </p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-2 rounded-xl ${
                priceDiff > 0 ? 'bg-farm-success/10 text-farm-success' : 
                priceDiff < 0 ? 'bg-destructive/10 text-destructive' : 
                'bg-muted text-muted-foreground'
              }`}>
                {priceDiff > 0 ? <TrendingUp className="w-4 h-4" /> : 
                 priceDiff < 0 ? <TrendingDown className="w-4 h-4" /> : 
                 <Minus className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {priceDiff > 0 ? '+' : ''}{formatNaira(priceDiff)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
            <button onClick={() => navigate('/farmer/orders')} className="text-sm text-primary">
              View all
            </button>
          </div>
          
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/farmer/orders/${order.id}`)}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{order.commodity}</span>
                      <span className="text-sm text-muted-foreground">• {order.quantityKg}kg</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.buyerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatNaira(order.amount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusPill status={order.status} />
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FarmerLayout>
  );
};

export default FarmerDashboard;
