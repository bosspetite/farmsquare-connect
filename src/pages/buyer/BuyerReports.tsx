import { Download, FileText, BarChart3 } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByBuyerId, formatNaira } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const BuyerReports = () => {
  const { user } = useAuth();
  const orders = user ? getOrdersByBuyerId(user.id) : [];
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalVolume = deliveredOrders.reduce((sum, o) => sum + o.quantityKg, 0);

  const handleExport = () => {
    toast({ title: 'Export started', description: 'Your report will be downloaded shortly.' });
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Reports</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="farm-card">
            <p className="text-sm text-muted-foreground mb-1">Total Spend</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(totalSpend)}</p>
          </div>
          <div className="farm-card">
            <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">{totalVolume.toLocaleString()}kg</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {[
            { title: 'Purchase History', description: 'All completed orders', icon: FileText },
            { title: 'Spend Analysis', description: 'Monthly breakdown', icon: BarChart3 },
            { title: 'Quality Report', description: 'Grade distribution', icon: FileText },
          ].map((report, i) => (
            <div key={i} className="farm-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <report.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
              >
                <Download className="w-5 h-5 text-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerReports;
