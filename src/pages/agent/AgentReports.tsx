import React, { useEffect, useState } from 'react';
import { FileText, TrendingUp, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { formatNaira, formatDate } from '@/lib/store';
import { getDeliveries, getFarmersForAgent, getPendingInspections } from '@/services/agentService';
import { Order } from '@/types';

const AgentReports = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [farmerCount, setFarmerCount] = useState(0);
  const [verifiedFarmers, setVerifiedFarmers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [inspections, deliveries, farmers] = await Promise.all([
        getPendingInspections(),
        getDeliveries(),
        getFarmersForAgent(),
      ]);

      const mergedOrders = [...inspections, ...deliveries].filter(
        (order, index, collection) => collection.findIndex((candidate) => candidate.id === order.id) === index
      );

      setOrders(mergedOrders);
      setFarmerCount(farmers.length);
      setVerifiedFarmers(farmers.filter((farmer) => farmer.kycStatus === 'APPROVED').length);
      console.log('[AgentReports] Loaded reports', {
        orders: mergedOrders.length,
        farmers: farmers.length,
      });
    } catch (error) {
      console.error('[AgentReports] Failed to load reports', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const completedOrders = orders.filter((order) => order.status === 'Delivered');
  const totalVolume = completedOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Reports</h1>
            <p className="text-muted-foreground">View real inspection and farmer statistics</p>
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
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="farm-card text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{completedOrders.length}</p>
                <p className="text-sm text-muted-foreground">Completed Deliveries</p>
              </div>
              <div className="farm-card text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{formatNaira(totalVolume)}</p>
                <p className="text-sm text-muted-foreground">Trade Volume</p>
              </div>
              <div className="farm-card text-center">
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{farmerCount}</p>
                <p className="text-sm text-muted-foreground">Total Farmers</p>
              </div>
              <div className="farm-card text-center">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-semibold text-foreground">{verifiedFarmers}</p>
                <p className="text-sm text-muted-foreground">Verified Farmers</p>
              </div>
            </div>

            <div className="farm-card">
              <h3 className="font-semibold text-foreground mb-4">Recent Completed Deliveries</h3>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading report data...</p>
                </div>
              ) : completedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed deliveries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedOrders.slice(0, 10).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{order.commodity} - {order.quantityKg}kg</p>
                        <p className="text-sm text-muted-foreground">{order.farmerName} → {order.buyerName}</p>
                        {order.deliveredAt && (
                          <p className="text-xs text-muted-foreground mt-1">Delivered {formatDate(order.deliveredAt)}</p>
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
          </>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentReports;
