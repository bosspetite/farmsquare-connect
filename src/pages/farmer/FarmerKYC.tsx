import { useState, useEffect } from 'react';
import { Camera, CreditCard, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { getKYCByUserId, updateKYCStatus } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const steps = [{ label: 'Selfie' }, { label: 'ID' }, { label: 'Review' }];

const FarmerKYC = () => {
  const { user } = useAuth();
  const [kycData, setKycData] = useState(user ? getKYCByUserId(user.id) : null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refresh KYC data when user or refreshKey changes
  useEffect(() => {
    if (user) {
      const data = getKYCByUserId(user.id);
      setKycData(data);
    }
  }, [user, refreshKey]);
  
  // Determine initial step based on KYC status
  const getInitialStep = (data: typeof kycData) => {
    if (!data) return 0; // No KYC data = start from beginning
    if (data.status === 'APPROVED') return 2; // Show approved message
    if (data.status === 'REJECTED') return 0; // Start over if rejected
    if (data.status === 'IN_REVIEW') return 2; // Show review status
    return 0; // NOT_STARTED = start from beginning
  };
  
  const [step, setStep] = useState(() => getInitialStep(kycData));
  const [selfie, setSelfie] = useState<string[]>(() => kycData?.selfiePhoto ? [kycData.selfiePhoto] : []);
  const [idPhoto, setIdPhoto] = useState<string[]>(() => kycData?.idPhoto ? [kycData.idPhoto] : []);

  // Update step when kycData changes
  useEffect(() => {
    if (kycData) {
      setStep(getInitialStep(kycData));
      setSelfie(kycData.selfiePhoto ? [kycData.selfiePhoto] : []);
      setIdPhoto(kycData.idPhoto ? [kycData.idPhoto] : []);
    }
  }, [kycData]);

  const handleSubmit = () => {
    if (!user) return;
    if (!selfie[0] || !idPhoto[0]) {
      toast({ 
        title: 'Missing documents', 
        description: 'Please upload both selfie and ID photo',
        variant: 'destructive' 
      });
      return;
    }
    
    // Update KYC status
    updateKYCStatus(user.id, 'IN_REVIEW', selfie[0], idPhoto[0]);
    
    // Refresh the data
    const updatedData = getKYCByUserId(user.id);
    setKycData(updatedData);
    setRefreshKey(prev => prev + 1);
    setStep(2);
    
    toast({ 
      title: 'KYC submitted for review', 
      description: 'Your documents are being verified. This usually takes 24-48 hours.' 
    });
  };

  // Only show approved if status is explicitly APPROVED
  const isApproved = kycData?.status === 'APPROVED';
  const isRejected = kycData?.status === 'REJECTED';
  const isInReview = kycData?.status === 'IN_REVIEW';
  const isNotStarted = !kycData || kycData.status === 'NOT_STARTED';

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
              onClick={() => { 
                setStep(0); 
                setSelfie([]); 
                setIdPhoto([]);
                // Clear KYC data to start fresh
                if (user) {
                  updateKYCStatus(user.id, 'NOT_STARTED');
                  const updatedData = getKYCByUserId(user.id);
                  setKycData(updatedData);
                  setRefreshKey(prev => prev + 1);
                }
              }}
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
                <div className="farm-card bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium mb-1">Why we need your verification</p>
                      <p className="text-muted-foreground">
                        KYC verification is required to enable withdrawals and ensure secure transactions on FarmSquare.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="farm-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Step 1: Take a Selfie</h3>
                      <p className="text-sm text-muted-foreground">Clear, front-facing photo of your face</p>
                    </div>
                  </div>
                  <div className="mb-4 p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs font-medium text-foreground mb-2">Requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Face should be clearly visible</li>
                      <li>Good lighting</li>
                      <li>No sunglasses or face coverings</li>
                      <li>Look directly at the camera</li>
                    </ul>
                  </div>
                  <FileUploader files={selfie} onFilesChange={setSelfie} maxFiles={1} />
                </div>
                <button
                  onClick={() => setStep(1)}
                  disabled={selfie.length === 0}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                >
                  Continue to ID Upload
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
                      <h3 className="font-semibold text-foreground">Step 2: Upload Government ID</h3>
                      <p className="text-sm text-muted-foreground">Upload a valid government-issued ID</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs font-medium text-foreground mb-3">Accepted ID Types:</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-farm-success flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">National Identification Number (NIN)</p>
                          <p className="text-xs text-muted-foreground">NIN slip or card</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-farm-success flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Voter's Card</p>
                          <p className="text-xs text-muted-foreground">Permanent Voter's Card (PVC)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-farm-success flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Driver's License</p>
                          <p className="text-xs text-muted-foreground">Valid Nigerian driver's license</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-farm-success flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">International Passport</p>
                          <p className="text-xs text-muted-foreground">Valid Nigerian passport</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-xl">
                    <p className="text-xs font-medium text-foreground mb-2">Photo Requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Photo should be clear and readable</li>
                      <li>All text and numbers must be visible</li>
                      <li>ID should not be expired</li>
                      <li>Take photo in good lighting</li>
                      <li>Ensure ID covers the entire frame</li>
                    </ul>
                  </div>

                  <FileUploader files={idPhoto} onFilesChange={setIdPhoto} maxFiles={1} />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 py-4 bg-card border border-border text-foreground rounded-xl font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={idPhoto.length === 0}
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                  >
                    Submit for Review
                  </button>
                </div>
              </div>
            )}

            {step === 2 && isInReview && (
              <div className="farm-card text-center py-8">
                <div className="w-16 h-16 rounded-full bg-farm-info/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CheckCircle className="w-8 h-8 text-farm-info" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Under Review</h2>
                <p className="text-muted-foreground mb-4">We're verifying your documents. This usually takes 24-48 hours.</p>
                <div className="mt-6 p-4 bg-muted/50 rounded-xl text-left">
                  <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Our team will review your selfie and ID document</li>
                    <li>You'll receive a notification when verification is complete</li>
                    <li>Once approved, you can withdraw funds from your wallet</li>
                  </ul>
                </div>
              </div>
            )}
            
            {step === 2 && isNotStarted && !isInReview && !isApproved && !isRejected && (
              <div className="farm-card text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Get Started</h2>
                <p className="text-muted-foreground mb-4">Complete KYC verification to enable withdrawals and access all features.</p>
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                >
                  Start Verification
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerKYC;
