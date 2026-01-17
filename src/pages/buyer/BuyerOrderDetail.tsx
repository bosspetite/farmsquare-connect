import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Truck, Shield, Package, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Timeline } from '@/components/ui/Timeline';
import { Modal } from '@/components/ui/Modal';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAppState, formatNaira, formatDate, confirmDelivery, createDispute, getDisputesByOrderId } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { getProduceImage } from '@/utils/produceImages';
import { useAuth } from '@/contexts/AuthContext';
import { DisputeType } from '@/types';

const BuyerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  const order = state.orders.find(o => o.id === orderId);
  const listing = order ? state.listings.find(l => l.id === order.listingId) : null;
  
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeType, setDisputeType] = useState<DisputeType>('other');
  const [disputeTitle, setDisputeTitle] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePhotos, setDisputePhotos] = useState<string[]>([]);
  
  // Get existing disputes for this order
  const existingDisputes = order ? getDisputesByOrderId(order.id) : [];
  const hasOpenDispute = existingDisputes.some(d => d.status === 'Open' || d.status === 'UnderReview');

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
    if (order.status === 'Rejected' || order.status === 'Cancelled') {
      return [
        { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
        { label: order.status === 'Rejected' ? 'Order Rejected' : 'Order Cancelled', completed: true },
      ];
    }
    return [
      { label: 'Order Placed', timestamp: formatDate(order.createdAt), completed: true },
      { label: 'Farmer Accepted', timestamp: order.acceptedAt ? formatDate(order.acceptedAt) : undefined, completed: !!order.acceptedAt, current: order.status === 'Pending' },
      { label: 'Processing', timestamp: order.status === 'Processing' ? formatDate(new Date().toISOString()) : undefined, completed: order.status !== 'Pending' && order.status !== 'Accepted', current: order.status === 'Processing' },
      { label: 'Pickup Scheduled', timestamp: order.pickupScheduledAt ? formatDate(order.pickupScheduledAt) : undefined, completed: !!order.pickupScheduledAt, current: order.status === 'PickupScheduled' },
      { label: 'In Transit', timestamp: order.inTransitAt ? formatDate(order.inTransitAt) : undefined, completed: !!order.inTransitAt, current: order.status === 'InTransit' },
      { label: 'Delivered', timestamp: order.deliveredAt ? formatDate(order.deliveredAt) : undefined, completed: !!order.deliveredAt, current: order.status === 'Delivered' },
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
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(order.commodity)} 
                alt={order.commodity} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getProduceImage(order.commodity);
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

        {/* Delivery Evidence */}
        {order.evidence && order.evidence.photos && order.evidence.photos.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Delivery Evidence</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {order.evidence.photos.map((photo, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-border">
                  <img 
                    src={photo} 
                    alt={`Delivery evidence ${i + 1}`} 
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            {order.evidence.notes && (
              <p className="text-sm text-muted-foreground mt-3">{order.evidence.notes}</p>
            )}
          </div>
        )}

        {/* Delivery Confirmation */}
        {order.status === 'Delivered' && (
          <div className="farm-card bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Confirm Delivery</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Confirm that you have received the order. This will release payment from escrow to the farmer.
            </p>
            <button
              onClick={() => {
                confirmDelivery(order.id);
                toast({ 
                  title: 'Delivery confirmed!', 
                  description: 'Payment has been released to the farmer.' 
                });
                setTimeout(() => window.location.reload(), 1000);
              }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium btn-glow flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Delivery & Release Payment
            </button>
          </div>
        )}

        {/* Existing Disputes Section */}
        {existingDisputes.length > 0 && (
          <div className="farm-card bg-farm-warning/5 border-farm-warning/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-farm-warning" />
              <h3 className="font-semibold text-foreground">Your Disputes</h3>
            </div>
            <div className="space-y-3">
              {existingDisputes.map((dispute) => (
                <div key={dispute.id} className="p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{dispute.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                    </div>
                    <StatusPill 
                      status={
                        dispute.status === 'Open' ? 'Pending' :
                        dispute.status === 'UnderReview' ? 'Processing' :
                        dispute.status === 'Resolved' ? 'Delivered' : 'Cancelled'
                      } 
                    />
                  </div>
                  {dispute.resolution && (
                    <div className="mt-2 p-2 bg-farm-success/10 border border-farm-success/20 rounded text-xs">
                      <p className="font-medium text-farm-success mb-1">Resolution:</p>
                      <p className="text-muted-foreground">{dispute.resolution.resolution}</p>
                      <p className="text-muted-foreground mt-1">
                        Outcome: {dispute.resolution.outcome.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raise Dispute Section - Always visible except for cancelled/rejected orders */}
        {order.status !== 'Cancelled' && order.status !== 'Rejected' && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">Need Help?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {hasOpenDispute 
                ? 'You have an open dispute for this order. If you need to add more information, please contact support.'
                : order.status === 'Delivered'
                ? 'If you have concerns about the quality, quantity, or delivery of your order, you can raise a dispute.'
                : 'If you encounter any issues with this order, you can raise a dispute for admin review.'}
            </p>
            {!hasOpenDispute && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                Raise a Dispute
              </button>
            )}
            {hasOpenDispute && (
              <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your dispute is currently being reviewed. You will be notified once a resolution is provided.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dispute Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setDisputeType('other');
            setDisputeTitle('');
            setDisputeDescription('');
            setDisputePhotos([]);
          }}
          title="Raise a Dispute"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="disputeType">Dispute Type *</Label>
              <Select value={disputeType} onValueChange={(value) => setDisputeType(value as DisputeType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality Issue</SelectItem>
                  <SelectItem value="quantity">Quantity Mismatch</SelectItem>
                  <SelectItem value="delivery">Delivery Problem</SelectItem>
                  <SelectItem value="payment">Payment Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="disputeTitle">Title *</Label>
              <Input
                id="disputeTitle"
                value={disputeTitle}
                onChange={(e) => setDisputeTitle(e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <Label htmlFor="disputeDescription">Description *</Label>
              <textarea
                id="disputeDescription"
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Provide detailed information about the dispute..."
                className="w-full min-h-[100px] px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <Label>Evidence (Photos)</Label>
              <FileUploader
                files={disputePhotos}
                onFilesChange={setDisputePhotos}
                maxFiles={5}
                accept="image/*"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeType('other');
                  setDisputeTitle('');
                  setDisputeDescription('');
                  setDisputePhotos([]);
                }}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!user || !order || !disputeTitle.trim() || !disputeDescription.trim()) {
                    toast({
                      title: 'Incomplete information',
                      description: 'Please fill all required fields',
                      variant: 'destructive'
                    });
                    return;
                  }

                  createDispute({
                    orderId: order.id,
                    raisedBy: user.id,
                    raisedByName: user.name,
                    raisedByRole: 'buyer',
                    type: disputeType,
                    status: 'Open',
                    title: disputeTitle,
                    description: disputeDescription,
                    evidence: disputePhotos.length > 0 ? {
                      photos: disputePhotos,
                      notes: disputeDescription
                    } : undefined,
                  });

                  toast({
                    title: 'Dispute raised',
                    description: 'Your dispute has been submitted. Admin will review it shortly.'
                  });

                  setShowDisputeModal(false);
                  setDisputeType('other');
                  setDisputeTitle('');
                  setDisputeDescription('');
                  setDisputePhotos([]);
                }}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrderDetail;
