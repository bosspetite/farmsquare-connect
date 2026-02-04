import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Package, ShoppingCart, Wallet, TrendingUp, TrendingDown, Minus, ChevronRight, Eye, DollarSign, CheckCircle, AlertCircle, Shield, Camera, Info, X } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { WalletCard } from '@/components/ui/WalletCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletByUserId, getListingsByFarmerId, formatNaira, formatTimeAgo, getAppState, getKYCByUserId, setAppState } from '@/lib/store';
import { useOrderStore } from '@/stores/orderStore';
import { getProduceImage } from '@/utils/produceImages';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPriceInfoModal, setShowPriceInfoModal] = useState(false);
  // Use Zustand store for orders - single source of truth
  const { getFarmerOrders, refreshOrders, subscribe } = useOrderStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [listings, setListings] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [kycData, setKycData] = useState<any>(null);
  const [state, setState] = useState(getAppState());

  // Get orders from Zustand store - always refresh first
  const allOrders = useMemo(() => {
    if (!user) return [];
    // Refresh store before getting orders to ensure we have latest data
    refreshOrders();
    return getFarmerOrders(user.id);
  }, [user, refreshKey, getFarmerOrders, refreshOrders]);

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
  }, [subscribe, refreshOrders, user]);

  // Update other state when user changes
  useEffect(() => {
    if (user) {
      const currentState = getAppState();
      setListings(getListingsByFarmerId(user.id));
      setWallet(getWalletByUserId(user.id));
      // Always get fresh KYC data
      const freshKycData = getKYCByUserId(user.id);
      setKycData(freshKycData);
      setState(currentState);
      
      // Also update user's KYC status in context if it changed
      if (freshKycData && currentState.currentUser && currentState.currentUser.id === user.id) {
        if (currentState.currentUser.kycStatus !== freshKycData.status) {
          currentState.currentUser.kycStatus = freshKycData.status;
          setAppState(currentState);
        }
      }
    } else {
      setListings([]);
      setWallet(null);
      setKycData(null);
    }
  }, [refreshKey, user]);

  const orders = allOrders.slice(0, 3);
  
  const kycStatus = kycData?.status || 'NOT_STARTED';
  const isKYCApproved = kycStatus === 'APPROVED';
  
  // Redirect to KYC if verification not started (new users)
  useEffect(() => {
    // Only redirect if user exists and KYC is not started
    if (user?.id && kycStatus === 'NOT_STARTED') {
      try {
        // Check if this is a new user (no KYC data at all)
        // Redirect to KYC page for first-time users
        const hasSeenKYC = sessionStorage.getItem(`kyc_seen_${user.id}`);
        if (!hasSeenKYC) {
          sessionStorage.setItem(`kyc_seen_${user.id}`, 'true');
          navigate('/farmer/kyc');
        }
      } catch (error) {
        // Silently fail if sessionStorage is not available
        console.warn('Could not check KYC redirect:', error);
      }
    }
  }, [user, kycStatus, navigate]);
  
  // Calculate stats (memoized for performance)
  const activeListings = useMemo(() => listings.filter(l => l.status === 'Active').length, [listings]);
  const totalOrders = useMemo(() => allOrders.length, [allOrders]);
  const pendingOrders = useMemo(() => allOrders.filter(o => o.status === 'Pending').length, [allOrders]);
  const completedOrders = useMemo(() => allOrders.filter(o => o.status === 'Delivered').length, [allOrders]);
  const totalRevenue = useMemo(() => 
    allOrders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.amount, 0),
    [allOrders]
  );
  
  const userListing = listings.find(l => l.status === 'Active');
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
            Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}
          </h1>
        </div>

        {/* KYC Status Banner */}
        {!isKYCApproved && (
          <div className={`farm-card ${
            kycStatus === 'REJECTED' 
              ? 'bg-destructive/10 border-destructive/20' 
              : kycStatus === 'IN_REVIEW'
              ? 'bg-farm-info/10 border-farm-info/20'
              : 'bg-farm-warning/10 border-farm-warning/20'
          }`}>
            <div className="flex items-start gap-3">
              {kycStatus === 'REJECTED' ? (
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              ) : kycStatus === 'IN_REVIEW' ? (
                <Shield className="w-5 h-5 text-farm-info flex-shrink-0 mt-0.5" />
              ) : (
                <Shield className="w-5 h-5 text-farm-warning flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">
                  {kycStatus === 'REJECTED' 
                    ? 'Verification Failed' 
                    : kycStatus === 'IN_REVIEW'
                    ? 'Verification Under Review'
                    : 'Verification Required'}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mb-3">
                  {kycStatus === 'REJECTED'
                    ? 'Your documents were not approved. Please resubmit to enable withdrawals.'
                    : kycStatus === 'IN_REVIEW'
                    ? 'Your documents are being reviewed. This usually takes 24-48 hours. You\'ll be notified once approved.'
                    : 'Complete identity verification to enable withdrawals and access all features.'}
                </p>
                <button
                  onClick={() => navigate('/farmer/kyc')}
                  className={`px-4 py-2 rounded-xl text-sm sm:text-base font-medium ${
                    kycStatus === 'REJECTED'
                      ? 'bg-destructive text-destructive-foreground'
                      : kycStatus === 'IN_REVIEW'
                      ? 'bg-farm-info text-white'
                      : 'bg-farm-warning text-foreground'
                  }`}
                >
                  {kycStatus === 'REJECTED' 
                    ? 'Resubmit Documents' 
                    : kycStatus === 'IN_REVIEW'
                    ? 'View Status'
                    : 'Complete Verification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Card */}
        <WalletCard
          available={wallet?.available || 0}
          pending={wallet?.pending || 0}
          onWithdraw={() => navigate('/farmer/wallet')}
        />

        {/* Primary CTA - Blocked if KYC not approved */}
        <button
          onClick={() => {
            if (!isKYCApproved) {
              navigate('/farmer/kyc');
            } else {
              navigate('/farmer/create-listing');
            }
          }}
          disabled={!isKYCApproved}
          className={`w-full p-5 rounded-lg flex items-center justify-between transition-all ${
            isKYCApproved
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isKYCApproved ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10'
            }`}>
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-lg">
                {isKYCApproved ? 'List New Produce' : 'Complete KYC to List Produce'}
              </p>
              <p className="text-sm opacity-80">
                {isKYCApproved ? 'Start selling today' : 'Verification required to create listings'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Verification Status Badge */}
        <div className="farm-card bg-gradient-to-r from-[#F0FDF4] to-white border border-[#BBF7D0]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isKYCApproved 
                  ? 'bg-[#22C55E]/10' 
                  : kycStatus === 'IN_REVIEW'
                  ? 'bg-farm-info/10'
                  : kycStatus === 'REJECTED'
                  ? 'bg-destructive/10'
                  : 'bg-farm-warning/10'
              }`}>
                <Shield className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isKYCApproved 
                    ? 'text-[#22C55E]' 
                    : kycStatus === 'IN_REVIEW'
                    ? 'text-farm-info'
                    : kycStatus === 'REJECTED'
                    ? 'text-destructive'
                    : 'text-farm-warning'
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm sm:text-base">
                  Verification Status: 
                  <span className={`ml-2 ${
                    isKYCApproved 
                      ? 'text-[#22C55E]' 
                      : kycStatus === 'IN_REVIEW'
                      ? 'text-farm-info'
                      : kycStatus === 'REJECTED'
                      ? 'text-destructive'
                      : 'text-farm-warning'
                  }`}>
                    {isKYCApproved ? 'Approved' : 
                     kycStatus === 'IN_REVIEW' ? 'Under Review' :
                     kycStatus === 'REJECTED' ? 'Rejected' : 'Pending'}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isKYCApproved 
                    ? 'All features enabled' 
                    : 'Complete verification to access all features'}
                </p>
              </div>
            </div>
            {!isKYCApproved && (
              <button
                onClick={() => navigate('/farmer/kyc')}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 whitespace-nowrap"
              >
                Verify Now
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Package}
            label="Active Listings"
            value={activeListings}
            onClick={() => navigate('/farmer/listings')}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={totalOrders}
            onClick={() => navigate('/farmer/orders')}
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={completedOrders}
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatNaira(totalRevenue)}
          />
        </div>

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
        
        {/* Pending Orders Alert */}
        {pendingOrders > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-farm-warning/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-farm-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{pendingOrders} Pending Order{pendingOrders > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground">Requires your attention</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/farmer/orders')}
                className="px-4 py-2 bg-farm-warning text-foreground rounded-xl text-sm font-medium"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Market Price Intel */}
        {userListing && marketPrice && (
          <div className="farm-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Market Price Intel</h3>
              <button
                onClick={() => setShowPriceInfoModal(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="View Price Information"
              >
                <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </div>
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

        {/* Price Information Modal */}
        {userListing && marketPrice && (
          <Modal 
            isOpen={showPriceInfoModal} 
            onClose={() => setShowPriceInfoModal(false)} 
            title="Market Price Information"
          >
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{userListing.commodity} - Grade {userListing.grade}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Listing Price:</span>
                    <span className="font-semibold text-foreground">{formatNaira(userListing.pricePerKg)}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regional Average:</span>
                    <span className="font-semibold text-foreground">{formatNaira(marketPrice.regionalPricePerKg)}/kg</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Price Difference:</span>
                    <span className={`font-semibold ${
                      priceDiff > 0 ? 'text-farm-success' : 
                      priceDiff < 0 ? 'text-destructive' : 
                      'text-foreground'
                    }`}>
                      {priceDiff > 0 ? '+' : ''}{formatNaira(priceDiff)}/kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-farm-success/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-farm-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">What This Means</p>
                    <p className="text-sm text-muted-foreground">
                      {priceDiff > 0 
                        ? `Your price is ${formatNaira(priceDiff)}/kg higher than the regional average. This could indicate premium quality or higher production costs.`
                        : priceDiff < 0
                        ? `Your price is ${formatNaira(Math.abs(priceDiff))}/kg lower than the regional average. This could make your listing more competitive.`
                        : 'Your price matches the regional average, which is competitive.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-farm-info/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-farm-info" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Pricing Tips</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Monitor regional prices regularly to stay competitive</li>
                      <li>Consider your production costs when setting prices</li>
                      <li>Quality and grade can justify premium pricing</li>
                      <li>Seasonal demand affects market prices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowPriceInfoModal(false)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Got it
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Active Listings Preview */}
        {activeListings > 0 && (
          <div className="farm-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Active Listings</h3>
              <button onClick={() => navigate('/farmer/listings')} className="text-sm text-primary">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {listings.filter(l => l.status === 'Active').slice(0, 3).map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => navigate('/farmer/listings')}
                  className="flex gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)} 
                      alt={listing.commodity} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getProduceImage(listing.commodity);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{listing.commodity}</p>
                    <p className="text-sm text-muted-foreground">{listing.quantityKg}kg · {formatNaira(listing.pricePerKg)}/kg</p>
                  </div>
                </div>
              ))}
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
