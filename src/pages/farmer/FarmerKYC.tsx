import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CreditCard, CheckCircle, AlertCircle, Info, User, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { KYCData } from '@/types';
import { getMyKyc, resetKycRecord, saveKycRecord, submitKyc } from '@/services/kycService';

const steps = [
  { label: 'Personal Info', description: 'Basic information' },
  { label: 'Identity', description: 'ID verification' },
  { label: 'Review', description: 'Submit for review' }
];

const getKycSubmissionMessage = (error: unknown) => {
  const messageText =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : null;

  if (!messageText) {
    return 'Your KYC could not be submitted. Please check all required fields and try again.';
  }

  const message = messageText.toLowerCase();
  if (message.includes('profile not found')) {
    return 'We could not find your account profile. Please sign out and sign in again, then retry.';
  }

  if (message.includes('auth') || message.includes('session')) {
    return 'Your session has expired. Please sign in again and retry your verification.';
  }

  if (message.includes('upload') || message.includes('document')) {
    return 'Your KYC could not be submitted because one or more documents could not be processed. Please try again.';
  }

  if (message.includes('permission') || message.includes('row-level security')) {
    return 'Your KYC could not be submitted right now. Please try again in a moment.';
  }

  return messageText || 'Your KYC could not be submitted. Please check all required fields and try again.';
};

