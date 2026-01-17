import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, Clock, Store, Wallet, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByBuyerId, getAppState, formatNaira, formatTimeAgo, getWalletByUserId, getKYCByUserId } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  
  const orders = user ? getOrdersByBuyerId(user.id) : [];
  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled', 'Rejected'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeListings = state.listings.filter(l => l.status === 'Active');
  
  const buyerWallet = user ? getWalletByUserId(user.id) : null;
  const kycData = user ? getKYCByUserId(user.id) : null;
  // Only verified if KYC data exists AND status is APPROVED
  const isVerified = kycData?.status === 'APPROVED';

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Buyer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'Buyer'}</p>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center gap-3">
          {isVerified ? (
            <div className="farm-card bg-farm-success/10 border-farm-success/20 flex items-center gap-3 flex-1">
              <CheckCircle className="w-5 h-5 text-farm-success" />
              <div>
                <p className="font-semibold text-foreground text-sm">KYB Verification</p>
                <p className="text-xs text-muted-foreground">Approved • You can place orders</p>
              </div>
            </div>
          ) : kycData?.status === 'IN_REVIEW' ? (
            <div className="farm-card bg-farm-info/10 border-farm-info/20 flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-farm-info" />
              <div>
                <p className="font-semibold text-foreground text-sm">KYB Verification</p>
                <p className="text-xs text-muted-foreground">Pending Review • Orders disabled until approved</p>
              </div>
            </div>
          ) : kycData?.status === 'REJECTED' ? (
            <div className="farm-card bg-destructive/10 border-destructive/20 flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">KYB Verification Rejected</p>
                <p className="text-xs text-muted-foreground mb-2">Please resubmit your verification documents</p>
                <button
                  onClick={() => navigate('/buyer/kyc')}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-medium"
                >
                  Resubmit
                </button>
              </div>
            </div>
          ) : (
            <div className="farm-card bg-farm-warning/10 border-farm-warning/20 flex items-center justify-between flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-farm-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Verification Required</p>
                  <p className="text-sm text-muted-foreground">
                    Complete your KYC/KYB verification to place orders and access all features
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/buyer/kyc')}
                className="px-5 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Verify Now
              </button>
            </div>
          )}
        </div>

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
            onClick={() => navigate('/buyer/orders')}
          />
          <StatCard
            icon={Wallet}
            label="Wallet Balance"
            value={buyerWallet ? formatNaira(buyerWallet.available) : '₦0'}
            onClick={() => navigate('/buyer/wallet')}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Spend"
            value={formatNaira(totalSpend)}
          />
        </div>

        {/* Wallet Summary */}
        {buyerWallet && (
          <div className="farm-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Wallet Summary</h3>
              <button onClick={() => navigate('/buyer/wallet')} className="text-sm text-primary">
                View Details
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className="text-xl font-bold text-foreground">{formatNaira(buyerWallet.available)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">In Escrow</p>
                <p className="text-xl font-bold text-farm-warning">{formatNaira(buyerWallet.pending)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-xl font-bold text-primary">{formatNaira(buyerWallet.available + buyerWallet.pending)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/buyer/marketplace')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">Browse Marketplace</p>
            <p className="text-xs text-muted-foreground">{activeListings.length} listings</p>
          </button>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-info/5 to-transparent border-2 border-farm-info/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-info/10 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-7 h-7 text-farm-info" />
            </div>
            <p className="font-semibold text-foreground mb-1">View Orders</p>
            <p className="text-xs text-muted-foreground">{activeOrders.length} active</p>
          </button>
          <button
            onClick={() => navigate('/buyer/wallet')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-success/5 to-transparent border-2 border-farm-success/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-success/10 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-farm-success" />
            </div>
            <p className="font-semibold text-foreground mb-1">View Wallet</p>
            <p className="text-xs text-muted-foreground">{buyerWallet ? formatNaira(buyerWallet.available) : '₦0'}</p>
          </button>
        </div>

        {/* Recent Orders */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
            <button onClick={() => navigate('/buyer/orders')} className="text-sm text-primary font-medium">
              View all
            </button>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No orders yet</p>
              <button
                onClick={() => navigate('/buyer/marketplace')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
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
                        <span className="font-semibold text-foreground">{order.commodity}</span>
                        <span className="text-sm text-muted-foreground">• {order.quantityKg}kg</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{order.farmerName}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
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
