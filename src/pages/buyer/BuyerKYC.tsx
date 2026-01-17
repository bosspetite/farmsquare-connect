import { useState, useEffect } from 'react';
import { Camera, CreditCard, CheckCircle, AlertCircle, Info, User, FileText, Building2, Shield } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getKYCByUserId, updateKYCData, updateKYCStatus } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { KYCData } from '@/types';

const steps = [
  { label: 'Business Info', description: 'Company details' },
  { label: 'Identity', description: 'ID verification' },
  { label: 'Review', description: 'Submit for review' }
];

const BuyerKYC = () => {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [step, setStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    businessName: '',
    businessType: '' as 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP' | '',
    businessRegistrationNumber: '',
    idType: '' as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | '',
    idNumber: '',
  });
  
  const [selfieFile, setSelfieFile] = useState<string[]>([]);
  const [idDocumentFile, setIdDocumentFile] = useState<string[]>([]);
  const [businessDocumentFile, setBusinessDocumentFile] = useState<string[]>([]);
  
  // Load KYC data when component mounts
  useEffect(() => {
    if (user) {
      try {
        const data = getKYCByUserId(user.id);
        setKycData(data);
        
        // Load existing data if available
        if (data) {
          setFormData({
            fullName: data.fullName || '',
            phoneNumber: data.phoneNumber || '',
            dateOfBirth: data.dateOfBirth || '',
            address: data.address || '',
            businessName: data.businessName || '',
            businessType: data.businessType || '',
            businessRegistrationNumber: data.businessRegistrationNumber || '',
            idType: data.idType || '',
            idNumber: data.idNumber || '',
          });
          
          if (data.selfieFile) setSelfieFile([data.selfieFile]);
          if (data.idDocumentFile) setIdDocumentFile([data.idDocumentFile]);
          if (data.businessDocumentFile) setBusinessDocumentFile([data.businessDocumentFile]);
          
          // Set step based on status
          if (data.status === 'APPROVED') {
            setStep(2);
          } else if (data.status === 'IN_REVIEW') {
            setStep(2);
          } else if (data.status === 'REJECTED') {
            setStep(0);
          }
        } else {
          // Pre-fill with user data
          setFormData(prev => ({
            ...prev,
            fullName: user.name || '',
            phoneNumber: user.phone || '',
          }));
        }
      } catch (error) {
        console.error('Error loading KYC data:', error);
      }
    }
  }, [user]);

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
    if (!formData.businessName.trim()) {
      toast({ title: 'Business name is required', variant: 'destructive' });
      return false;
    }
    if (!formData.businessType) {
      toast({ title: 'Business type is required', variant: 'destructive' });
      return false;
    }
    if (formData.businessType === 'COMPANY' && !formData.businessRegistrationNumber.trim()) {
      toast({ title: 'Business registration number is required for companies', variant: 'destructive' });
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
    if (selfieFile.length === 0) {
      toast({ title: 'Selfie photo is required', variant: 'destructive' });
      return false;
    }
    if (idDocumentFile.length === 0) {
      toast({ title: 'ID document is required', variant: 'destructive' });
      return false;
    }
    if (formData.businessType === 'COMPANY' && businessDocumentFile.length === 0) {
      toast({ title: 'Business registration document is required', variant: 'destructive' });
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
    if (!user) return;
    
    if (!validateStep1() || !validateStep2()) {
      setStep(0);
      return;
    }
    
    try {
      // Update KYC data with all information including business data
      // This function already updates buyer.kycStatus, so we don't need updateKYCStatus
      updateKYCData(user.id, {
        ...formData,
        idType: formData.idType as 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD',
        selfieFile: selfieFile[0],
        idDocumentFile: idDocumentFile[0],
        businessDocumentFile: businessDocumentFile.length > 0 ? businessDocumentFile[0] : undefined,
        businessName: formData.businessName,
        businessType: formData.businessType as 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP',
        businessRegistrationNumber: formData.businessRegistrationNumber,
        status: 'IN_REVIEW',
        submittedAt: new Date().toISOString(),
      });
      
      // Refresh the data to show updated status
      const updatedData = getKYCByUserId(user.id);
      setKycData(updatedData);
      setStep(2); // Move to review step
      
      // Force a small delay to ensure state is updated, then refresh page to update user context
      setTimeout(() => {
        // Reload to refresh user context with updated kycStatus
        window.location.reload();
      }, 500);
      
      toast({ 
        title: 'Verification submitted for review', 
        description: 'Your documents are being verified. This usually takes 24-48 hours.' 
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to submit verification. Please try again.',
        variant: 'destructive' 
      });
    }
  };

  const handleResubmit = () => {
    if (!user) return;
    
    // Reset to start fresh
    updateKYCData(user.id, {
      status: 'NOT_STARTED',
    });
    
    setSelfieFile([]);
    setIdDocumentFile([]);
    setBusinessDocumentFile([]);
    setStep(0);
    
    const updatedData = getKYCByUserId(user.id);
    setKycData(updatedData);
  };

  const isApproved = kycData?.status === 'APPROVED';
  const isRejected = kycData?.status === 'REJECTED';
  const isInReview = kycData?.status === 'IN_REVIEW';
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
              <div className="farm-card space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Business Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => updateFormField('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormField('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormField('address', e.target.value)}
                    placeholder="Enter business address"
                  />
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

                {formData.businessType === 'COMPANY' && (
                  <div>
                    <Label htmlFor="businessRegistrationNumber">Business Registration Number *</Label>
                    <Input
                      id="businessRegistrationNumber"
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => updateFormField('businessRegistrationNumber', e.target.value)}
                      placeholder="Enter registration number"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormField('dateOfBirth', e.target.value)}
                  />
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

                <div>
                  <Label htmlFor="idType">ID Type *</Label>
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
                  <Label>Selfie Photo *</Label>
                  <FileUploader 
                    files={selfieFile} 
                    onFilesChange={setSelfieFile} 
                    maxFiles={1}
                    accept="image/*"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Take a clear selfie holding your ID</p>
                </div>

                <div>
                  <Label>ID Document Photo *</Label>
                  <FileUploader 
                    files={idDocumentFile} 
                    onFilesChange={setIdDocumentFile} 
                    maxFiles={1}
                    accept="image/*"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload a clear photo of your ID document</p>
                </div>

                {formData.businessType === 'COMPANY' && (
                  <div>
                    <Label>Business Registration Document *</Label>
                    <FileUploader 
                      files={businessDocumentFile} 
                      onFilesChange={setBusinessDocumentFile} 
                      maxFiles={1}
                      accept="image/*,.pdf"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Upload business registration certificate</p>
                  </div>
                )}
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
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="text-foreground">{formData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                    <p className="text-foreground">{formData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Business Address</p>
                    <p className="text-foreground">{formData.address}</p>
                  </div>
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
                  {formData.businessType === 'COMPANY' && formData.businessRegistrationNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Business Registration Number</p>
                      <p className="text-foreground">{formData.businessRegistrationNumber}</p>
                    </div>
                  )}
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
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                >
                  Submit for Review
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
