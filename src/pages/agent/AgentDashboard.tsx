import { Users, ClipboardCheck, UserPlus, TrendingUp } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';

const AgentDashboard = () => {
  const { user } = useAuth();

  return (
    <AgentLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Agent Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={UserPlus} label="Tasks Today" value={5} />
          <StatCard icon={Users} label="Farmers Onboarded" value={45} />
          <StatCard icon={ClipboardCheck} label="Inspections" value={120} />
          <StatCard icon={TrendingUp} label="This Month" value={12} />
        </div>

        <div className="farm-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Today's Tasks</h3>
          <div className="space-y-3">
            {[
              { type: 'Onboard', name: 'New Farmer - Kaduna', status: 'Pending' },
              { type: 'Inspect', name: 'Maize Grading - Zaria', status: 'Scheduled' },
              { type: 'Assist', name: 'Listing Help - Kano', status: 'Completed' },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{task.name}</p>
                  <p className="text-sm text-muted-foreground">{task.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  task.status === 'Completed' ? 'bg-farm-success/10 text-farm-success' :
                  task.status === 'Pending' ? 'bg-farm-warning/10 text-farm-warning' :
                  'bg-farm-info/10 text-farm-info'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
