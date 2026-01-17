import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Package } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Timeline } from '@/components/ui/Timeline';
import { useAuth } from '@/contexts/AuthContext';
import { getAppState, updateOrderStatus, formatNaira, formatDate } from '@/lib/store';
import { OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

const FarmerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  const order = state.orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <FarmerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </FarmerLayout>
    );
  }

  const getTimelineEvents = () => {
    const events = [
      { 
        label: 'Order Placed', 
        timestamp: formatDate(order.createdAt), 
        completed: true,
        description: `Buyer placed order for ${order.quantityKg}kg`
      },
      { 
        label: 'Accepted', 
        timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined, 
        completed: !!order.acceptedAt, 
        current: order.status === 'Pending',
        description: order.acceptedAt ? 'Order accepted' : 'Waiting for acceptance'
      },
      { 
        label: 'Processing', 
        timestamp: order.status === 'Processing' ? new Date().toISOString() : undefined, 
        completed: ['Processing', 'PickupScheduled', 'InTransit', 'Delivered'].includes(order.status), 
        current: order.status === 'Accepted',
        description: 'Preparing produce for pickup'
      },
      { 
        label: 'Ready for Pickup', 
        timestamp: order.pickupScheduledAt ? formatDate(order.pickupScheduledAt) : undefined, 
        completed: !!order.pickupScheduledAt, 
        current: order.status === 'Processing',
        description: order.pickupScheduledAt ? 'Ready for buyer pickup' : 'Mark as ready when produce is prepared'
      },
      { 
        label: 'In Transit', 
        timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined, 
        completed: !!order.inTransitAt, 
        current: order.status === 'PickupScheduled',
        description: order.inTransitAt ? 'Order is on the way' : 'Mark as in transit after pickup'
      },
      { 
        label: 'Delivered', 
        timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined, 
        completed: !!order.deliveredAt, 
        current: order.status === 'InTransit',
        description: order.deliveredAt ? 'Order delivered, waiting for buyer confirmation' : 'Mark as delivered when buyer receives'
      },
    ];
    if (order.status === 'Rejected') {
      return [{ 
        label: 'Order Rejected', 
        completed: true,
        description: 'Order was rejected, buyer has been refunded'
      }];
    }
    return events;
  };

  const getNextStatus = (): OrderStatus | null => {
    switch (order.status) {
      case 'Accepted': return 'Processing';
      case 'Processing': return 'PickupScheduled';
      case 'PickupScheduled': return 'InTransit';
      case 'InTransit': return 'Delivered';
      default: return null;
    }
  };

  const handleProgress = () => {
    const nextStatus = getNextStatus();
    if (nextStatus) {
      updateOrderStatus(order.id, nextStatus);
      toast({ 
        title: 'Order status updated',
        description: nextStatus === 'Delivered' ? 'Waiting for buyer confirmation to release payment.' : undefined
      });
      // Use setTimeout to allow state to update before reload
      setTimeout(() => window.location.reload(), 100);
    }
  };
  
  const handleAccept = () => {
    updateOrderStatus(order.id, 'Accepted');
    toast({ title: 'Order accepted!' });
    setTimeout(() => window.location.reload(), 100);
  };
  
  const handleReject = () => {
    if (window.confirm('Are you sure you want to reject this order? The buyer will be refunded.')) {
      updateOrderStatus(order.id, 'Rejected');
      toast({ title: 'Order rejected. Buyer has been refunded.' });
      setTimeout(() => window.location.reload(), 100);
    }
  };

  const nextStatus = getNextStatus();

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate('/farmer/orders')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Orders
        </button>

        {/* Order Header */}
        <div className="farm-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{order.commodity}</h1>
              <p className="text-muted-foreground">{order.quantityKg}kg @ {formatNaira(order.pricePerKg)}/kg</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <p className="text-2xl font-bold text-primary">{formatNaira(order.amount)}</p>
        </div>

        {/* Buyer Info */}
        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Buyer</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{order.buyerName}</p>
              <p className="text-sm text-muted-foreground">Enterprise Buyer</p>
            </div>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pickup Location</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-farm-brown/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-farm-brown-light" />
            </div>
            <p className="font-medium text-foreground">{order.pickupLocation}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Order Timeline</h3>
          <Timeline events={getTimelineEvents()} />
        </div>

        {/* Order Summary */}
        <div className="farm-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Commodity</span>
              <span className="text-sm font-medium text-foreground">{order.commodity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="text-sm font-medium text-foreground">{order.quantityKg}kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price per kg</span>
              <span className="text-sm font-medium text-foreground">{formatNaira(order.pricePerKg)}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total Amount</span>
              <span className="text-lg font-bold text-primary">{formatNaira(order.amount)}</span>
            </div>
          </div>
        </div>

        {/* Evidence - Field Agent Verification (Read-only) */}
        {order.evidence && (
          <div className="farm-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Delivery Evidence</h3>
            <p className="text-xs text-muted-foreground mb-3">Verified by Field Agent</p>
            {order.evidence.photos.length > 0 && (
              <div className="flex gap-2 mb-3">
                {order.evidence.photos.map((photo, i) => (
                  <img 
                    key={i} 
                    src={photo} 
                    alt={`Evidence ${i + 1}`} 
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            )}
            {order.evidence.notes && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-sm text-foreground">{order.evidence.notes}</p>
              </div>
            )}
            {order.evidence.timestamp && (
              <p className="text-xs text-muted-foreground mt-2">
                Verified: {formatDate(order.evidence.timestamp)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {order.status === 'Pending' && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow"
            >
              Accept Order
            </button>
            <button
              onClick={handleReject}
              className="w-full py-4 bg-destructive/10 text-destructive rounded-xl font-medium border border-destructive/20"
            >
              Reject Order
            </button>
          </div>
        )}
        {nextStatus && order.status !== 'Pending' && (
          <button
            onClick={handleProgress}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow"
          >
            Mark as {nextStatus === 'Processing' ? 'Processing' : 
                     nextStatus === 'PickupScheduled' ? 'Ready for Pickup' : 
                     nextStatus === 'InTransit' ? 'In Transit' : 
                     'Delivered'}
          </button>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerOrderDetail;
