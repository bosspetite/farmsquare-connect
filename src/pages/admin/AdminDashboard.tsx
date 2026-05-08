import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingCart, Truck, CreditCard, AlertTriangle, TrendingUp, Activity, Shield, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { formatNaira, formatTimeAgo } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { AdminDashboardStats, getAdminStats, getAllDisputes, getAllListings, getAllOrders } from '@/services/adminService';
import { Listing, Order } from '@/types';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [openDisputes, setOpenDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [nextStats, listings, orders, disputes] = await Promise.all([
        getAdminStats(),
        getAllListings(),
        getAllOrders(),
        getAllDisputes(),
      ]);

      setStats(nextStats);
      setRecentListings(listings.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
      setOpenDisputes((disputes || []).filter((dispute) => dispute.status === 'Open' || dispute.status === 'UnderReview'));
      setLastUpdatedAt(new Date().toISOString());
      console.log('[AdminDashboard] Loaded dashboard snapshot', {
        totalUsers: nextStats.totalUsers,
        activeListings: nextStats.activeListings,
        totalOrders: nextStats.totalOrders,
      });
    } catch (error) {
      console.error('[AdminDashboard] Failed to load dashboard', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadDashboard();
      }
    };

    const intervalHandle = window.setInterval(() => {
      void refreshIfVisible();
    }, 30000);

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(intervalHandle);
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Admin Overview</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {lastUpdatedAt
                ? `Live tracking · Last sync ${new Date(lastUpdatedAt).toLocaleTimeString()}`
                : 'Live tracking enabled'}
            </p>
          </div>
          <button
            onClick={() => void loadDashboard()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {errorMessage ? (
          <div className="farm-card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load admin data</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <button onClick={() => void loadDashboard()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={TrendingUp} label="Total Trades" value={stats?.completedTrades ?? 0} />
              <StatCard icon={CreditCard} label="Trade Volume" value={formatNaira(stats?.totalTradeVolume ?? 0)} />
              <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} />
              <StatCard icon={Package} label="Active Listings" value={stats?.activeListings ?? 0} />
            </div>

            {(stats?.pendingKycCount || 0) > 0 && (
              <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-farm-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {stats?.pendingKycCount} KYC Verification{stats?.pendingKycCount === 1 ? '' : 's'} Pending Review
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Fresh farmer and buyer verification submissions are waiting in Supabase.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-farm-warning text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Shield className="w-4 h-4" />
                    Review Now
                  </button>
                </div>
              </div>
            )}

            {openDisputes.length > 0 && (
              <div className="farm-card bg-destructive/10 border-destructive/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {openDisputes.length} Open Dispute{openDisputes.length === 1 ? '' : 's'} Requiring Attention
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Live dispute records need admin review.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/disputes')}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-destructive text-destructive-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Review Disputes
                  </button>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="farm-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Recent Listings</h3>
                  <button onClick={() => navigate('/admin/listings')} className="text-sm text-primary hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {recentListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate('/admin/listings')}
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={listing.photos[0] || getProduceImage(listing.commodity)}
                          alt={listing.commodity}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = getProduceImage(listing.commodity);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{listing.commodity}</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.farmerName} • {listing.quantityKg}kg • {formatNaira(listing.pricePerKg)}/kg
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(listing.createdAt)}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          listing.status === 'Active'
                            ? 'bg-farm-success/10 text-farm-success'
                            : listing.status === 'Paused'
                            ? 'bg-farm-warning/10 text-farm-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  ))}
                  {recentListings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No listings yet</p>}
                </div>
              </div>

              <div className="farm-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
                  <button onClick={() => navigate('/admin/orders')} className="text-sm text-primary hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate('/admin/orders')}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {order.commodity} - {order.quantityKg}kg
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.farmerName} → {order.buyerName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-primary">{formatNaira(order.amount)}</span>
                        <p
                          className={`text-xs mt-1 ${
                            order.status === 'Delivered'
                              ? 'text-farm-success'
                              : order.status === 'Pending'
                              ? 'text-farm-warning'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
                </div>
              </div>
            </div>

            <div className="farm-card">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Farmer Activity Overview</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Active Farmers</p>
                  <p className="text-2xl font-bold text-foreground">{stats ? stats.totalFarmers : 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Live farmer profiles from Supabase</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Listings Created</p>
                  <p className="text-2xl font-bold text-foreground">{recentListings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.activeListings ?? 0} currently active</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Orders from Farmers</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.completedTrades ?? 0} completed</p>
                </div>
              </div>
            </div>

            <div className="farm-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { icon: Users, label: 'Manage Users', path: '/admin/users' },
                  { icon: Package, label: 'Review Listings', path: '/admin/listings' },
                  { icon: ShoppingCart, label: 'Order Oversight', path: '/admin/orders' },
                  { icon: AlertTriangle, label: 'Disputes', path: '/admin/disputes' },
                  { icon: Truck, label: 'Logistics', path: '/admin/logistics' },
                ].map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="p-4 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
                  >
                    <action.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
