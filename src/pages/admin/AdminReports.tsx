import React, { useEffect, useState } from 'react';
import { FileText, Users, Package, DollarSign, ShoppingCart, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatNaira } from '@/lib/store';
import { getAdminDashboardStats, getAllListings, getAllOrders, getAllTransactions, getAllUsers } from '@/services/adminService';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboardStats>> | null>(null);
  const [listingStats, setListingStats] = useState({ total: 0, active: 0, paused: 0, sold: 0 });
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, inTransit: 0, completed: 0 });
  const [userStats, setUserStats] = useState({ farmers: 0, verifiedFarmers: 0, buyers: 0, agents: 0 });
  const [transactionCount, setTransactionCount] = useState(0);

  const loadReports = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [dashboardStats, listings, orders, users, transactions] = await Promise.all([
        getAdminDashboardStats(),
        getAllListings(),
        getAllOrders(),
        getAllUsers(),
        getAllTransactions(),
      ]);

      setStats(dashboardStats);
      setListingStats({
        total: listings.length,
        active: listings.filter((listing) => listing.status === 'Active').length,
        paused: listings.filter((listing) => listing.status === 'Paused').length,
        sold: listings.filter((listing) => listing.status === 'Sold').length,
      });
      setOrderStats({
        total: orders.length,
        pending: orders.filter((order) => order.status === 'Pending').length,
        inTransit: orders.filter((order) => order.status === 'InTransit').length,
        completed: orders.filter((order) => order.status === 'Delivered').length,
      });
      setUserStats({
        farmers: users.filter((user) => user.role === 'farmer').length,
        verifiedFarmers: users.filter((user) => user.role === 'farmer' && user.kycStatus === 'APPROVED').length,
        buyers: users.filter((user) => user.role === 'buyer').length,
        agents: users.filter((user) => user.role === 'agent').length,
      });
      setTransactionCount(transactions.length);
      console.log('[AdminReports] Loaded report data', {
        totalUsers: dashboardStats.totalUsers,
        totalOrders: orders.length,
        totalListings: listings.length,
      });
    } catch (error) {
      console.error('[AdminReports] Failed to load reports', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load platform reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Platform Reports</h1>
            <p className="text-muted-foreground">Real platform analytics from Supabase data</p>
          </div>
          <button
            onClick={() => void loadReports()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {errorMessage ? (
          <div className="farm-card text-center py-12">
            <FileText className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load reports</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <button onClick={() => void loadReports()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="farm-card text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{stats?.totalUsers ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userStats.farmers} Farmers • {userStats.buyers} Buyers • {userStats.agents} Agents
                </p>
              </div>
              <div className="farm-card text-center">
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{listingStats.active}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-xs text-muted-foreground mt-1">{listingStats.total} Total Listings</p>
              </div>
              <div className="farm-card text-center">
                <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{orderStats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-xs text-muted-foreground mt-1">{orderStats.total} Total Orders</p>
              </div>
              <div className="farm-card text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{formatNaira(stats?.totalTradeVolume ?? 0)}</p>
                <p className="text-sm text-muted-foreground">Trade Volume</p>
                <p className="text-xs text-muted-foreground mt-1">{transactionCount} Transactions</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">User Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Farmers</span>
                    <span className="font-semibold text-foreground">{userStats.farmers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Verified Farmers</span>
                    <span className="font-semibold text-farm-success">{userStats.verifiedFarmers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Buyers</span>
                    <span className="font-semibold text-foreground">{userStats.buyers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Field Agents</span>
                    <span className="font-semibold text-foreground">{userStats.agents}</span>
                  </div>
                </div>
              </div>

              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Listing Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Active Listings</span>
                    <span className="font-semibold text-farm-success">{listingStats.active}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Paused Listings</span>
                    <span className="font-semibold text-farm-warning">{listingStats.paused}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Sold Listings</span>
                    <span className="font-semibold text-muted-foreground">{listingStats.sold}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Listings</span>
                    <span className="font-semibold text-foreground">{listingStats.total}</span>
                  </div>
                </div>
              </div>

              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Order Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Pending Orders</span>
                    <span className="font-semibold text-farm-warning">{orderStats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">In Transit</span>
                    <span className="font-semibold text-farm-info">{orderStats.inTransit}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Completed Orders</span>
                    <span className="font-semibold text-farm-success">{orderStats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Orders</span>
                    <span className="font-semibold text-foreground">{orderStats.total}</span>
                  </div>
                </div>
              </div>

              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Financial Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Trade Volume</span>
                    <span className="font-semibold text-farm-success">{formatNaira(stats?.totalTradeVolume ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Completed Trades</span>
                    <span className="font-semibold text-foreground">{stats?.completedTrades ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Average Order Value</span>
                    <span className="font-semibold text-foreground">
                      {orderStats.completed > 0 ? formatNaira((stats?.totalTradeVolume ?? 0) / orderStats.completed) : '₦0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Transactions</span>
                    <span className="font-semibold text-foreground">{transactionCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
