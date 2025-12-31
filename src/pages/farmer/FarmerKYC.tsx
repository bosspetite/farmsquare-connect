import { useState } from 'react';
import { Camera, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { getKYCByUserId, updateKYCStatus } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const steps = [{ label: 'Selfie' }, { label: 'ID' }, { label: 'Review' }];

const FarmerKYC = () => {
  const { user } = useAuth();
  const kycData = user ? getKYCByUserId(user.id) : null;
  const [step, setStep] = useState(kycData?.status === 'IN_REVIEW' || kycData?.status === 'APPROVED' ? 2 : 0);
  const [selfie, setSelfie] = useState<string[]>(kycData?.selfiePhoto ? [kycData.selfiePhoto] : []);
  const [idPhoto, setIdPhoto] = useState<string[]>(kycData?.idPhoto ? [kycData.idPhoto] : []);

  const handleSubmit = () => {
    if (!user) return;
    updateKYCStatus(user.id, 'IN_REVIEW', selfie[0], idPhoto[0]);
    setStep(2);
    toast({ title: 'KYC submitted for review' });
  };

  const isApproved = kycData?.status === 'APPROVED';
  const isRejected = kycData?.status === 'REJECTED';
  const isInReview = kycData?.status === 'IN_REVIEW';

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up max-w-md mx-auto">
        <h1 className="text-xl font-display font-bold text-foreground">KYC Verification</h1>

        {isApproved ? (
          <div className="farm-card text-center py-8">
            <div className="w-16 h-16 rounded-full bg-farm-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-farm-success" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Verified!</h2>
            <p className="text-muted-foreground">Your account has been verified successfully.</p>
          </div>
        ) : isRejected ? (
          <div className="farm-card text-center py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">Please resubmit your documents.</p>
            <button
              onClick={() => { setStep(0); setSelfie([]); setIdPhoto([]); }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Resubmit
            </button>
          </div>
        ) : (
          <>
            <Stepper steps={steps} currentStep={step} />

            {step === 0 && (
              <div className="space-y-4">
                <div className="farm-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Take a Selfie</h3>
                      <p className="text-sm text-muted-foreground">Clear photo of your face</p>
                    </div>
                  </div>
                  <FileUploader files={selfie} onFilesChange={setSelfie} maxFiles={1} />
                </div>
                <button
                  onClick={() => setStep(1)}
                  disabled={selfie.length === 0}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="farm-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Upload ID</h3>
                      <p className="text-sm text-muted-foreground">NIN, Voter's Card, or Driver's License</p>
                    </div>
                  </div>
                  <FileUploader files={idPhoto} onFilesChange={setIdPhoto} maxFiles={1} />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={idPhoto.length === 0}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  Submit for Review
                </button>
              </div>
            )}

            {step === 2 && isInReview && (
              <div className="farm-card text-center py-8">
                <div className="w-16 h-16 rounded-full bg-farm-info/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CheckCircle className="w-8 h-8 text-farm-info" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Under Review</h2>
                <p className="text-muted-foreground">We're verifying your documents. This usually takes 24-48 hours.</p>
              </div>
            )}
          </>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerKYC;
