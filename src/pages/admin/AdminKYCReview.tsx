import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, User, CreditCard, Camera, FileText, Shield, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getProfile, getKycDocuments, getBuyerBusiness, getKybDocuments, updateKycStatus } from '@/services/databaseService';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';

const AdminKYCReview = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [kybDocs, setKybDocs] = useState<any[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const prof = await getProfile(userId);
        if (!prof) {
          toast({ title: 'User not found', variant: 'destructive' });
          navigate('/admin/users');
          return;
        }
        setProfile(prof);

        // Fetch KYC documents
        const docs = await getKycDocuments(userId);
        setKycDocs(docs);

        // If buyer, fetch business info
        if (prof.role === 'buyer') {
          const bus = await getBuyerBusiness(userId);
          setBusiness(bus);
          if (bus) {
            const kyb = await getKybDocuments(bus.id);
            setKybDocs(kyb);
          }
        }
      } catch (err: any) {
        console.error('Error loading KYC data:', err);
        toast({ title: 'Failed to load KYC data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, navigate]);

  const handleApprove = async () => {
    if (!userId) return;
    setProcessing(true);
    try {
      const success = await updateKycStatus(userId, 'APPROVED');
      if (success) {
        toast({ title: 'KYC Approved', description: `${profile?.full_name}'s verification has been approved.` });
        setShowApproveModal(false);
        setTimeout(() => navigate('/admin/users'), 500);
      } else {
        toast({ title: 'Failed to approve', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error approving KYC', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!userId || !rejectionReason.trim()) {
      toast({ title: 'Rejection reason required', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      const success = await updateKycStatus(userId, 'REJECTED', rejectionReason.trim());
      if (success) {
        toast({ title: 'KYC Rejected', description: `${profile?.full_name}'s verification has been rejected.` });
        setShowRejectModal(false);
        setRejectionReason('');
        setTimeout(() => navigate('/admin/users'), 500);
      } else {
        toast({ title: 'Failed to reject', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error rejecting KYC', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
          <button onClick={() => navigate('/admin/users')} className="mt-4 text-primary">
            Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const kycStatus = profile.role === 'buyer' ? (profile.kyb_status || profile.kyc_status) : profile.kyc_status;
  const idDoc = kycDocs.find(d => d.document_type !== 'SELFIE');
  const selfieDoc = kycDocs.find(d => d.document_type === 'SELFIE');
  const cacDoc = kybDocs.find(d => d.document_type === 'CAC_CERT');
  const repIdDoc = kybDocs.find(d => d.document_type === 'REP_ID_DOC');

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Users
        </button>

        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">KYC Verification Review</h1>
          <p className="text-muted-foreground">Review and verify user identity documents</p>
        </div>

        {/* User Info Card */}
        <div className="farm-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.phone} • {profile.state || profile.address || 'N/A'}</p>
              <p className="text-xs text-muted-foreground mt-1">Role: {profile.role.toUpperCase()}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                kycStatus === 'APPROVED' ? 'bg-farm-success/10 text-farm-success' :
                kycStatus === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                kycStatus === 'IN_REVIEW' ? 'bg-farm-info/10 text-farm-info' :
                'bg-muted text-muted-foreground'
              }`}>
                {kycStatus === 'IN_REVIEW' ? 'Under Review' : kycStatus || 'NOT_STARTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information / Business Information */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {profile.role === 'buyer' ? 'Business Information' : 'Personal Information'}
            </h3>
          </div>
          {profile.role === 'buyer' && business ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                <p className="font-medium text-foreground">{business.business_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Type</p>
                <p className="font-medium text-foreground">
                  {business.business_type === 'INDIVIDUAL' ? 'Individual Trader' :
                   business.business_type === 'COMPANY' ? 'Registered Company' :
                   business.business_type === 'PARTNERSHIP' ? 'Partnership' : business.business_type || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CAC Registration Number</p>
                <p className="font-medium text-foreground">{business.cac_number || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Business Address</p>
                <p className="font-medium text-foreground">{business.address || 'Not provided'}</p>
              </div>
              {business.buyer_business_reps && business.buyer_business_reps.length > 0 && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Authorized Representative Name</p>
                    <p className="font-medium text-foreground">{business.buyer_business_reps[0].full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Role in Business</p>
                    <p className="font-medium text-foreground">{business.buyer_business_reps[0].role_title || 'Not provided'}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium text-foreground">{profile.full_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                <p className="font-medium text-foreground">{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="font-medium text-foreground">{profile.address || profile.state || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Identity Verification */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Document */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {profile.role === 'buyer' ? 'Authorized Representative ID' : 'ID Document'}
              </p>
              {(repIdDoc?.document_url || idDoc?.document_url) ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <img 
                    src={repIdDoc?.document_url || idDoc?.document_url} 
                    alt={profile.role === 'buyer' ? 'Authorized Representative ID' : 'ID Document'} 
                    className="w-full h-48 object-contain bg-muted"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback w-full h-48 flex items-center justify-center bg-muted';
                        fallback.innerHTML = '<p class="text-sm text-muted-foreground">Document not available</p>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                </div>
              )}
            </div>

            {/* Selfie (Farmers only) */}
            {profile.role === 'farmer' && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Selfie Photo
                </p>
                {selfieDoc?.document_url ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <img 
                      src={selfieDoc.document_url} 
                      alt="Selfie" 
                      className="w-full h-48 object-contain bg-muted"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback w-full h-48 flex items-center justify-center bg-muted';
                          fallback.innerHTML = '<p class="text-sm text-muted-foreground">Photo not available</p>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No photo uploaded</p>
                  </div>
                )}
              </div>
            )}

            {/* CAC Certificate (Buyers only) */}
            {profile.role === 'buyer' && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> CAC Certificate
                </p>
                {cacDoc?.document_url ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <img 
                      src={cacDoc.document_url} 
                      alt="CAC Certificate" 
                      className="w-full h-48 object-contain bg-muted"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback w-full h-48 flex items-center justify-center bg-muted';
                          fallback.innerHTML = '<p class="text-sm text-muted-foreground">Document not available</p>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg h-48 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No document uploaded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {kycStatus === 'IN_REVIEW' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Reject Verification
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-farm-success text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Verification
            </button>
          </div>
        )}

        {/* Approve Modal */}
        <Modal isOpen={showApproveModal} onClose={() => !processing && setShowApproveModal(false)} title="Approve KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to approve {profile?.full_name}'s KYC verification? This will enable all features including withdrawals.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={processing}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 py-3 bg-farm-success text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Approve
              </button>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={showRejectModal} onClose={() => !processing && setShowRejectModal(false)} title="Reject KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground mb-2">
              Please provide a reason for rejection. The user will be notified and can resubmit.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (e.g., Document unclear, Information mismatch, etc.)"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[100px] resize-none"
              disabled={processing}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processing}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reject
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminKYCReview;
