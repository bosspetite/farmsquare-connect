import React from 'react';
import { FileText, TrendingUp, Package, CheckCircle } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAppState, formatNaira, formatDate } from '@/lib/store';

const AgentReports = () => {
  const state = getAppState();
  const orders = state.orders;
  const farmers = state.farmers;
  
  const completedOrders = orders.filter(o => o.status === 'Delivered');
  const totalVolume = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const verifiedFarmers = farmers.filter(f => f.kycStatus === 'APPROVED').length;

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">View inspection and farmer statistics</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{completedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Completed Inspections</p>
          </div>
          <div className="farm-card text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(totalVolume)}</p>
            <p className="text-sm text-muted-foreground">Total Volume</p>
          </div>
          <div className="farm-card text-center">
            <Package className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{farmers.length}</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="farm-card text-center">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{verifiedFarmers}</p>
            <p className="text-sm text-muted-foreground">Verified Farmers</p>
          </div>
        </div>

        {/* Recent Completed Inspections */}
        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">Recent Completed Inspections</h3>
          {completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No completed inspections yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                    <p className="text-sm text-muted-foreground">
                      {order.farmerName} → {order.buyerName}
                    </p>
                    {order.deliveredAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Delivered {formatDate(order.deliveredAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatNaira(order.amount)}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentReports;



