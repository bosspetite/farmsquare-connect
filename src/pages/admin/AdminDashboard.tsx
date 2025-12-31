import { Users, Package, ShoppingCart, Truck, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { getAppState, formatNaira } from '@/lib/store';

const AdminDashboard = () => {
  const state = getAppState();
  const totalTrades = state.orders.filter(o => o.status === 'Delivered').length;
  const totalVolume = state.orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.amount, 0);

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

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="farm-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {state.orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground text-sm">{order.commodity} - {order.quantityKg}kg</p>
                    <p className="text-xs text-muted-foreground">{order.farmerName} → {order.buyerName}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{formatNaira(order.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="farm-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, label: 'Manage Users' },
                { icon: Package, label: 'Review Listings' },
                { icon: ShoppingCart, label: 'Order Oversight' },
                { icon: Truck, label: 'Logistics' },
              ].map((action, i) => (
                <button key={i} className="p-4 bg-muted/50 rounded-xl text-center hover:bg-muted transition-colors">
                  <action.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
