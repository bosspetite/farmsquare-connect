import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingCart, Truck, CreditCard, AlertTriangle, TrendingUp, Eye, Activity, Shield, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllProfiles, getAllOrders, getAllDisputes, getActiveListings } from '@/services/databaseService';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { formatNaira, formatTimeAgo } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalVolume: 0,
    totalUsers: 0,
    activeListings: 0,
    pendingKYC: 0,
    openDisputes: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profiles, orders, disputes, listings] = await Promise.all([
          getAllProfiles(),
          getAllOrders(),
          getAllDisputes(),
          getActiveListings(),
        ]);

        // Filter out admins
        const nonAdminProfiles = profiles.filter(p => p.role !== 'admin');
        const farmers = nonAdminProfiles.filter(p => p.role === 'farmer');
        const buyers = nonAdminProfiles.filter(p => p.role === 'buyer');

        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const totalVolume = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const pendingKYC = nonAdminProfiles.filter(p => {
          const kycStatus = p.role === 'buyer' ? (p.kyb_status || p.kyc_status) : p.kyc_status;
          return kycStatus === 'IN_REVIEW';
        });
        const openDisputes = disputes.filter(d => d.status === 'Open' || d.status === 'UnderReview');

        setStats({
          totalTrades: deliveredOrders.length,
          totalVolume,
          totalUsers: nonAdminProfiles.length,
          activeListings: listings.length,
          pendingKYC: pendingKYC.length,
          openDisputes: openDisputes.length,
        });

        setRecentOrders(orders.slice(0, 5));
        setRecentListings(listings.slice(0, 5));
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Admin Overview</h1>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={TrendingUp} label="Total Trades" value={stats.totalTrades} />
          <StatCard icon={CreditCard} label="Trade Volume" value={formatNaira(stats.totalVolume)} />
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={Package} label="Active Listings" value={stats.activeListings} />
        </div>

        {/* Pending KYC Reviews Alert */}
        {stats.pendingKYC > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-farm-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {stats.pendingKYC} KYC Verification{stats.pendingKYC > 1 ? 's' : ''} Pending Review
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.pendingKYC} user{stats.pendingKYC > 1 ? 's' : ''} submitted documents awaiting your review
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

        {/* Open Disputes Alert */}
        {stats.openDisputes > 0 && (
          <div className="farm-card bg-destructive/10 border-destructive/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {stats.openDisputes} Open Dispute{stats.openDisputes > 1 ? 's' : ''} Requiring Attention
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.openDisputes} dispute{stats.openDisputes > 1 ? 's' : ''} need{stats.openDisputes === 1 ? 's' : ''} your review and resolution
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/disputes')}
                className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-destructive text-destructive-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Review Disputes</span>
                <span className="sm:hidden">Review</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <div className="farm-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Recent Listings</h3>
              <button 
                onClick={() => navigate('/admin/listings')}
                className="text-sm text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentListings.slice(0, 5).map((listing) => (
                <div 
                  key={listing.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/listings')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{listing.commodity} - Grade {listing.grade}</p>
                    <p className="text-xs text-muted-foreground">{listing.farmer_name} • {listing.region}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(listing.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">{formatNaira(listing.quantity_kg * listing.price_per_kg)}</span>
                  </div>
                </div>
              ))}
              {recentListings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No listings yet</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="farm-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="text-sm text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/orders')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">{formatNaira(order.total_amount)}</span>
                    <p className={`text-xs mt-1 ${
                      order.status === 'Delivered' ? 'text-farm-success' :
                      order.status === 'Pending' ? 'text-farm-warning' :
                      'text-muted-foreground'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
