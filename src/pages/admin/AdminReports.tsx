import React from 'react';
import { FileText, TrendingUp, Users, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatNaira } from '@/lib/store';

const AdminReports = () => {
  const state = getAppState();
  
  const totalUsers = (state.farmers || []).length + (state.buyers || []).length + (state.agents || []).length;
  const totalListings = (state.listings || []).length;
  const activeListings = (state.listings || []).filter(l => l.status === 'Active').length;
  const totalOrders = (state.orders || []).length;
  const completedOrders = (state.orders || []).filter(o => o.status === 'Delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const verifiedFarmers = (state.farmers || []).filter(f => f.kycStatus === 'APPROVED').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Platform Reports</h1>
          <p className="text-muted-foreground">Comprehensive platform analytics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-xs text-muted-foreground mt-1">
              {state.farmers.length} Farmers • {state.buyers.length} Buyers • {state.agents.length} Agents
            </p>
          </div>
          <div className="farm-card text-center">
            <Package className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{activeListings}</p>
            <p className="text-sm text-muted-foreground">Active Listings</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalListings} Total Listings
            </p>
          </div>
          <div className="farm-card text-center">
            <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{completedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Completed Orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalOrders} Total Orders
            </p>
          </div>
          <div className="farm-card text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xs text-muted-foreground mt-1">
              From {completedOrders.length} orders
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Statistics */}
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">User Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Farmers</span>
                <span className="font-semibold text-foreground">{state.farmers.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Verified Farmers</span>
                <span className="font-semibold text-farm-success">{verifiedFarmers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Buyers</span>
                <span className="font-semibold text-foreground">{state.buyers.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Field Agents</span>
                <span className="font-semibold text-foreground">{state.agents.length}</span>
              </div>
            </div>
          </div>

          {/* Listing Statistics */}
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Listing Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Active Listings</span>
                <span className="font-semibold text-farm-success">{activeListings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Paused Listings</span>
                <span className="font-semibold text-farm-warning">{(state.listings || []).filter(l => l.status === 'Paused').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Sold Listings</span>
                <span className="font-semibold text-muted-foreground">{(state.listings || []).filter(l => l.status === 'Sold').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Listings</span>
                <span className="font-semibold text-foreground">{totalListings}</span>
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Order Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Pending Orders</span>
                <span className="font-semibold text-farm-warning">{(state.orders || []).filter(o => o.status === 'Pending').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">In Transit</span>
                <span className="font-semibold text-farm-info">{(state.orders || []).filter(o => o.status === 'InTransit').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Completed Orders</span>
                <span className="font-semibold text-farm-success">{completedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-semibold text-foreground">{totalOrders}</span>
              </div>
            </div>
          </div>

          {/* Financial Statistics */}
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Financial Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-farm-success">{formatNaira(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Completed Orders</span>
                <span className="font-semibold text-foreground">{completedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Average Order Value</span>
                <span className="font-semibold text-foreground">
                  {completedOrders.length > 0 ? formatNaira(totalRevenue / completedOrders.length) : '₦0'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Transactions</span>
                <span className="font-semibold text-foreground">{state.transactions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;



