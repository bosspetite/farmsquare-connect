import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, ShoppingCart, X } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira, formatTimeAgo } from '@/lib/store';
import { Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getFarmerOrders, updateOrderStatus } from '@/services/orderService';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Paid', 'Accepted', 'Processing', 'InTransit', 'Delivered', 'Disputed', 'Rejected'];

const FarmerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [confirmModal, setConfirmModal] = useState<{ order: Order; action: 'accept' | 'reject' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const loadOrders = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const orderRows = await getFarmerOrders(user.id);
      setOrders(orderRows);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load your orders right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [user?.id]);

  const filteredOrders = useMemo(
    () => (activeFilter === 'All' ? orders : orders.filter((order) => order.status === activeFilter)),
    [orders, activeFilter]
  );

  const handleAction = async () => {
    if (!confirmModal) return;

    const newStatus: OrderStatus = confirmModal.action === 'accept' ? 'Accepted' : 'Rejected';
    try {
      setIsMutating(true);
      await updateOrderStatus(confirmModal.order.id, newStatus);
      setConfirmModal(null);
      await loadOrders();
      toast({ title: `Order ${newStatus.toLowerCase()}` });
    } catch (error: any) {
      toast({
        title: 'Unable to update order',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      setIsMutating(true);
      await updateOrderStatus(orderId, status);
      await loadOrders();
      toast({
        title: 'Order updated',
        description: status === 'InTransit' ? 'Buyer can now confirm delivery.' : undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Unable to update order',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Orders</h1>

        {loadError && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Orders unavailable</p>
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </div>
              </div>
              <button
                onClick={() => void loadOrders()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold min-h-[44px] active:scale-[0.98]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 rounded-full text-sm sm:text-base font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {filter === 'All' ? 'All' : filter === 'InTransit' ? 'Out for Delivery' : filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="farm-card">
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Orders from buyers will appear here"
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="farm-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">{order.commodity}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{order.quantityKg}kg - {order.buyerName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment: {order.paymentStatus || 'Unpaid'}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-primary">{formatNaira(order.amount)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                  </div>

                  {order.status === 'Paid' ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmModal({ order, action: 'reject' })}
                        disabled={isMutating}
                        className="px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setConfirmModal({ order, action: 'accept' })}
                        disabled={isMutating}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  ) : order.status === 'Accepted' ? (
                    <button
                      onClick={() => void handleQuickStatusUpdate(order.id, 'Processing')}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      Mark as Preparing
                    </button>
                  ) : order.status === 'Processing' ? (
                    <button
                      onClick={() => void handleQuickStatusUpdate(order.id, 'InTransit')}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      Mark as Out for Delivery
                    </button>
                  ) : order.status === 'InTransit' ? (
                    <div className="px-4 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm sm:text-base font-semibold min-h-[44px] flex items-center">
                      Waiting for Buyer Confirmation
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

        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={confirmModal?.action === 'accept' ? 'Accept Order?' : 'Reject Order?'}
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {confirmModal?.action === 'accept'
                ? 'You will now move this order into preparation.'
                : 'This order will be rejected and marked for refund/dispute handling.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAction()}
                disabled={isMutating}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${
                  confirmModal?.action === 'accept'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {confirmModal?.action === 'accept' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {isMutating ? 'Saving...' : confirmModal?.action === 'accept' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerOrders;
