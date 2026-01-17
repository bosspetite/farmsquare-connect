import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingCart, Truck, CreditCard, AlertTriangle, TrendingUp, Eye, Activity, Shield } from 'lucide-react';
import { getAllDisputes } from '@/lib/store';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { getAppState, formatNaira, formatTimeAgo } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const totalTrades = (state.orders || []).filter(o => o.status === 'Delivered').length;
  const totalVolume = (state.orders || []).filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.amount, 0);
  const pendingKYC = (state.kycData || []).filter(k => k.status === 'IN_REVIEW');
  const allDisputes = getAllDisputes();
  const openDisputes = (allDisputes || []).filter(d => d.status === 'Open' || d.status === 'UnderReview');

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Admin Overview</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Trades" value={totalTrades} />
          <StatCard icon={CreditCard} label="Trade Volume" value={formatNaira(totalVolume)} />
          <StatCard icon={Users} label="Total Users" value={state.farmers.length + state.buyers.length} />
          <StatCard icon={Package} label="Active Listings" value={state.listings.filter(l => l.status === 'Active').length} />
        </div>

        {/* Pending KYC Reviews Alert */}
        {pendingKYC.length > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-farm-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {pendingKYC.length} KYC Verification{pendingKYC.length > 1 ? 's' : ''} Pending Review
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingKYC.length} user{pendingKYC.length > 1 ? 's' : ''} submitted documents awaiting your review
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-5 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Review Now
              </button>
            </div>
          </div>
        )}

        {/* Open Disputes Alert */}
        {openDisputes.length > 0 && (
          <div className="farm-card bg-destructive/10 border-destructive/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {openDisputes.length} Open Dispute{openDisputes.length > 1 ? 's' : ''} Requiring Attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {openDisputes.length} dispute{openDisputes.length > 1 ? 's' : ''} need{openDisputes.length === 1 ? 's' : ''} your review and resolution
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/disputes')}
                className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Review Disputes
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Listings from Farmers */}
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
              {state.listings.slice(0, 5).map((listing) => (
                <div 
                  key={listing.id} 
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/listings')}
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img 
                      src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)} 
                      alt={listing.commodity} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getProduceImage(listing.commodity);
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{listing.commodity}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.farmerName} • {listing.quantityKg}kg • {formatNaira(listing.pricePerKg)}/kg
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(listing.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    listing.status === 'Active' ? 'bg-farm-success/10 text-farm-success' :
                    listing.status === 'Paused' ? 'bg-farm-warning/10 text-farm-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {listing.status}
                  </span>
                </div>
              ))}
              {state.listings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No listings yet</p>
              )}
            </div>
          </div>

          {/* Recent Orders Activity */}
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
              {state.orders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/orders')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{order.commodity} - {order.quantityKg}kg</p>
                    <p className="text-xs text-muted-foreground">{order.farmerName} → {order.buyerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">{formatNaira(order.amount)}</span>
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
              {state.orders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Farmer Activity Overview */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Farmer Activity Overview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Farmers</p>
              <p className="text-2xl font-bold text-foreground">
                {state.farmers.filter(f => f.kycStatus === 'APPROVED').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {state.farmers.length} total farmers
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Listings Created</p>
              <p className="text-2xl font-bold text-foreground">{state.listings.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {state.listings.filter(l => l.status === 'Active').length} currently active
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Orders from Farmers</p>
              <p className="text-2xl font-bold text-foreground">{state.orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {state.orders.filter(o => o.status === 'Delivered').length} completed
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="farm-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: 'Manage Users', path: '/admin/users' },
              { icon: Package, label: 'Review Listings', path: '/admin/listings' },
              { icon: ShoppingCart, label: 'Order Oversight', path: '/admin/orders' },
              { icon: AlertTriangle, label: 'Disputes', path: '/admin/disputes' },
              { icon: Truck, label: 'Logistics', path: '/admin/logistics' },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => navigate(action.path)}
                className="p-4 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
              >
                <action.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
