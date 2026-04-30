import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Info, User, FileText, Building2, Shield } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { KYCData } from '@/types';
import { getMyKyc, resetKycRecord, submitKyc } from '@/services/kycService';

const steps = [
  { label: 'Business Info', description: 'Company details' },
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
    return 'Your verification could not be submitted. Please check all required fields and try again.';
  }

  const message = messageText.toLowerCase();
  if (message.includes('profile not found')) {
    return 'We could not find your account profile. Please sign out and sign in again, then retry.';
  }

  if (message.includes('auth') || message.includes('session')) {
    return 'Your session has expired. Please sign in again and retry your verification.';
  }

  if (message.includes('upload') || message.includes('document')) {
    return 'Your verification could not be submitted because one or more documents could not be processed. Please try again.';
  }

  if (message.includes('permission') || message.includes('row-level security')) {
    return 'Your verification could not be submitted right now. Please try again in a moment.';
  }

  return messageText || 'Your verification could not be submitted. Please check all required fields and try again.';
};

const BuyerKYC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [step, setStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '' as 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP' | '',
    businessRegistrationNumber: '', // CAC Registration Number
    businessAddress: '',
    businessEmail: '',
    businessPhone: '',
    // Authorized Representative
    authorizedRepresentativeName: '',
    authorizedRepresentativeRole: '',
    idType: '' as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | '',
    idNumber: '',
  });
  
  const [businessDocumentFile, setBusinessDocumentFile] = useState<string[]>([]);
  const [authorizedRepresentativeIdFile, setAuthorizedRepresentativeIdFile] = useState<string[]>([]);
  const [businessDocumentFileObjects, setBusinessDocumentFileObjects] = useState<File[]>([]);
  const [authorizedRepresentativeIdFileObjects, setAuthorizedRepresentativeIdFileObjects] = useState<File[]>([]);
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
              businessName: data.businessName || '',
              businessType: data.businessType || '',
              businessRegistrationNumber: data.businessRegistrationNumber || '',
              businessAddress: data.businessAddress || data.address || '',
              businessEmail: data.businessEmail || user.email || '',
              businessPhone: data.businessPhone || data.phoneNumber || user.phone || '',
              authorizedRepresentativeName: data.authorizedRepresentativeName || data.fullName || user.name || '',
              authorizedRepresentativeRole: data.authorizedRepresentativeRole || '',
              idType: data.idType || '',
              idNumber: data.idNumber || '',
            });

            if (data.businessDocumentFile) setBusinessDocumentFile([data.businessDocumentFile]);
            if (data.authorizedRepresentativeIdFile) setAuthorizedRepresentativeIdFile([data.authorizedRepresentativeIdFile]);

            if (data.status === 'APPROVED' || data.status === 'PENDING') {
              setStep(2);
            } else if (data.status === 'REJECTED') {
              setStep(0);
            }
          } else {
            setFormData((prev) => ({
              ...prev,
              businessPhone: user.phone || '',
              authorizedRepresentativeName: user.name || '',
            }));
          }
        } catch (error) {
          console.error('Error loading KYC data:', error);
          setFormData((prev) => ({
            ...prev,
            businessPhone: user.phone || prev.businessPhone,
            authorizedRepresentativeName: user.name || prev.authorizedRepresentativeName,
            businessEmail: user.email || prev.businessEmail,
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
    if (!formData.businessName.trim()) {
      toast({ title: 'Business name is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessType) {
      toast({ title: 'Business type is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessRegistrationNumber.trim()) {
      toast({ title: 'CAC Registration Number is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessAddress.trim()) {
      toast({ title: 'Business address is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessEmail.trim()) {
      toast({ title: 'Business email is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessPhone.trim()) {
      toast({ title: 'Business phone is required', variant: 'destructive' });
      return false;
    }
    if (!formData.authorizedRepresentativeName.trim()) {
      toast({ title: 'Authorized representative name is required', variant: 'destructive' });
      return false;
    }
    if (!formData.authorizedRepresentativeRole.trim()) {
      toast({ title: 'Role in business is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.idType) {
      toast({ title: 'ID type is required', variant: 'destructive' });
      return false;
    }
    if (!formData.idNumber.trim()) {
      toast({ title: 'ID number is required', variant: 'destructive' });
      return false;
    }
    if (authorizedRepresentativeIdFile.length === 0) {
      toast({ title: 'Authorized representative government ID is required', variant: 'destructive' });
      return false;
    }
    if (businessDocumentFile.length === 0) {
      toast({ title: 'CAC Certificate is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
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
      console.warn('[BuyerKYC] Step 1 validation failed', {
        businessNamePresent: Boolean(formData.businessName.trim()),
        businessTypePresent: Boolean(formData.businessType),
        businessRegistrationNumberPresent: Boolean(formData.businessRegistrationNumber.trim()),
        businessAddressPresent: Boolean(formData.businessAddress.trim()),
        businessEmailPresent: Boolean(formData.businessEmail.trim()),
        businessPhonePresent: Boolean(formData.businessPhone.trim()),
        representativeNamePresent: Boolean(formData.authorizedRepresentativeName.trim()),
        representativeRolePresent: Boolean(formData.authorizedRepresentativeRole.trim()),
      });
      setStep(0);
      return;
    }

    if (!validateStep2()) {
      console.warn('[BuyerKYC] Step 2 validation failed', {
        idTypePresent: Boolean(formData.idType),
        idNumberPresent: Boolean(formData.idNumber.trim()),
        representativeDocumentPresent: authorizedRepresentativeIdFile.length > 0,
        businessDocumentPresent: businessDocumentFile.length > 0,
      });
      setStep(1);
      return;
    }
    
    void (async () => {
      try {
        setIsSubmitting(true);
        console.log('[BuyerKYC] Submitting verification', {
          userId: user.id,
          role: user.role,
          sessionEmail: user.email,
          validation: {
            businessNamePresent: Boolean(formData.businessName.trim()),
            businessTypePresent: Boolean(formData.businessType),
            businessRegistrationNumberPresent: Boolean(formData.businessRegistrationNumber.trim()),
            businessAddressPresent: Boolean(formData.businessAddress.trim()),
            businessEmailPresent: Boolean(formData.businessEmail.trim()),
            businessPhonePresent: Boolean(formData.businessPhone.trim()),
            representativeNamePresent: Boolean(formData.authorizedRepresentativeName.trim()),
            representativeRolePresent: Boolean(formData.authorizedRepresentativeRole.trim()),
            idTypePresent: Boolean(formData.idType),
            idNumberPresent: Boolean(formData.idNumber.trim()),
            representativeDocumentPathPresent: Boolean(authorizedRepresentativeIdFile[0]),
            businessDocumentPathPresent: Boolean(businessDocumentFile[0]),
            representativeDocumentObjectPresent: Boolean(authorizedRepresentativeIdFileObjects[0]),
            businessDocumentObjectPresent: Boolean(businessDocumentFileObjects[0]),
          },
        });
        const updatedData = await submitKyc(user.id, {
          ...formData,
          idType: formData.idType as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD',
          businessName: formData.businessName,
          businessType: formData.businessType as 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP',
          businessRegistrationNumber: formData.businessRegistrationNumber,
          businessAddress: formData.businessAddress,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone,
          authorizedRepresentativeName: formData.authorizedRepresentativeName,
          authorizedRepresentativeRole: formData.authorizedRepresentativeRole,
          authorizedRepresentativeIdFile: authorizedRepresentativeIdFile[0],
          businessDocumentFile: businessDocumentFile[0],
          submittedAt: new Date().toISOString(),
        }, {
          authorizedRepresentativeIdFile: authorizedRepresentativeIdFileObjects[0],
          businessDocumentFile: businessDocumentFileObjects[0],
        });

        console.log('[BuyerKYC] Verification submitted successfully', {
          userId: user.id,
          status: updatedData.status,
          recordId: updatedData.recordId,
        });
        setKycData(updatedData);
        setStep(2);

        toast({
          title: 'Verification submitted for review',
          description: 'Your documents are being verified. This usually takes 24-48 hours.',
        });

        setTimeout(() => {
          navigate('/buyer/dashboard');
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
        const updatedData = await resetKycRecord(user.id, 'buyer');
        setBusinessDocumentFile([]);
        setAuthorizedRepresentativeIdFile([]);
        setBusinessDocumentFileObjects([]);
        setAuthorizedRepresentativeIdFileObjects([]);
        setStep(0);
        setKycData(updatedData);
      } catch (error) {
        console.error('Error resetting verification:', error);
        toast({ title: 'Could not reset verification', variant: 'destructive' });
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
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Buyer Verification (KYB)</h1>
          <p className="text-muted-foreground">Complete your verification to place orders and access all features</p>
        </div>

        {/* Status Banner */}
        {isApproved && (
          <div className="farm-card bg-farm-success/10 border-farm-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-farm-success" />
              <div>
                <p className="font-semibold text-foreground">Verification Approved</p>
                <p className="text-sm text-muted-foreground">You can now place orders and access all features</p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="farm-card bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Verification Rejected</p>
                {kycData.rejectionReason && (
                  <p className="text-sm text-muted-foreground mb-2 mt-1">
                    <strong>Reason:</strong> {kycData.rejectionReason}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-3">Please review your documents and resubmit</p>
                <button
                  onClick={handleResubmit}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
                >
                  Resubmit Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {isInReview && (
          <div className="farm-card bg-farm-info/10 border-farm-info/20">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-farm-info" />
              <div>
                <p className="font-semibold text-foreground">Verification Under Review</p>
                <p className="text-sm text-muted-foreground">Your documents are being verified. This usually takes 24-48 hours.</p>
              </div>
            </div>
          </div>
        )}

        {!isApproved && (
          <>
            <Stepper steps={steps} currentStep={step} />

            {/* Step 1: Business Information */}
            {step === 0 && (
              <div className="farm-card space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Business Information</h2>
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateFormField('businessName', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => updateFormField('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual Trader</SelectItem>
                      <SelectItem value="COMPANY">Registered Company</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessRegistrationNumber">CAC Registration Number *</Label>
                  <Input
                    id="businessRegistrationNumber"
                    value={formData.businessRegistrationNumber}
                    onChange={(e) => updateFormField('businessRegistrationNumber', e.target.value)}
                    placeholder="Enter CAC registration number"
                  />
                </div>

                <div>
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => updateFormField('businessAddress', e.target.value)}
                    placeholder="Enter business address"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessEmail">Business Email *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => updateFormField('businessEmail', e.target.value)}
                      placeholder="business@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPhone">Business Phone *</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => updateFormField('businessPhone', e.target.value)}
                      placeholder="+234 801 234 5678"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-4">Authorized Representative</h3>
                  
                  <div>
                    <Label htmlFor="authorizedRepresentativeName">Full Name *</Label>
                    <Input
                      id="authorizedRepresentativeName"
                      value={formData.authorizedRepresentativeName}
                      onChange={(e) => updateFormField('authorizedRepresentativeName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="authorizedRepresentativeRole">Role in Business *</Label>
                    <Input
                      id="authorizedRepresentativeRole"
                      value={formData.authorizedRepresentativeRole}
                      onChange={(e) => updateFormField('authorizedRepresentativeRole', e.target.value)}
                      placeholder="e.g., Director, CEO, Owner, Manager"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Identity Verification */}
            {step === 1 && (
              <div className="farm-card space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Identity Verification</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idType">Government ID Type *</Label>
                    <Select value={formData.idType} onValueChange={(value) => updateFormField('idType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIN">National Identification Number (NIN)</SelectItem>
                        <SelectItem value="PASSPORT">International Passport</SelectItem>
                        <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                        <SelectItem value="VOTERS_CARD">Voter's Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => updateFormField('idNumber', e.target.value)}
                      placeholder="Enter ID number"
                    />
                  </div>

                  <div>
                    <Label>Authorized Representative Government ID *</Label>
                    <FileUploader 
                      files={authorizedRepresentativeIdFile} 
                      onFilesChange={setAuthorizedRepresentativeIdFile} 
                      fileObjects={authorizedRepresentativeIdFileObjects}
                      onFileObjectsChange={setAuthorizedRepresentativeIdFileObjects}
                      maxFiles={1} 
                      accept="image/*,.pdf"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Upload a clear photo or scan of the authorized representative's government ID</p>
                  </div>

                  <div>
                    <Label>CAC Certificate *</Label>
                    <FileUploader 
                      files={businessDocumentFile} 
                      onFilesChange={setBusinessDocumentFile} 
                      fileObjects={businessDocumentFileObjects}
                      onFileObjectsChange={setBusinessDocumentFileObjects}
                      maxFiles={1}
                      accept="image/*,.pdf"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Upload your CAC registration certificate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 2 && (
              <div className="farm-card space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Review & Submit</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Business Name</p>
                    <p className="text-foreground">{formData.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Business Type</p>
                    <p className="text-foreground">
                      {formData.businessType === 'INDIVIDUAL' ? 'Individual Trader' :
                       formData.businessType === 'COMPANY' ? 'Registered Company' :
                       formData.businessType === 'PARTNERSHIP' ? 'Partnership' : formData.businessType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">CAC Registration Number</p>
                    <p className="text-foreground">{formData.businessRegistrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Business Address</p>
                    <p className="text-foreground">{formData.businessAddress}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Business Email</p>
                      <p className="text-foreground">{formData.businessEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Business Phone</p>
                      <p className="text-foreground">{formData.businessPhone}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-foreground mb-3">Authorized Representative</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                        <p className="text-foreground">{formData.authorizedRepresentativeName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Role in Business</p>
                        <p className="text-foreground">{formData.authorizedRepresentativeRole}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Type</p>
                    <p className="text-foreground">
                      {formData.idType === 'NIN' ? 'National Identification Number (NIN)' :
                       formData.idType === 'PASSPORT' ? 'International Passport' :
                       formData.idType === 'DRIVERS_LICENSE' ? "Driver's License" :
                       formData.idType === 'VOTERS_CARD' ? "Voter's Card" : formData.idType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Number</p>
                    <p className="text-foreground">{formData.idNumber}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    By submitting, you confirm that all information provided is accurate and you agree to our terms of service.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium disabled:opacity-50"
              >
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerKYC;
