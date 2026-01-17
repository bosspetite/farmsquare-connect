import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, X } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByFarmerId, updateOrderStatus, formatNaira, formatTimeAgo } from '@/lib/store';
import { Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Pending', 'Accepted', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered'];

const FarmerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [confirmModal, setConfirmModal] = useState<{ order: Order; action: 'accept' | 'reject' } | null>(null);

  const allOrders = user ? getOrdersByFarmerId(user.id) : [];
  const orders = activeFilter === 'All' ? allOrders : allOrders.filter(o => o.status === activeFilter);

  const handleAction = () => {
    if (!confirmModal) return;
    const newStatus: OrderStatus = confirmModal.action === 'accept' ? 'Accepted' : 'Rejected';
    updateOrderStatus(confirmModal.order.id, newStatus);
    setConfirmModal(null);
    toast({ title: `Order ${newStatus.toLowerCase()}` });
    window.location.reload();
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Orders</h1>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
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
                    <h3 className="font-semibold text-foreground">{order.commodity}</h3>
                    <p className="text-sm text-muted-foreground">{order.quantityKg}kg · {order.buyerName}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">{formatNaira(order.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                  </div>
                  {order.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmModal({ order, action: 'reject' })}
                        className="px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => setConfirmModal({ order, action: 'accept' })}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/farmer/orders/${order.id}`)}
                      className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium"
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