const FarmerKYC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [step, setStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    idType: '' as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | '',
    idNumber: '',
  });
  
  const [selfieFile, setSelfieFile] = useState<string[]>([]);
  const [idDocumentFile, setIdDocumentFile] = useState<string[]>([]);
  const [selfieFileObjects, setSelfieFileObjects] = useState<File[]>([]);
  const [idDocumentFileObjects, setIdDocumentFileObjects] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load KYC data when component mounts
  useEffect(() => {
    if (user) {
      void (async () => {
        try {
          const data = await getMyKyc(user.id);
          setKycData(data);

          if (data) {
            setFormData({
              fullName: data.fullName || user.name || '',
              phoneNumber: data.phoneNumber || user.phone || '',
              dateOfBirth: data.dateOfBirth || '',
              address: data.address || '',
              idType: data.idType || '',
              idNumber: data.idNumber || '',
            });

            if (data.selfieFile) setSelfieFile([data.selfieFile]);
            if (data.idDocumentFile) setIdDocumentFile([data.idDocumentFile]);

            if (data.status === 'APPROVED' || data.status === 'PENDING') {
              setStep(2);
            } else if (data.status === 'REJECTED') {
              setStep(0);
            }
          } else {
            setFormData((prev) => ({
              ...prev,
              fullName: user.name || '',
              phoneNumber: user.phone || '',
            }));
          }
        } catch (error) {
          console.error('Error loading KYC data:', error);
          setFormData((prev) => ({
            ...prev,
            fullName: user.name || prev.fullName,
            phoneNumber: user.phone || prev.phoneNumber,
          }));
          toast({
            title: 'Could not load saved verification details',
            description: 'You can still continue and submit your verification.',
            variant: 'destructive',
          });
        }
      })();
    }
  }, [user, toast]);

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.fullName.trim()) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast({ title: 'Phone number is required', variant: 'destructive' });
      return false;
    }
    if (!formData.address.trim()) {
      toast({ title: 'Address is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.idType) {
      toast({ title: 'Please select an ID type', variant: 'destructive' });
      return false;
    }
    if (!formData.idNumber.trim()) {
      toast({ title: 'ID number is required', variant: 'destructive' });
      return false;
    }
    if (idDocumentFile.length === 0) {
      toast({ title: 'Please upload your ID document', variant: 'destructive' });
      return false;
    }
    if (selfieFile.length === 0) {
      toast({ title: 'Please upload a selfie', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      if (validateStep1()) {
        if (user) {
          void (async () => {
            try {
              setIsSubmitting(true);
              const saved = await saveKycRecord({
                userId: user.id,
                role: 'farmer',
                data: {
                  ...formData,
                  status: 'NOT_STARTED',
                },
              });
              setKycData(saved);
              setStep(1);
            } catch (error) {
              console.error('Error saving KYC draft:', error);
              setKycData((prev) => prev ?? {
                userId: user.id,
                userRole: 'farmer',
                status: 'NOT_STARTED',
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                idType: formData.idType || undefined,
                idNumber: formData.idNumber,
              });
              setStep(1);
              toast({
                title: 'Draft sync delayed',
                description: 'You can keep going. Your verification will still be saved when you submit it.',
              });
            } finally {
              setIsSubmitting(false);
            }
          })();
          return;
        }
        setStep(1);
      }
    } else if (step === 1) {
      if (validateStep2()) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in again before submitting your verification.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateStep1()) {
      console.warn('[FarmerKYC] Step 1 validation failed', {
        fullNamePresent: Boolean(formData.fullName.trim()),
        phoneNumberPresent: Boolean(formData.phoneNumber.trim()),
        addressPresent: Boolean(formData.address.trim()),
      });
      setStep(0);
      return;
    }

    if (!validateStep2()) {
      console.warn('[FarmerKYC] Step 2 validation failed', {
        idTypePresent: Boolean(formData.idType),
        idNumberPresent: Boolean(formData.idNumber.trim()),
        idDocumentPresent: idDocumentFile.length > 0,
        selfiePresent: selfieFile.length > 0,
      });
      setStep(1);
      return;
    }
    
    void (async () => {
      try {
        setIsSubmitting(true);
        console.log('[FarmerKYC] Submitting verification', {
          userId: user.id,
          role: user.role,
          sessionEmail: user.email,
          validation: {
            fullNamePresent: Boolean(formData.fullName.trim()),
            phoneNumberPresent: Boolean(formData.phoneNumber.trim()),
            addressPresent: Boolean(formData.address.trim()),
            idTypePresent: Boolean(formData.idType),
            idNumberPresent: Boolean(formData.idNumber.trim()),
            idDocumentPathPresent: Boolean(idDocumentFile[0]),
            selfiePathPresent: Boolean(selfieFile[0]),
            idDocumentObjectPresent: Boolean(idDocumentFileObjects[0]),
            selfieObjectPresent: Boolean(selfieFileObjects[0]),
          },
        });
        const updatedData = await submitKyc(user.id, {
          ...formData,
          idType: formData.idType as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD',
          selfieFile: selfieFile[0],
          idDocumentFile: idDocumentFile[0],
          submittedAt: new Date().toISOString(),
        }, {
          selfieFile: selfieFileObjects[0],
          idDocumentFile: idDocumentFileObjects[0],
        });

        console.log('[FarmerKYC] Verification submitted successfully', {
          userId: user.id,
          status: updatedData.status,
          recordId: updatedData.recordId,
        });
        setKycData(updatedData);
        toast({
          title: 'KYC submitted for review',
          description: 'Your documents are being verified. This usually takes 24-48 hours.',
        });

        setTimeout(() => {
          navigate('/farmer/dashboard');
        }, 1500);
      } catch (error) {
        console.error('Error submitting KYC:', error);
        toast({
          title: 'Submission failed',
          description: getKycSubmissionMessage(error),
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const handleResubmit = () => {
    if (!user) return;
    
    void (async () => {
      try {
        setIsSubmitting(true);
        const updatedData = await resetKycRecord(user.id, 'farmer');
        setSelfieFile([]);
        setIdDocumentFile([]);
        setSelfieFileObjects([]);
        setIdDocumentFileObjects([]);
        setStep(0);
        setKycData(updatedData);
      } catch (error) {
        console.error('Error resetting KYC:', error);
        toast({ title: 'Could not reset KYC', variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const isApproved = kycData?.status === 'APPROVED';
  const isRejected = kycData?.status === 'REJECTED';
  const isInReview = kycData?.status === 'PENDING' || kycData?.status === 'IN_REVIEW';
  const isNotStarted = !kycData || kycData.status === 'NOT_STARTED';

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Farmer Verification (KYC)</h1>
          <p className="text-muted-foreground">Complete verification to enable withdrawals and access all features</p>
        </div>

        {isApproved ? (
          <div className="farm-card text-center py-12">
            <div className="w-20 h-20 rounded-full bg-farm-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-farm-success" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Verified!</h2>
            <p className="text-muted-foreground">Your account has been verified successfully. You can now withdraw funds and access all features.</p>
          </div>
        ) : isRejected ? (
          <div className="farm-card text-center py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Verification Failed</h2>
            {kycData.rejectionReason && (
              <p className="text-muted-foreground mb-3">
                <strong>Reason:</strong> {kycData.rejectionReason}
              </p>
            )}
            <p className="text-muted-foreground mb-6">Your documents were not approved. Please review the requirements and resubmit.</p>
            <button
              onClick={handleResubmit}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Resubmit Documents
            </button>
          </div>
        ) : isInReview ? (
          <div className="farm-card text-center py-12">
                <div className="w-20 h-20 rounded-full bg-farm-info/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-farm-info" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Under Review</h2>
            <p className="text-muted-foreground mb-6">We're verifying your documents. This usually takes 24-48 hours.</p>
            <div className="mt-6 p-4 bg-muted/50 rounded-xl text-left">
              <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Our team will review your personal information and documents</li>
                <li>You'll receive a notification when verification is complete</li>
                <li>Once approved, you can withdraw funds from your wallet</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <Stepper steps={steps} currentStep={step} />

            {/* Step 1: Personal Information */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="farm-card bg-muted/50 border-border">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium mb-1">Why we need your information</p>
                      <p className="text-muted-foreground">
                        Identity verification is required to enable withdrawals and ensure secure transactions on FarmSquare. Your information is kept confidential and secure.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="farm-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">Enter your details as they appear on your ID</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateFormField('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormField('phoneNumber', e.target.value)}
                        placeholder="+234 801 234 5678"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => updateFormField('address', e.target.value)}
                        placeholder="Enter your full address"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue to Identity Verification'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Identity Verification */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="farm-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Identity Verification</h3>
                      <p className="text-sm text-muted-foreground">Upload your government-issued ID and a selfie</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="idType">ID Type *</Label>
                      <Select
                        value={formData.idType}
                        onValueChange={(value) => updateFormField('idType', value)}
                      >
                        <SelectTrigger id="idType" className="mt-1">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NIN">National Identification Number (NIN)</SelectItem>
                          <SelectItem value="PASSPORT">International Passport</SelectItem>
                          <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                          <SelectItem value="VOTERS_CARD">Voter's Card (PVC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="idNumber">ID Number *</Label>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => updateFormField('idNumber', e.target.value)}
                        placeholder="Enter your ID number"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>ID Document *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Upload a clear photo or scan of your ID (PDF or image, max 5MB)</p>
                      <FileUploader
                        files={idDocumentFile}
                        onFilesChange={setIdDocumentFile}
                        fileObjects={idDocumentFileObjects}
                        onFileObjectsChange={setIdDocumentFileObjects}
                        maxFiles={1}
                        accept="image/*,.pdf"
                        maxSizeMB={5}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Selfie Photo *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Take a clear front-facing photo of yourself (Image only, max 5MB)</p>
                      <FileUploader
                        files={selfieFile}
                        onFilesChange={setSelfieFile}
                        fileObjects={selfieFileObjects}
                        onFileObjectsChange={setSelfieFileObjects}
                        maxFiles={1}
                        accept="image/*"
                        maxSizeMB={5}
                        className="mt-1"
                      />
                      <div className="mt-2 p-3 bg-muted/50 rounded-xl">
                        <p className="text-xs font-medium text-foreground mb-1">Selfie Requirements:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Face should be clearly visible</li>
                          <li>Good lighting, no sunglasses or face coverings</li>
                          <li>Look directly at the camera</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-4 bg-card border border-border text-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                  >
                    Review & Submit
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="farm-card space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Review Your Information</h3>
                      <p className="text-sm text-muted-foreground">Please verify all information is correct before submitting</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Personal Information</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{formData.fullName}</span></p>
                        <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{formData.phoneNumber}</span></p>
                        <p><span className="text-muted-foreground">Address:</span> <span className="font-medium text-foreground">{formData.address}</span></p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Identity Verification</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">ID Type:</span> <span className="font-medium text-foreground">{formData.idType}</span></p>
                        <p><span className="text-muted-foreground">ID Number:</span> <span className="font-medium text-foreground">{formData.idNumber}</span></p>
                        <p><span className="text-muted-foreground">ID Document:</span> <span className="font-medium text-foreground">{idDocumentFile.length > 0 ? 'Uploaded ✓' : 'Not uploaded'}</span></p>
                        <p><span className="text-muted-foreground">Selfie:</span> <span className="font-medium text-foreground">{selfieFile.length > 0 ? 'Uploaded ✓' : 'Not uploaded'}</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-foreground">
                    By submitting, you confirm that all information provided is accurate and belongs to you. 
                    False information may result in account suspension.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-4 bg-card border border-border text-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FarmerLayout>
  );
};

export default FarmerKYC;
