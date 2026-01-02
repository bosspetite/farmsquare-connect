import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Truck, Shield } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Timeline } from '@/components/ui/Timeline';
import { getAppState, formatNaira, formatDate, confirmDelivery } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const BuyerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const state = getAppState();
  const order = state.orders.find(o => o.id === orderId);
  const listing = order ? state.listings.find(l => l.id === order.listingId) : null;

  if (!order) {
    return (
      <BuyerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </BuyerLayout>
    );
  }

  const getTimelineEvents = () => {
    if (order.status === 'Rejected') {
      return [
        { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
        { label: 'Order Rejected', completed: true },
      ];
    }
    return [
      { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
      { label: 'Farmer Accepted', timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined, completed: !!order.acceptedAt, current: order.status === 'Pending' },
      { label: 'Pickup Scheduled', timestamp: order.pickupScheduledAt ? formatDate(order.pickupScheduledAt) : undefined, completed: !!order.pickupScheduledAt, current: order.status === 'Accepted' },
      { label: 'In Transit', timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined, completed: !!order.inTransitAt, current: order.status === 'PickupScheduled' },
      { label: 'Delivered', timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined, completed: !!order.deliveredAt, current: order.status === 'InTransit' },
    ];
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <button onClick={() => navigate('/buyer/orders')} className="flex items-center gap-2 text-muted-foreground">
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

        {/* Traceability */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Traceability</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Origin</span>
              <span className="text-foreground">{listing?.region || order.pickupLocation}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quality Grade</span>
              <span className="text-foreground">Grade {listing?.grade || 'A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Farmer</span>
              <span className="text-foreground">{order.farmerName}</span>
            </div>
          </div>
        </div>

        {/* Farmer Info */}
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
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Order Timeline</h3>
          </div>
          <Timeline events={getTimelineEvents()} />
        </div>

        {/* Delivery Confirmation */}
        {order.status === 'Delivered' && (
          <div className="farm-card bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">Confirm Delivery</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Confirm that you have received the order. This will release payment to the farmer.
            </p>
            <button
              onClick={() => {
                confirmDelivery(order.id);
                toast({ 
                  title: 'Delivery confirmed!', 
                  description: 'Payment has been released to the farmer.' 
                });
                window.location.reload();
              }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium btn-glow"
            >
              Confirm Delivery & Release Payment
            </button>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrderDetail;
