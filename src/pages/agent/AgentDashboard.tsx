import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, TrendingUp, CheckCircle, AlertCircle, Activity, MapPin, RefreshCw } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo, formatNaira } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { AgentFarmerSummary, AgentDashboardStats, getAgentDashboardStats, getDeliveries, getFarmersForAgent, getPendingInspections } from '@/services/agentService';
import { Order } from '@/types';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [farmers, setFarmers] = useState<AgentFarmerSummary[]>([]);
  const [tasks, setTasks] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const [nextStats, nextFarmers, inspections, deliveries] = await Promise.all([
        getAgentDashboardStats(user.id),
        getFarmersForAgent(user.id),
        getPendingInspections(user.id),
        getDeliveries(user.id),
      ]);

      setStats(nextStats);
      setFarmers(nextFarmers.slice(0, 5));
      setTasks([...inspections, ...deliveries].slice(0, 5));
      console.log('[AgentDashboard] Loaded agent dashboard', {
        totalFarmers: nextStats.totalFarmers,
        inspectionsToday: nextStats.inspectionsToday,
        readyForVerification: nextStats.readyForVerification,
      });
    } catch (error) {
      console.error('[AgentDashboard] Failed to load dashboard', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load agent dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [user]);

  const pendingOrders = useMemo(() => tasks.filter((order) => order.status === 'Pending' || order.status === 'Accepted'), [tasks]);
  const readyForVerification = useMemo(() => tasks.filter((order) => order.status === 'InTransit' || order.status === 'PickupScheduled'), [tasks]);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Field Agent Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'Agent'}</p>
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
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load agent data</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <button onClick={() => void loadDashboard()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {tasks.length > 0 && (
              <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-farm-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {tasks.length} Active Task{tasks.length === 1 ? '' : 's'} Requiring Attention
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {pendingOrders.length} inspection{pendingOrders.length === 1 ? '' : 's'} pending • {readyForVerification.length} delivery verification{readyForVerification.length === 1 ? '' : 's'} ready
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/agent/inspections')}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-farm-warning text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    View Tasks
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={ClipboardCheck} label="Inspections Today" value={stats?.inspectionsToday ?? 0} onClick={() => navigate('/agent/inspections')} />
              <StatCard icon={Users} label="Total Farmers" value={stats?.totalFarmers ?? 0} onClick={() => navigate('/agent/farmers')} />
              <StatCard icon={CheckCircle} label="Completed" value={stats?.completedInspections ?? 0} />
              <StatCard icon={TrendingUp} label="This Month" value={stats?.farmersThisMonth ?? 0} />
            </div>

            {tasks.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">My Active Tasks</h3>
                  </div>
                  <button onClick={() => navigate('/agent/inspections')} className="text-sm text-primary hover:underline font-medium">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {tasks.map((order) => {
                    const taskType = order.status === 'Pending' || order.status === 'Accepted' ? 'inspection' : 'verification';

                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/agent/inspections/${order.id}`)}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={order.listingPhotos?.[0] || getProduceImage(order.commodity)}
                            alt={order.commodity}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src = getProduceImage(order.commodity);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{order.commodity}</p>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{order.quantityKg}kg</span>
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
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              taskType === 'inspection' ? 'bg-farm-warning/10 text-farm-warning' : 'bg-farm-info/10 text-farm-info'
                            }`}
                          >
                            {taskType === 'inspection' ? 'Needs Inspection' : 'Verify Delivery'}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="farm-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Recent Farmers</h3>
                </div>
                <button onClick={() => navigate('/agent/farmers')} className="text-sm text-primary hover:underline font-medium">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {farmers.map((farmer) => (
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
                        <p className="text-sm text-muted-foreground">
                          {farmer.region} • {farmer.phone}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        farmer.kycStatus === 'APPROVED'
                          ? 'bg-farm-success/10 text-farm-success'
                          : farmer.kycStatus === 'PENDING'
                          ? 'bg-farm-info/10 text-farm-info'
                          : farmer.kycStatus === 'REJECTED'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {farmer.kycStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {farmers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No farmers available</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
