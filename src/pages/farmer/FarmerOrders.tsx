import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, X } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { formatNaira, formatTimeAgo, getAppState } from '@/lib/store';
import { useOrderStore } from '@/stores/orderStore';
import { Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Pending', 'Accepted', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered'];

const FarmerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use Zustand store for orders - single source of truth
  const { getFarmerOrders, refreshOrders, subscribe, updateOrderStatus: updateStatus } = useOrderStore();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [confirmModal, setConfirmModal] = useState<{ order: Order; action: 'accept' | 'reject' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get orders from Zustand store - always refresh first
  const allOrders = useMemo(() => {
    if (!user) return [];
    // Refresh store before getting orders to ensure we have latest data
    refreshOrders();
    return getFarmerOrders(user.id);
  }, [user, refreshKey, getFarmerOrders, refreshOrders]);

  // Subscribe to order changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });

    // Refresh on mount
    refreshOrders();

    // Refresh when window gains focus
    const handleFocus = () => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);

    // Refresh when localStorage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'farmsquare_state') {
        refreshOrders();
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      refreshOrders();
      setRefreshKey(prev => prev + 1);
    }, 10000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [subscribe, refreshOrders, user]);

  const orders = activeFilter === 'All' ? allOrders : allOrders.filter(o => o.status === activeFilter);

  const handleAction = () => {
    if (!confirmModal) return;
    const newStatus: OrderStatus = confirmModal.action === 'accept' ? 'Accepted' : 'Rejected';
    updateStatus(confirmModal.order.id, newStatus);
    setConfirmModal(null);
    toast({ title: `Order ${newStatus.toLowerCase()}` });
    // Refresh orders immediately
    refreshOrders();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Orders</h1>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 rounded-full text-sm sm:text-base font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {filter === 'All' ? 'All' : 
               filter === 'InTransit' ? 'In Transit' : 
               filter === 'PickupScheduled' ? 'Ready for Pickup' :
               filter}
            </button>
          ))}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Orders from buyers will appear here"
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="farm-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">{order.commodity}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{order.quantityKg}kg · {order.buyerName}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-primary">{formatNaira(order.amount)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                  </div>
                  {order.status === 'Pending' ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmModal({ order, action: 'reject' })}
                        className="px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98]"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => setConfirmModal({ order, action: 'accept' })}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98]"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/farmer/orders/${order.id}`)}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98]"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Modal */}
        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={confirmModal?.action === 'accept' ? 'Accept Order?' : 'Decline Order?'}
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {confirmModal?.action === 'accept'
                ? 'You will be expected to prepare the produce for pickup.'
                : 'This order will be declined and the buyer will be notified.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  confirmModal?.action === 'accept' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {confirmModal?.action === 'accept' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {confirmModal?.action === 'accept' ? 'Accept' : 'Decline'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerOrders;
