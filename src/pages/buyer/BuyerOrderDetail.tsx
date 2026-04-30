import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Flag, Loader2, MapPin, Shield, Truck, User } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Timeline } from '@/components/ui/Timeline';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatNaira } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { Escrow, Order } from '@/types';
import { confirmOrderDelivery, disputeOrder, getEscrowByOrderId, getOrderById } from '@/services/orderService';
import { toast } from '@/hooks/use-toast';

const BuyerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState('');

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
    loadOrder();
  }, [orderId]);

  const progressStages = useMemo(() => {
    if (!order) return [];

    return [
      {
        label: 'Payment Confirmed',
        description: 'Your payment has been confirmed and the order is waiting for farmer action.',
        active: ['Paid', 'Accepted', 'Processing', 'InTransit', 'Delivered', 'Disputed'].includes(order.status),
      },
      {
        label: 'Farmer Accepted',
        description: 'The farmer has accepted your order.',
        active: ['Accepted', 'Processing', 'InTransit', 'Delivered', 'Disputed'].includes(order.status),
      },
      {
        label: 'Preparing Order',
        description: 'Your order is being prepared.',
        active: ['Processing', 'InTransit', 'Delivered', 'Disputed'].includes(order.status),
      },
      {
        label: 'Out for Delivery',
        description: 'Your order is on the way.',
        active: ['InTransit', 'Delivered', 'Disputed'].includes(order.status),
      },
      {
        label: 'Delivered / Completed',
        description: order.paymentStatus === 'Released' ? 'Order completed successfully.' : 'Confirm delivery once you receive the produce.',
        active: ['Delivered'].includes(order.status),
      },
    ];
  }, [order]);

  const getTimelineEvents = () => {
    if (!order) return [];

    if (order.status === 'Rejected' || order.status === 'Cancelled') {
      return [
        { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
        { label: order.status === 'Rejected' ? 'Order Rejected' : 'Order Cancelled', completed: true },
      ];
    }

    return [
      { label: 'Payment Confirmed', timestamp: order.paymentStatus && order.paymentStatus !== 'Unpaid' ? formatDate(order.createdAt) : undefined, completed: ['Paid', 'Released', 'Refunded'].includes(order.paymentStatus || ''), current: order.status === 'Paid' },
      { label: 'Farmer Accepted', timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined, completed: !!order.acceptedAt, current: order.status === 'Accepted' },
      { label: 'Preparing Order', timestamp: order.processingAt ? formatDate(order.processingAt) : undefined, completed: !!order.processingAt || ['InTransit', 'Delivered', 'Disputed'].includes(order.status), current: order.status === 'Processing' },
      { label: 'Out for Delivery', timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined, completed: !!order.inTransitAt || ['Delivered', 'Disputed'].includes(order.status), current: order.status === 'InTransit' },
      { label: 'Delivered / Completed', timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined, completed: !!order.deliveredAt, current: order.status === 'Delivered' },
    ];
  };

  const canConfirmDelivery = order && ['InTransit', 'Delivered'].includes(order.status);
  const canReportIssue = order && !['Pending', 'Rejected', 'Cancelled', 'Refunded', 'Delivered', 'Disputed'].includes(order.status);

  const handleConfirmDelivery = async () => {
    if (!order) return;

    try {
      setIsMutating(true);
      await confirmOrderDelivery(order.id);
      await loadOrder();
      toast({
        title: 'Delivery confirmed.',
        description: 'Order completed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Could not confirm delivery.',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleReportIssue = async () => {
    if (!order) return;

    try {
      setIsMutating(true);
      await disputeOrder(order.id, disputeNotes);
      setShowDisputeModal(false);
      setDisputeNotes('');
      await loadOrder();
      toast({
        title: 'Issue reported.',
        description: 'Support can review this order from the dispute queue.',
      });
    } catch (error: any) {
      toast({
        title: 'Could not report this issue.',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
          <button onClick={() => navigate('/buyer/orders')} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /> Back to Orders
          </button>
          <div className="farm-card">
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </BuyerLayout>
    );
  }

  if (!order || loadError) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
          <button onClick={() => navigate('/buyer/orders')} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /> Back to Orders
          </button>
          <div className="farm-card bg-destructive/5 border-destructive/20 text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Order unavailable</p>
            <p className="text-muted-foreground">{loadError || 'Order not found'}</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <button onClick={() => navigate('/buyer/orders')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Orders
        </button>

        <div className="farm-card">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={order.listingPhotos && order.listingPhotos.length > 0 ? order.listingPhotos[0] : getProduceImage(order.commodity)}
                alt={order.commodity}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = getProduceImage(order.commodity);
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground">{order.commodity}</h1>
                  <p className="text-muted-foreground">{order.quantityKg}kg @ {formatNaira(order.pricePerKg)}/kg</p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <p className="text-2xl font-bold text-primary">{formatNaira(order.amount)}</p>
            </div>
          </div>
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Order Progress</h3>
          </div>
          <div className="space-y-3">
            {progressStages.map((stage, index) => (
              <div key={stage.label} className="flex items-start gap-3">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${stage.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${stage.active ? 'text-foreground' : 'text-muted-foreground'}`}>{stage.label}</p>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Traceability</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Origin</span>
              <span className="text-foreground">{order.listingRegion || order.pickupLocation}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quality Grade</span>
              <span className="text-foreground">Grade {order.grade || 'A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Farmer</span>
              <span className="text-foreground">{order.farmerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Reference</span>
              <span className="text-foreground break-all text-right">{order.paymentReference || order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Status</span>
              <span className="text-foreground">{order.paymentStatus || 'Unpaid'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Escrow Status</span>
              <span className="text-foreground">{escrow?.status || 'Not created yet'}</span>
            </div>
          </div>
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Seller</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{order.farmerName}</p>
              <p className="text-sm text-muted-foreground">Verified Farmer</p>
            </div>
          </div>
        </div>

        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pickup Location</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-farm-brown/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-farm-brown-light" />
            </div>
            <p className="font-medium text-foreground">{order.pickupLocation}</p>
          </div>
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Order Timeline</h3>
          </div>
          <Timeline events={getTimelineEvents()} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {canConfirmDelivery && (
            <button
              onClick={handleConfirmDelivery}
              disabled={isMutating}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Delivery
            </button>
          )}
          {canReportIssue && (
            <button
              onClick={() => setShowDisputeModal(true)}
              disabled={isMutating}
              className="w-full py-4 bg-destructive/10 text-destructive rounded-xl font-semibold border border-destructive/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Flag className="w-4 h-4" />
              Report Issue
            </button>
          )}
        </div>

        {order.status === 'Delivered' && order.paymentStatus === 'Released' && (
          <div className="farm-card bg-farm-success/10 border-farm-success/20">
            <p className="font-semibold text-foreground">Order completed successfully.</p>
            <p className="text-sm text-muted-foreground mt-1">Funds have been released from escrow to the farmer.</p>
          </div>
        )}

        <Modal isOpen={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="Report Order Issue">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tell us what went wrong. This will flag the order for admin review and keep the order in dispute.
            </p>
            <textarea
              value={disputeNotes}
              onChange={(event) => setDisputeNotes(event.target.value)}
              rows={4}
              placeholder="Describe the issue with this order"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                disabled={isMutating}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50"
              >
                {isMutating ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrderDetail;
