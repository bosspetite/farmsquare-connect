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
      { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
      { label: 'Accepted', timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined, completed: !!order.acceptedAt, current: order.status === 'Pending' },
      { label: 'Pickup Scheduled', timestamp: order.pickupScheduledAt ? formatDate(order.pickupScheduledAt) : undefined, completed: !!order.pickupScheduledAt, current: order.status === 'Accepted' },
      { label: 'In Transit', timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined, completed: !!order.inTransitAt, current: order.status === 'PickupScheduled' },
      { label: 'Delivered', timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined, completed: !!order.deliveredAt, current: order.status === 'InTransit' },
    ];
    if (order.status === 'Rejected') {
      return [{ label: 'Order Rejected', completed: true }];
    }
    return events;
  };

  const getNextStatus = (): OrderStatus | null => {
    switch (order.status) {
      case 'Accepted': return 'PickupScheduled';
      case 'PickupScheduled': return 'InTransit';
      case 'InTransit': return 'Delivered';
      default: return null;
    }
  };

  const handleProgress = () => {
    const nextStatus = getNextStatus();
    if (nextStatus) {
      updateOrderStatus(order.id, nextStatus);
      toast({ title: 'Order status updated' });
      window.location.reload();
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

        {/* Evidence */}
        {order.evidence && (
          <div className="farm-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Delivery Evidence</h3>
            {order.evidence.photos.length > 0 && (
              <div className="flex gap-2 mb-3">
                {order.evidence.photos.map((photo, i) => (
                  <img key={i} src={photo} alt={`Evidence ${i + 1}`} className="w-20 h-20 rounded-xl object-cover" />
                ))}
              </div>
            )}
            {order.evidence.notes && (
              <p className="text-sm text-muted-foreground">{order.evidence.notes}</p>
            )}
          </div>
        )}

        {/* Action Button */}
        {nextStatus && (
          <button
            onClick={handleProgress}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow"
          >
            Mark as {nextStatus === 'PickupScheduled' ? 'Pickup Scheduled' : nextStatus === 'InTransit' ? 'In Transit' : 'Delivered'}
          </button>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerOrderDetail;
