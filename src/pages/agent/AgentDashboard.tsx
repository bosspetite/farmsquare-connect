import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, TrendingUp, Loader2 } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/store';
import { getAllProfiles, getAllOrders } from '@/services/databaseService';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    farmersThisMonth: 0,
    inspectionsToday: 0,
    completedInspections: 0,
  });
  const [myTasks, setMyTasks] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profiles, orders] = await Promise.all([
          getAllProfiles('farmer'),
          getAllOrders(),
        ]);

        const now = new Date();
        const farmersThisMonth = profiles.filter(f => {
          const created = new Date(f.created_at);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;

        const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
        const readyForVerification = orders.filter(o => o.status === 'InTransit' || o.status === 'PickupScheduled');
        const completedInspections = orders.filter(o => o.status === 'Delivered').length;

        setStats({
          totalFarmers: profiles.length,
          farmersThisMonth,
          inspectionsToday: pendingOrders.length,
          completedInspections,
        });

        setMyTasks([...pendingOrders, ...readyForVerification].slice(0, 5));
      } catch (err: any) {
        console.error('Error loading agent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AgentLayout>
    );
  }

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-farm-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {myTasks.length} Active Task{myTasks.length > 1 ? 's' : ''} Requiring Your Attention
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {myTasks.length} task{myTasks.length > 1 ? 's' : ''} need{myTasks.length === 1 ? 's' : ''} inspection or verification
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Users} label="Total Farmers" value={stats.totalFarmers} />
          <StatCard icon={TrendingUp} label="Farmers This Month" value={stats.farmersThisMonth} />
          <StatCard icon={ClipboardCheck} label="Inspections Today" value={stats.inspectionsToday} />
          <StatCard icon={ClipboardCheck} label="Completed" value={stats.completedInspections} />
        </div>

        {/* Recent Tasks */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recent Tasks</h3>
            <button 
              onClick={() => navigate('/agent/inspections')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate('/agent/inspections')}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Order #{task.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{task.status}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimeAgo(task.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
