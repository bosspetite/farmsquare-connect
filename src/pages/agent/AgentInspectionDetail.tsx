import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ClipboardCheck, FileText, MapPin, User } from 'lucide-react';
import { AgentLayout } from '@/components/layouts/AgentLayout';
import { formatDate, formatNaira } from '@/lib/store';
import { getProduceImage } from '@/utils/produceImages';
import { toast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/ui/FileUploader';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { AgentReport, getAgentOrderById, getInspectionReportsForOrder, submitInspectionReport } from '@/services/agentService';
import { Order } from '@/types';

const AgentInspectionDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [inspectionFiles, setInspectionFiles] = useState<File[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadOrder = async () => {
    if (!orderId) {
      setErrorMessage('Order not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const [nextOrder, nextReports] = await Promise.all([
        getAgentOrderById(orderId),
        getInspectionReportsForOrder(orderId),
      ]);

      if (!nextOrder) {
        setErrorMessage('Order not found.');
        setOrder(null);
        return;
      }

      setOrder(nextOrder);
      setReports(nextReports);
    } catch (error) {
      console.error('[AgentInspectionDetail] Failed to load inspection detail', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load inspection detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const canInspect = order?.status === 'Pending' || order?.status === 'Accepted';
  const canVerifyDelivery = order?.status === 'InTransit' || order?.status === 'PickupScheduled';
  const latestReport = useMemo(() => reports[0], [reports]);

  const resetSubmissionState = () => {
    setInspectionPhotos([]);
    setInspectionFiles([]);
    setInspectionNotes('');
    setShowConfirmModal(false);
  };

  const persistReport = async (reportType: 'inspection' | 'delivery_update', nextStatus: Order['status']) => {
    if (!order || !user) {
      return;
    }

    if (inspectionFiles.length === 0 && !inspectionNotes.trim()) {
      toast({
        title: reportType === 'inspection' ? 'Inspection details required' : 'Delivery proof required',
        description: reportType === 'inspection'
          ? 'Please add photos or notes from your inspection.'
          : 'Please add delivery photos or notes before confirming.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await submitInspectionReport({
        agentId: user.id,
        orderId: order.id,
        reportType,
        notes: inspectionNotes.trim() || undefined,
        files: inspectionFiles,
        nextStatus,
      });

      toast({
        title: reportType === 'inspection' ? 'Inspection completed' : 'Delivery verified',
        description: reportType === 'inspection'
          ? 'The inspection report has been saved and the order moved to processing.'
          : 'The delivery report has been saved and the order marked as delivered.',
      });

      resetSubmissionState();
      await loadOrder();
    } catch (error) {
      console.error('[AgentInspectionDetail] Failed to save report', error);
      toast({
        title: 'Could not save report',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading inspection detail...</p>
        </div>
      </AgentLayout>
    );
  }

  if (!order) {
    return (
      <AgentLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">{errorMessage || 'Order not found'}</p>
          <button onClick={() => navigate('/agent/inspections')} className="mt-4 text-primary">
            Back to Inspections
          </button>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <button onClick={() => navigate('/agent/inspections')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Inspections
        </button>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Order Inspection</h1>
          <p className="text-muted-foreground">Verify produce quality and delivery status with real Supabase reports</p>
        </div>

        <div className="farm-card">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={order.listingPhotos?.[0] || getProduceImage(order.commodity)}
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

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Pickup Location</h3>
          </div>
          <p className="font-medium text-foreground">{order.pickupLocation}</p>
        </div>

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
                  fileObjects={inspectionFiles}
                  onFileObjectsChange={setInspectionFiles}
                  maxFiles={5}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {canInspect
                    ? 'Upload photos showing produce quality, condition, and quantity.'
                    : 'Upload photos showing delivered produce at the buyer location.'}
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
                    ? 'Add notes about produce quality, grade, condition, or issues found...'
                    : 'Add notes about delivery confirmation, buyer acknowledgement, or issues...'}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {canInspect && (
                  <button
                    onClick={() => void persistReport('inspection', 'Processing')}
                    disabled={submitting || (!inspectionFiles.length && !inspectionNotes.trim())}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Saving...' : 'Complete Inspection'}
                  </button>
                )}
                {canVerifyDelivery && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting || (!inspectionFiles.length && !inspectionNotes.trim())}
                    className="flex-1 px-6 py-3 bg-farm-success text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Saving...' : 'Verify Delivery'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {latestReport && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-farm-success" />
              <h3 className="font-semibold text-foreground">Latest Agent Report</h3>
            </div>
            {latestReport.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {latestReport.photos.map((photo, i) => (
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
            {latestReport.notes && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-sm text-foreground whitespace-pre-wrap">{latestReport.notes}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Saved: {formatDate(latestReport.createdAt)}
            </p>
          </div>
        )}

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
                onClick={() => void persistReport('delivery_update', 'Delivered')}
                disabled={submitting}
                className="flex-1 py-3 bg-farm-success text-white rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Verify Delivery'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AgentLayout>
  );
};

export default AgentInspectionDetail;
