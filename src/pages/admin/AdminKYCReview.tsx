import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, User, CreditCard, Camera, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatDate } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/Modal';
import { approveKycSubmission, getKycReviewByUserId, rejectKycSubmission } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import { KYCData } from '@/types';

const AdminKYCReview = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<Awaited<ReturnType<typeof getKycReviewByUserId>>['user'] | null>(null);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPdfDocument = (value?: string) =>
    Boolean(value && (value.toLowerCase().includes('.pdf') || value.startsWith('data:application/pdf')));

  const loadReview = async () => {
    if (!userId) {
      setErrorMessage('Missing user id.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const review = await getKycReviewByUserId(userId);

      if (!review) {
        setUser(null);
        setKycData(null);
        setErrorMessage('KYC record not found.');
        return;
      }

      console.log('[AdminKYCReview] Loaded review record', { userId, status: review.kyc?.status ?? review.user.kycStatus });
      setUser(review.user);
      setKycData(review.kyc);
    } catch (error) {
      console.error('[AdminKYCReview] Failed to load KYC review', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load KYC review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReview();
  }, [userId]);

  const handleApprove = async () => {
    if (!kycData?.recordId || !adminUser?.id || !user) {
      return;
    }

    try {
      setSubmitting(true);
      const updated = await approveKycSubmission(kycData.recordId, adminUser.id);
      setKycData(updated);
      toast({ title: 'KYC Approved', description: `${user.name}'s verification has been approved.` });
      setShowApproveModal(false);
      console.log('[AdminKYCReview] Approved KYC', { userId, recordId: kycData.recordId });
      void loadReview();
    } catch (error) {
      console.error('[AdminKYCReview] Failed to approve KYC', error);
      toast({
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'Could not approve this verification right now.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!kycData?.recordId || !adminUser?.id || !user) {
      return;
    }

    if (!rejectionReason.trim()) {
      toast({ title: 'Rejection reason required', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const updated = await rejectKycSubmission(kycData.recordId, adminUser.id, rejectionReason.trim());
      setKycData(updated);
      toast({ title: 'KYC Rejected', description: `${user.name}'s verification has been rejected.` });
      setShowRejectModal(false);
      setRejectionReason('');
      console.log('[AdminKYCReview] Rejected KYC', { userId, recordId: kycData.recordId });
      void loadReview();
    } catch (error) {
      console.error('[AdminKYCReview] Failed to reject KYC', error);
      toast({
        title: 'Rejection failed',
        description: error instanceof Error ? error.message : 'Could not reject this verification right now.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayStatus = kycData?.status || user?.kycStatus || 'NOT_STARTED';

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading KYC review from Supabase...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user || errorMessage) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-medium">{errorMessage || 'KYC data not found'}</p>
          <button onClick={() => navigate('/admin/users')} className="mt-4 text-primary">
            Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /> Back to Users
          </button>
          <button
            onClick={() => void loadReview()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">KYC Verification Review</h1>
          <p className="text-muted-foreground">Review and verify live Supabase identity records</p>
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">
                {user.phone} • {user.region}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{user.email || 'No email recorded'}</p>
              <p className="text-xs text-muted-foreground mt-1">Role: {user.role.toUpperCase()}</p>
            </div>
            <div className="ml-auto">
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  displayStatus === 'APPROVED'
                    ? 'bg-farm-success/10 text-farm-success'
                    : displayStatus === 'REJECTED'
                    ? 'bg-destructive/10 text-destructive'
                    : displayStatus === 'PENDING'
                    ? 'bg-farm-info/10 text-farm-info'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {displayStatus === 'PENDING' ? 'Pending Review' : displayStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{user.role === 'buyer' ? 'Business Information' : 'Personal Information'}</h3>
          </div>
          {user.role === 'buyer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                <p className="font-medium text-foreground">{kycData?.businessName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Type</p>
                <p className="font-medium text-foreground">{kycData?.businessType || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CAC Registration Number</p>
                <p className="font-medium text-foreground">{kycData?.businessRegistrationNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Address</p>
                <p className="font-medium text-foreground">{kycData?.businessAddress || kycData?.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Email</p>
                <p className="font-medium text-foreground">{kycData?.businessEmail || user.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Phone</p>
                <p className="font-medium text-foreground">{kycData?.businessPhone || kycData?.phoneNumber || user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Authorized Representative Name</p>
                <p className="font-medium text-foreground">{kycData?.authorizedRepresentativeName || user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role in Business</p>
                <p className="font-medium text-foreground">{kycData?.authorizedRepresentativeRole || 'Not provided'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium text-foreground">{kycData?.fullName || user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                <p className="font-medium text-foreground">{kycData?.phoneNumber || user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="font-medium text-foreground">{kycData?.address || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Type</p>
              <p className="font-medium text-foreground">{kycData?.idType || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Number</p>
              <p className="font-medium text-foreground">{kycData?.idNumber || 'Not provided'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {user.role === 'buyer' ? 'Authorized Representative ID' : 'ID Document'}
              </p>
              {(kycData?.authorizedRepresentativeIdFile || kycData?.idDocumentFile) ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  {isPdfDocument(kycData.authorizedRepresentativeIdFile || kycData.idDocumentFile) ? (
                    <div className="h-48 flex flex-col items-center justify-center gap-3 bg-muted p-4">
                      <FileText className="w-10 h-10 text-primary" />
                      <a
                        href={kycData.authorizedRepresentativeIdFile || kycData.idDocumentFile}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Open submitted document
                      </a>
                    </div>
                  ) : (
                    <img
                      src={kycData.authorizedRepresentativeIdFile || kycData.idDocumentFile}
                      alt={user.role === 'buyer' ? 'Authorized Representative ID' : 'ID Document'}
                      className="w-full h-48 object-contain bg-muted"
                    />
                  )}
                </div>
              ) : (
                <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                </div>
              )}
            </div>
            {user.role === 'farmer' && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Selfie Photo
                </p>
                {kycData?.selfieFile ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <img src={kycData.selfieFile} alt="Selfie" className="w-full h-48 object-contain bg-muted" />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No photo uploaded</p>
                  </div>
                )}
              </div>
            )}
            {user.role === 'buyer' && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> CAC Certificate
                </p>
                {kycData?.businessDocumentFile ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {isPdfDocument(kycData.businessDocumentFile) ? (
                      <div className="h-48 flex flex-col items-center justify-center gap-3 bg-muted p-4">
                        <FileText className="w-10 h-10 text-primary" />
                        <a
                          href={kycData.businessDocumentFile}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Open CAC certificate
                        </a>
                      </div>
                    ) : (
                      <img src={kycData.businessDocumentFile} alt="CAC Certificate" className="w-full h-48 object-contain bg-muted" />
                    )}
                  </div>
                ) : (
                  <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No document uploaded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {kycData?.submittedAt && <p className="text-xs text-muted-foreground mt-4">Submitted: {formatDate(kycData.submittedAt)}</p>}
          {kycData?.rejectionReason && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
              <p className="text-sm text-foreground">{kycData.rejectionReason}</p>
            </div>
          )}
        </div>

        {displayStatus === 'PENDING' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 px-6 py-3 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reject Verification
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex-1 px-6 py-3 bg-farm-success text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Verification
            </button>
          </div>
        )}

        <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to approve {user.name}&apos;s KYC verification? This update will persist to Supabase immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button onClick={() => void handleApprove()} className="flex-1 py-3 bg-farm-success text-white rounded-xl font-medium" disabled={submitting}>
                {submitting ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground mb-2">Please provide a reason for rejection. The user will be able to resubmit with updates.</p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Enter rejection reason"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[100px] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={!rejectionReason.trim() || submitting}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminKYCReview;
