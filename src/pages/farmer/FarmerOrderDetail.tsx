import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Flag, MapPin, User } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Timeline } from '@/components/ui/Timeline';
import { formatDate, formatNaira } from '@/lib/store';
import { Escrow, Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getEscrowByOrderId, getOrderById, updateOrderStatus } from '@/services/orderService';

const FarmerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrder = async () => {
    if (!orderId) {
      setLoadError('Order not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const [orderRow, escrowRow] = await Promise.all([getOrderById(orderId), getEscrowByOrderId(orderId)]);
      setOrder(orderRow);
      setEscrow(escrowRow);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load this order right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const workflowNotes = useMemo(() => {
    if (!order) return [];
    return [
      {
        label: 'Paid',
        completed: order.status !== 'Pending',
        current: order.status === 'Paid',
        timestamp: order.paymentStatus && order.paymentStatus !== 'Unpaid' ? formatDate(order.createdAt) : undefined,
        description: 'Buyer payment confirmed and escrow hold created.',
      },
      {
        label: 'Accepted',
        completed: !!order.acceptedAt || ['Processing', 'InTransit', 'Delivered', 'Disputed'].includes(order.status),
        current: order.status === 'Accepted',
        timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined,
        description: 'Farmer accepted order.',
      },
      {
        label: 'Preparing',
        completed: !!order.processingAt || ['InTransit', 'Delivered', 'Disputed'].includes(order.status),
        current: order.status === 'Processing',
        timestamp: order.processingAt ? formatDate(order.processingAt) : undefined,
        description: 'Farmer is preparing produce.',
      },
      {
        label: 'Out for Delivery',
        completed: !!order.inTransitAt || ['Delivered', 'Disputed'].includes(order.status),
        current: order.status === 'InTransit',
        timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined,
        description: 'Order is on the way to buyer.',
      },
      {
        label: 'Delivered / Completed',
        completed: !!order.deliveredAt,
        current: order.status === 'Delivered',
        timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined,
        description: order.paymentStatus === 'Released' ? 'Escrow released to wallet.' : 'Waiting for buyer confirmation.',
      },
    ];
  }, [order]);

  const nextStatus = useMemo<OrderStatus | null>(() => {
    if (!order) return null;
    if (order.status === 'Paid') return 'Accepted';
    if (order.status === 'Accepted') return 'Processing';
    if (order.status === 'Processing') return 'InTransit';
    return null;
  }, [order]);

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!order) return;

    try {
      setIsUpdating(true);
      await updateOrderStatus(order.id, status);
      await loadOrder();
      toast({
        title: 'Order status updated',
      });
    } catch (error: any) {
      toast({
        title: 'Unable to update order',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <FarmerLayout>
        <div className="space-y-6 animate-fade-up">
          <button onClick={() => navigate('/farmer/orders')} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /> Back to Orders
          </button>
          <div className="farm-card">
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </FarmerLayout>
    );
  }

  if (!order || loadError) {
    return (
      <FarmerLayout>
        <div className="space-y-6 animate-fade-up">
          <button onClick={() => navigate('/farmer/orders')} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /> Back to Orders
          </button>
          <div className="farm-card bg-destructive/5 border-destructive/20 text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Order unavailable</p>
            <p className="text-muted-foreground">{loadError || 'Order not found'}</p>
          </div>
        </div>
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate('/farmer/orders')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Orders
        </button>

        <div className="farm-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{order.commodity}</h1>
              <p className="text-muted-foreground">{order.quantityKg}kg @ {formatNaira(order.pricePerKg)}/kg</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <p className="text-2xl font-bold text-primary">{formatNaira(order.amount)}</p>
          <p className="text-xs text-muted-foreground mt-2">Payment: {order.paymentStatus || 'Unpaid'}</p>
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Buyer</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{order.buyerName}</p>
              <p className="text-sm text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Delivery Address</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-farm-brown/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-farm-brown-light" />
            </div>
            <p className="font-medium text-foreground">{order.pickupLocation}</p>
          </div>
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Workflow Timeline</h3>
          <Timeline events={workflowNotes} />
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Escrow Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escrow Status</span>
              <span className="text-foreground">{escrow?.status || 'Not created'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Reference</span>
              <span className="text-foreground break-all text-right">{order.paymentReference || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Released At</span>
              <span className="text-foreground">{escrow?.releasedAt ? formatDate(escrow.releasedAt) : 'Pending'}</span>
            </div>
          </div>
        </div>

        {order.status === 'Paid' && (
          <div className="space-y-3">
            <button
              onClick={() => void handleStatusUpdate('Accepted')}
              disabled={isUpdating}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Accept Order'}
            </button>
            <button
              onClick={() => void handleStatusUpdate('Rejected')}
              disabled={isUpdating}
              className="w-full py-4 bg-destructive/10 text-destructive rounded-xl font-medium border border-destructive/20 disabled:opacity-50"
            >
              Reject Order
            </button>
          </div>
        )}

        {nextStatus && order.status !== 'Paid' && (
          <button
            onClick={() => void handleStatusUpdate(nextStatus)}
            disabled={isUpdating}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : nextStatus === 'Processing' ? 'Mark as Preparing' : 'Mark as Out for Delivery'}
          </button>
        )}

        {order.status === 'InTransit' && (
          <div className="farm-card bg-farm-info/10 border-farm-info/20">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-farm-info" />
              <p className="text-sm text-foreground">Waiting for buyer to confirm delivery.</p>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerOrderDetail;
