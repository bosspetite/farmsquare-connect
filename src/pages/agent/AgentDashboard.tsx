import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, UserPlus, TrendingUp, CheckCircle, Clock, Package, AlertCircle, Activity, MapPin } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { getAppState, formatDate, formatTimeAgo, formatNaira } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  
  // Get agent stats
  const farmers = state.farmers;
  const totalFarmers = farmers.length;
  const farmersThisMonth = farmers.filter(f => {
    const created = new Date(f.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  
  // Get orders that need inspection (Pending and Accepted orders)
  const pendingOrders = state.orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
  const inspectionsToday = pendingOrders.length;
  
  // Get orders ready for delivery verification
  const readyForVerification = state.orders.filter(o => o.status === 'InTransit' || o.status === 'PickupScheduled');
  
  // Get completed inspections (Delivered orders)
  const completedInspections = state.orders.filter(o => o.status === 'Delivered').length;
  
  // Get orders assigned to this agent (for now, all orders)
  const myTasks = [...pendingOrders, ...readyForVerification].slice(0, 5);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Field Agent Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'Agent'}</p>
        </div>

        {/* Active Tasks Alert */}
        {myTasks.length > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-farm-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {myTasks.length} Active Task{myTasks.length > 1 ? 's' : ''} Requiring Your Attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingOrders.length} inspection{pendingOrders.length !== 1 ? 's' : ''} pending • {readyForVerification.length} delivery verification{readyForVerification.length !== 1 ? 's' : ''} ready
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/agent/inspections')}
                className="px-5 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                View Tasks
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={ClipboardCheck} 
            label="Inspections Today" 
            value={inspectionsToday}
            onClick={() => navigate('/agent/inspections')}
          />
          <StatCard 
            icon={Users} 
            label="Total Farmers" 
            value={totalFarmers}
            onClick={() => navigate('/agent/farmers')}
          />
          <StatCard 
            icon={CheckCircle} 
            label="Completed" 
            value={completedInspections}
          />
          <StatCard 
            icon={TrendingUp} 
            label="This Month" 
            value={farmersThisMonth}
            trend={{ direction: 'up', text: `+${farmersThisMonth}` }}
          />
        </div>

        {/* My Active Tasks */}
        {myTasks.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">My Active Tasks</h3>
              </div>
              <button
                onClick={() => navigate('/agent/inspections')}
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {myTasks.map((order) => {
                const listing = state.listings.find(l => l.id === order.listingId);
                const taskType = order.status === 'Pending' || order.status === 'Accepted' ? 'inspection' : 'verification';
                
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/agent/inspections/${order.id}`)}
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
                        <p className="font-semibold text-foreground">{order.commodity}</p>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                          {order.quantityKg}kg
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.farmerName} → {order.buyerName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.pickupLocation}
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        taskType === 'inspection' 
                          ? 'bg-farm-warning/10 text-farm-warning' 
                          : 'bg-farm-info/10 text-farm-info'
                      }`}>
                        {taskType === 'inspection' ? 'Needs Inspection' : 'Verify Delivery'}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatNaira(order.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Farmers */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Recent Farmers</h3>
            </div>
            <button
              onClick={() => navigate('/agent/farmers')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {farmers.slice(0, 5).map((farmer) => (
              <div
                key={farmer.id}
                onClick={() => navigate('/agent/farmers')}
                className="flex items-center justify-between p-3 bg-white dark:bg-card border border-border rounded-lg hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.region} • {farmer.phone}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                  farmer.kycStatus === 'APPROVED' 
                    ? 'bg-farm-success/10 text-farm-success'
                    : farmer.kycStatus === 'IN_REVIEW'
                    ? 'bg-farm-info/10 text-farm-info'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {farmer.kycStatus === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                  {farmer.kycStatus === 'IN_REVIEW' && <Clock className="w-3.5 h-3.5" />}
                  {farmer.kycStatus === 'NOT_STARTED' && <AlertCircle className="w-3.5 h-3.5" />}
                  {farmer.kycStatus.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/agent/inspections')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-warning/5 to-transparent border-2 border-farm-warning/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-warning/10 flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="w-7 h-7 text-farm-warning" />
            </div>
            <p className="font-semibold text-foreground mb-1">Inspect Orders</p>
            <p className="text-xs text-muted-foreground">{pendingOrders.length} pending</p>
          </button>
          <button
            onClick={() => navigate('/agent/farmers')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">Manage Farmers</p>
            <p className="text-xs text-muted-foreground">{totalFarmers} total</p>
          </button>
          <button
            onClick={() => navigate('/agent/reports')}
            className="farm-card p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-farm-success/5 to-transparent border-2 border-farm-success/20"
          >
            <div className="w-14 h-14 rounded-xl bg-farm-success/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-7 h-7 text-farm-success" />
            </div>
            <p className="font-semibold text-foreground mb-1">View Reports</p>
            <p className="text-xs text-muted-foreground">{completedInspections} completed</p>
          </button>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
