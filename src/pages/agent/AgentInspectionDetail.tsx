import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Camera, MapPin, User, Package, FileText, AlertCircle, ClipboardCheck } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { getAppState, updateOrderStatus, formatNaira, formatDate, confirmDelivery } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { toast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/ui/FileUploader';
import { Modal } from '@/components/ui/Modal';

const AgentInspectionDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const state = getAppState();
  const order = state.orders.find(o => o.id === orderId);
  const listing = order ? state.listings.find(l => l.id === order.listingId) : null;

  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!order) {
    return (
      <AgentLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
          <button onClick={() => navigate('/agent/inspections')} className="mt-4 text-primary">
            Back to Inspections
          </button>
        </div>
      </AgentLayout>
    );
  }

  const canInspect = order.status === 'Pending' || order.status === 'Accepted';
  const canVerifyDelivery = order.status === 'InTransit' || order.status === 'PickupScheduled';

  const handleInspect = () => {
    if (!inspectionPhotos.length && !inspectionNotes.trim()) {
      toast({ 
        title: 'Inspection details required', 
        description: 'Please add photos or notes from your inspection',
        variant: 'destructive' 
      });
      return;
    }

    // Update order status to Processing after inspection
    if (order.status === 'Pending' || order.status === 'Accepted') {
      updateOrderStatus(order.id, 'Processing');
      toast({ 
        title: 'Inspection completed', 
        description: 'Order quality has been verified and marked as processing.' 
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleVerifyDelivery = () => {
    if (!inspectionPhotos.length) {
      toast({ 
        title: 'Delivery photos required', 
        description: 'Please add photos as proof of delivery',
        variant: 'destructive' 
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmDeliveryVerification = () => {
    confirmDelivery(order.id, {
      photos: inspectionPhotos,
      notes: inspectionNotes || 'Delivery verified by field agent',
      timestamp: new Date().toISOString(),
    });
    
    toast({ 
      title: 'Delivery verified', 
      description: 'Order has been marked as delivered and payment will be released.' 
    });
    setShowConfirmModal(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <AgentLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <button onClick={() => navigate('/agent/inspections')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Inspections
        </button>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Order Inspection</h1>
          <p className="text-muted-foreground">Verify produce quality and delivery status</p>
        </div>

        {/* Order Info Card */}
        <div className="farm-card">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <h2 className="text-xl font-semibold text-foreground mb-2">{order.commodity}</h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                  <p className="font-medium text-foreground">{order.quantityKg}kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price per kg</p>
                  <p className="font-medium text-foreground">{formatNaira(order.pricePerKg)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold text-primary text-lg">{formatNaira(order.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    order.status === 'Delivered' ? 'bg-farm-success/10 text-farm-success' :
                    order.status === 'Pending' ? 'bg-farm-warning/10 text-farm-warning' :
                    'bg-farm-info/10 text-farm-info'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parties Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Farmer</h3>
            </div>
            <p className="font-medium text-foreground">{order.farmerName}</p>
            <p className="text-sm text-muted-foreground mt-1">Seller</p>
          </div>
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Buyer</h3>
            </div>
            <p className="font-medium text-foreground">{order.buyerName}</p>
            <p className="text-sm text-muted-foreground mt-1">Purchaser</p>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Pickup Location</h3>
          </div>
          <p className="font-medium text-foreground">{order.pickupLocation}</p>
        </div>

        {/* Inspection Form */}
        {(canInspect || canVerifyDelivery) && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {canInspect ? 'Quality Inspection' : 'Delivery Verification'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {canInspect ? 'Inspection Photos' : 'Delivery Photos'} (Required)
                </label>
                <FileUploader 
                  files={inspectionPhotos} 
                  onFilesChange={setInspectionPhotos} 
                  maxFiles={5}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {canInspect 
                    ? 'Take photos showing produce quality, condition, and quantity'
                    : 'Take photos showing delivered produce at buyer location'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder={canInspect 
                    ? "Add notes about produce quality, grade, condition, any issues found..."
                    : "Add notes about delivery verification, buyer confirmation, any issues..."}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {canInspect && (
                  <button
                    onClick={handleInspect}
                    disabled={!inspectionPhotos.length && !inspectionNotes.trim()}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Complete Inspection
                  </button>
                )}
                {canVerifyDelivery && (
                  <button
                    onClick={handleVerifyDelivery}
                    disabled={!inspectionPhotos.length}
                    className="flex-1 px-6 py-3 bg-farm-success text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify Delivery
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Evidence (if already verified) */}
        {order.evidence && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-farm-success" />
              <h3 className="font-semibold text-foreground">Verification Evidence</h3>
            </div>
            {order.evidence.photos && order.evidence.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {order.evidence.photos.map((photo, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-border">
                    <img 
                      src={photo} 
                      alt={`Evidence ${i + 1}`} 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {order.evidence.notes && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-sm text-foreground">{order.evidence.notes}</p>
              </div>
            )}
            {order.evidence.timestamp && (
              <p className="text-xs text-muted-foreground mt-3">
                Verified: {formatDate(order.evidence.timestamp)}
              </p>
            )}
          </div>
        )}

        {/* Confirm Delivery Modal */}
        <Modal 
          isOpen={showConfirmModal} 
          onClose={() => setShowConfirmModal(false)} 
          title="Confirm Delivery Verification?"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to verify this delivery? This will mark the order as delivered and release payment to the farmer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeliveryVerification}
                className="flex-1 py-3 bg-farm-success text-white rounded-xl font-medium"
              >
                Verify Delivery
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AgentLayout>
  );
};

export default AgentInspectionDetail;
