import { useState, useEffect } from 'react';
import { User, Lock, Phone, MapPin, Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getKYCByUserId } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const FarmerProfile = () => {
  const { user } = useAuth();
  const [kycData, setKycData] = useState(user ? getKYCByUserId(user.id) : null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [phoneForReset, setPhoneForReset] = useState('');

  // Refresh KYC data periodically
  useEffect(() => {
    if (user) {
      const data = getKYCByUserId(user.id);
      setKycData(data);
    }
  }, [user]);

  const handlePasswordChange = () => {
    if (!newPassword || !confirmPassword) {
      toast({ 
        title: 'All fields required', 
        variant: 'destructive' 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: 'Password too short', 
        description: 'Password must be at least 6 characters',
        variant: 'destructive' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ 
        title: 'Passwords do not match', 
        variant: 'destructive' 
      });
      return;
    }

    // Mock password change (in real app, this would call an API)
    toast({ 
      title: 'Password changed successfully',
      description: 'Your password has been updated.'
    });
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleForgotPassword = () => {
    if (!phoneForReset) {
      toast({ 
        title: 'Phone number required', 
        variant: 'destructive' 
      });
      return;
    }

    // Mock password reset (in real app, this would send OTP to phone)
    toast({ 
      title: 'Reset link sent',
      description: `We've sent a password reset code to ${phoneForReset}. Check your messages.`
    });
    setShowForgotPassword(false);
    setPhoneForReset('');
  };

  const kycStatus = kycData?.status || 'NOT_STARTED';
  const kycStatusLabels = {
    NOT_STARTED: 'Not Started',
    IN_REVIEW: 'In Review',
    APPROVED: 'Verified',
    REJECTED: 'Rejected'
  };

  const kycStatusColors = {
    NOT_STARTED: 'bg-muted text-muted-foreground',
    IN_REVIEW: 'bg-farm-info/10 text-farm-info',
    APPROVED: 'bg-farm-success/10 text-farm-success',
    REJECTED: 'bg-destructive/10 text-destructive'
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <h1 className="text-xl font-display font-bold text-foreground">Profile & Settings</h1>

        {/* Profile Information */}
        <div className="farm-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">Farmer Account</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium text-foreground">{user?.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium text-foreground">{user?.region || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">KYC Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${kycStatusColors[kycStatus]}`}>
                      {kycStatusLabels[kycStatus]}
                    </span>
                    {kycStatus === 'NOT_STARTED' && (
                      <button
                        onClick={() => window.location.href = '/farmer/kyc'}
                        className="text-xs text-primary hover:underline"
                      >
                        Complete KYC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="farm-card">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Security</h3>
          
          <div className="space-y-4">
            {/* Change Password */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Change
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Forgot Password?</p>
                  <p className="text-sm text-muted-foreground">Reset your password via SMS</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-xl text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="farm-card">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium text-foreground">Farmer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium text-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-medium text-foreground font-mono text-xs">{user?.id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        <Modal 
          isOpen={showPasswordModal} 
          onClose={() => {
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }} 
          title="Change Password"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Update Password
            </button>
          </div>
        </Modal>

        {/* Forgot Password Modal */}
        <Modal 
          isOpen={showForgotPassword} 
          onClose={() => {
            setShowForgotPassword(false);
            setPhoneForReset('');
          }} 
          title="Reset Password"
        >
          <div className="space-y-4">
            <div className="p-4 bg-farm-info/10 border border-farm-info/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-farm-info flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Password Reset via SMS</p>
                  <p className="text-muted-foreground">
                    Enter your phone number and we'll send you a verification code to reset your password.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneForReset}
                onChange={(e) => setPhoneForReset(e.target.value)}
                placeholder="+2348012345678"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send a 6-digit code to this number
              </p>
            </div>
            <button
              onClick={handleForgotPassword}
              disabled={!phoneForReset}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Send Reset Code
            </button>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerProfile;

