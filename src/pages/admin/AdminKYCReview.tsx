import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, User, CreditCard, Camera, FileText, Shield } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getKYCByUserId, updateKYCStatus, getAppState, formatDate } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/Modal';

const AdminKYCReview = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const state = getAppState();
  const kycData = userId ? getKYCByUserId(userId) : null;
  const user = [...state.farmers, ...state.buyers, ...state.agents].find(u => u.id === userId);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!user || !kycData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">KYC data not found</p>
          <button onClick={() => navigate('/admin/users')} className="mt-4 text-primary">
            Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const handleApprove = () => {
    if (!userId) return;
    updateKYCStatus(userId, 'APPROVED');
    toast({ title: 'KYC Approved', description: `${user.name}'s verification has been approved.` });
    setShowApproveModal(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleReject = () => {
    if (!userId || !rejectionReason.trim()) {
      toast({ title: 'Rejection reason required', variant: 'destructive' });
      return;
    }
    updateKYCStatus(userId, 'REJECTED');
    toast({ title: 'KYC Rejected', description: `${user.name}'s verification has been rejected.` });
    setShowRejectModal(false);
    setRejectionReason('');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

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
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.phone} • {user.region}</p>
              <p className="text-xs text-muted-foreground mt-1">Role: {user.role.toUpperCase()}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                kycData.status === 'APPROVED' ? 'bg-farm-success/10 text-farm-success' :
                kycData.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                kycData.status === 'IN_REVIEW' ? 'bg-farm-info/10 text-farm-info' :
                'bg-muted text-muted-foreground'
              }`}>
                {kycData.status === 'IN_REVIEW' ? 'Under Review' : kycData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Full Name</p>
              <p className="font-medium text-foreground">{kycData.fullName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
              <p className="font-medium text-foreground">{kycData.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
              <p className="font-medium text-foreground">{kycData.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="font-medium text-foreground">{kycData.address || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Identity Verification */}
        <div className="farm-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Type</p>
              <p className="font-medium text-foreground">{kycData.idType || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Number</p>
              <p className="font-medium text-foreground">{kycData.idNumber || 'Not provided'}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> ID Document
              </p>
              {kycData.idDocumentFile ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <img 
                    src={kycData.idDocumentFile} 
                    alt="ID Document" 
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
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Selfie Photo
              </p>
              {kycData.selfieFile ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <img 
                    src={kycData.selfieFile} 
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
          </div>

          {kycData.submittedAt && (
            <p className="text-xs text-muted-foreground mt-4">
              Submitted: {formatDate(kycData.submittedAt)}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {kycData.status === 'IN_REVIEW' && (
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

        {/* Approve Modal */}
        <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to approve {user.name}'s KYC verification? This will enable all features including withdrawals.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-3 bg-farm-success text-white rounded-xl font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject KYC Verification?">
          <div className="space-y-4">
            <p className="text-muted-foreground mb-2">
              Please provide a reason for rejection. The user will be notified and can resubmit.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (e.g., Document unclear, Information mismatch, etc.)"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground min-h-[100px] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50"
              >
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

