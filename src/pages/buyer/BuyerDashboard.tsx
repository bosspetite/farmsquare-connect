import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, Clock, Store, Wallet, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { getAppState, formatNaira, formatTimeAgo, getWalletByUserId, getKYCByUserId } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { useOrderStore } from '@/stores/orderStore';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use Zustand store for orders - single source of truth
  const { getBuyerOrders, refreshOrders, subscribe } = useOrderStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState(getAppState());
  const [buyerWallet, setBuyerWallet] = useState<any>(null);
  const [kycData, setKycData] = useState<any>(null);

  // Get orders from Zustand store - always refresh first
  const orders = useMemo(() => {
    if (!user) return [];
    // Refresh store before getting orders to ensure we have latest data
    refreshOrders();
    return getBuyerOrders(user.id);
  }, [user, refreshKey, getBuyerOrders, refreshOrders]);

  // Subscribe to order changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });

    // Refresh on mount
    refreshOrders();

    // Refresh when window gains focus
    const handleFocus = () => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);

    // Refresh when localStorage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'farmsquare_state') {
        refreshOrders();
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    }, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [subscribe, refreshOrders]);

  // Update other state when user changes
  useEffect(() => {
    if (user) {
      const currentState = getAppState();
      setState(currentState);
      setBuyerWallet(getWalletByUserId(user.id));
      setKycData(getKYCByUserId(user.id));
    } else {
      setBuyerWallet(null);
      setKycData(null);
    }
  }, [user, refreshKey]);

  // Memoize calculations to prevent unnecessary recalculations
  const activeOrders = useMemo(() => orders.filter(o => !['Delivered', 'Cancelled', 'Rejected'].includes(o.status)), [orders]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'Pending'), [orders]);
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'Delivered'), [orders]);
  const totalSpend = useMemo(() => deliveredOrders.reduce((sum, o) => sum + o.amount, 0), [deliveredOrders]);
  const activeListings = useMemo(() => (state.listings || []).filter(l => l.status === 'Active'), [state.listings]);
  
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
                <p className="font-semibold text-foreground text-sm sm:text-base">KYB Verification</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Approved • You can place orders</p>
              </div>
            </div>
          ) : kycData?.status === 'IN_REVIEW' ? (
            <div className="farm-card bg-farm-info/10 border-farm-info/20 flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-farm-info" />
              <div>
                <p className="font-semibold text-foreground text-sm sm:text-base">KYB Verification</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending Review • Orders disabled until approved</p>
              </div>
            </div>
          ) : kycData?.status === 'REJECTED' ? (
            <div className="farm-card bg-destructive/10 border-destructive/20 flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm sm:text-base">KYB Verification Rejected</p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Please resubmit your verification documents</p>
                <button
                  onClick={() => navigate('/buyer/kyc')}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs sm:text-sm font-medium"
                >
                  Resubmit
                </button>
              </div>
            </div>
          ) : (
            <div className="farm-card bg-farm-warning/10 border-farm-warning/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 flex-1">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-farm-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm sm:text-base">Verification Required</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Complete your KYC/KYB verification to place orders and access all features
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/buyer/kyc')}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-farm-warning text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Shield className="w-4 h-4" />
                Verify Now
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight break-words">
                  {formatNaira(buyerWallet.available).split(' ').map((part, i) => (
                    <span key={i} className="block sm:inline">{part}</span>
                  ))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">In Escrow</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-farm-warning leading-tight break-words">
                  {formatNaira(buyerWallet.pending).split(' ').map((part, i) => (
                    <span key={i} className="block sm:inline">{part}</span>
                  ))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary leading-tight break-words">
                  {formatNaira(buyerWallet.available + buyerWallet.pending).split(' ').map((part, i) => (
                    <span key={i} className="block sm:inline">{part}</span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Featured Produce - 6 Main Produce Types */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-foreground text-lg">Featured Produce</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Browse our top farm produce</p>
            </div>
            <button 
              onClick={() => navigate('/buyer/marketplace')}
              className="text-sm sm:text-base text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {[
              { name: 'Maize', grade: 'A' as const },
              { name: 'Cassava', grade: 'B' as const },
              { name: 'Rice', grade: 'A' as const },
              { name: 'Yam', grade: 'A' as const },
              { name: 'Sorghum', grade: 'B' as const },
              { name: 'Tomatoes', grade: 'A' as const },
            ].map((produce) => {
              const listing = activeListings.find(l => 
                l.commodity.toLowerCase() === produce.name.toLowerCase() && 
                l.grade === produce.grade
              ) || activeListings.find(l => 
                l.commodity.toLowerCase() === produce.name.toLowerCase()
              );
              
              return (
                <div
                  key={produce.name}
                  onClick={() => {
                    if (listing) {
                      navigate(`/buyer/listings/${listing.id}`);
                    } else {
                      navigate('/buyer/marketplace', { state: { filter: produce.name } });
                    }
                  }}
                  className="group cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-xl bg-muted overflow-hidden mb-2 border border-border group-hover:border-primary/50 transition-all">
                    <img
                      src={listing && listing.photos && listing.photos.length > 0 
                        ? listing.photos[0] 
                        : getProduceImage(produce.name)}
                      alt={produce.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = getProduceImage(produce.name);
                      }}
                    />
                    {/* Grade Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        produce.grade === 'A' ? 'bg-farm-success/90 text-white' :
                        produce.grade === 'B' ? 'bg-farm-warning/90 text-white' :
                        'bg-farm-brown/90 text-white'
                      }`}>
                        Grade {produce.grade}
                      </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity bg-primary px-3 py-1.5 rounded-lg">
                        View
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm sm:text-base text-foreground">{produce.name}</p>
                    {listing && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatNaira(listing.pricePerKg)}/kg
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => navigate('/buyer/marketplace')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-sm sm:text-base text-foreground mb-1">Browse Marketplace</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{activeListings.length} listings</p>
          </button>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-info/5 to-transparent border-2 border-farm-info/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-info/10 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-7 h-7 text-farm-info" />
            </div>
            <p className="font-semibold text-sm sm:text-base text-foreground mb-1">View Orders</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{activeOrders.length} active</p>
          </button>
          <button
            onClick={() => navigate('/buyer/wallet')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-success/5 to-transparent border-2 border-farm-success/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-success/10 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-farm-success" />
            </div>
            <p className="font-semibold text-sm sm:text-base text-foreground mb-1">View Wallet</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{buyerWallet ? formatNaira(buyerWallet.available) : '₦0'}</p>
          </button>
        </div>

        {/* Recent Orders */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">Recent Orders</h3>
            <button onClick={() => navigate('/buyer/orders')} className="text-xs sm:text-sm text-primary font-medium">
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
                const listing = (state.listings || []).find(l => l.id === order.listingId);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/buyer/orders/${order.id}`)}
                    className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm md:text-base text-foreground">{order.commodity}</span>
                        <span className="text-xs sm:text-sm md:text-base text-muted-foreground">• {order.quantityKg}kg</span>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-1 truncate">{order.farmerName}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-foreground mb-2 text-xs sm:text-sm md:text-base leading-tight">
                        {formatNaira(order.amount).split(' ').map((part, i) => (
                          <span key={i} className="block sm:inline">{part}</span>
                        ))}
                      </p>
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
          <h3 className="font-display font-semibold text-foreground mb-4 text-sm sm:text-base">Quality Overview</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {['A', 'B', 'C'].map((grade) => {
              const count = deliveredOrders.filter(o => 
                (state.listings || []).find(l => l.id === o.listingId)?.grade === grade
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
