import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Save, Shield } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira } from '@/lib/store';
import { GradeType, ProductImageLibraryItem, ProductImageSource } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import { createListing } from '@/services/listingService';
import { ProductImageLibraryPicker } from '@/components/listings/ProductImageLibraryPicker';
import { getActiveProductLibraryImages, uploadFarmerProductImage } from '@/services/productImageLibraryService';

const steps = [
  { label: 'Crop' },
  { label: 'Volume' },
  { label: 'Photos' },
  { label: 'Price' },
  { label: 'Review' },
];

const commodities = ['Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum'] as const;
const grades: GradeType[] = ['A', 'B', 'C'];

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminSeller = user?.role === 'admin';
  const backToDashboardPath = isAdminSeller ? '/admin/dashboard' : '/farmer/dashboard';
  const listingsPath = isAdminSeller ? '/admin/listings' : '/farmer/listings';
  const LayoutComponent = isAdminSeller ? AdminLayout : FarmerLayout;
  const [step, setStep] = useState(0);
  const [commodity, setCommodity] = useState<typeof commodities[number]>('Maize');
  const [quantity, setQuantity] = useState('');
  const [imageSource, setImageSource] = useState<ProductImageSource>('upload');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedPhotoObjects, setUploadedPhotoObjects] = useState<File[]>([]);
  const [libraryImages, setLibraryImages] = useState<ProductImageLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<ProductImageLibraryItem | null>(null);
  const [price, setPrice] = useState('');
  const [grade, setGrade] = useState<GradeType>('A');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isKYCApproved = isAdminSeller || user?.kycStatus === 'APPROVED';
  const previewPhotos = useMemo(
    () => (imageSource === 'library' ? (selectedLibraryImage ? [selectedLibraryImage.imageUrl] : []) : uploadedPhotos),
    [imageSource, selectedLibraryImage, uploadedPhotos]
  );

  useEffect(() => {
    let active = true;

    const loadLibraryImages = async () => {
      try {
        setLibraryLoading(true);
        const images = await getActiveProductLibraryImages();
        if (active) {
          setLibraryImages(images);
        }
      } catch (error) {
        console.error('[CreateListing] Failed to load product image library', error);
        if (active) {
          toast({
            title: 'Image library unavailable',
            description: 'You can still upload your own product image and continue.',
            variant: 'destructive',
          });
        }
      } finally {
        if (active) {
          setLibraryLoading(false);
        }
      }
    };

    void loadLibraryImages();

    return () => {
      active = false;
    };
  }, [toast]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(backToDashboardPath);
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    
    // Check KYC approval
    if (!isKYCApproved) {
      toast({ 
        title: 'KYC Verification Required', 
        description: 'Please complete KYC verification before publishing listings.',
        variant: 'destructive'
      });
      navigate('/farmer/kyc');
      return;
    }
    
    // Validate required fields
    if (!quantity || !Number.isFinite(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      toast({ 
        title: 'Invalid quantity', 
        description: 'Please enter a valid quantity',
        variant: 'destructive'
      });
      return;
    }
    
    if (!price || !Number.isFinite(parseFloat(price)) || parseFloat(price) <= 0) {
      toast({ 
        title: 'Invalid price', 
        description: 'Please enter a valid price',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      let validPhotos: string[] = [];
      let photoPaths: string[] = [];

      if (imageSource === 'library') {
        if (!selectedLibraryImage) {
          toast({
            title: 'Image required',
            description: 'Please upload an image or choose one from the library.',
            variant: 'destructive',
          });
          return;
        }

        validPhotos = [selectedLibraryImage.imageUrl];
        photoPaths = selectedLibraryImage.imagePath ? [selectedLibraryImage.imagePath] : [];
      } else {
        if (uploadedPhotoObjects.length === 0) {
          toast({
            title: 'Image required',
            description: 'Please upload an image or choose one from the library.',
            variant: 'destructive',
          });
          return;
        }

        const uploaded = await Promise.all(uploadedPhotoObjects.map((file) => uploadFarmerProductImage(user.id, file)));
        validPhotos = uploaded.map((item) => item.url);
        photoPaths = uploaded.map((item) => item.path);
      }

      await createListing({
        farmerId: user.id,
        farmerName: user.name,
        commodity,
        grade,
        quantityKg: parseFloat(quantity),
        pricePerKg: parseFloat(price),
        photos: validPhotos,
        photoPaths,
        photoSource: imageSource,
        libraryImageId: imageSource === 'library' ? selectedLibraryImage?.id : null,
        locationLabel: `${user.region} Farm`,
        region: user.region,
        status: 'Active',
      });

      toast({ 
        title: 'Success!', 
        description: `Your ${commodity} listing is now live in the marketplace.` 
      });
      navigate(listingsPath);
    } catch (error: any) {
      console.error('[CreateListing] Failed to publish listing', {
        commodity,
        grade,
        imageSource,
        hasSelectedLibraryImage: Boolean(selectedLibraryImage),
        uploadedPhotoCount: uploadedPhotoObjects.length,
        error,
      });
      toast({
        title: 'Unable to publish listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      let validPhotos: string[] = [];
      let photoPaths: string[] = [];

      if (imageSource === 'library') {
        if (selectedLibraryImage) {
          validPhotos = [selectedLibraryImage.imageUrl];
          photoPaths = selectedLibraryImage.imagePath ? [selectedLibraryImage.imagePath] : [];
        }
      } else if (uploadedPhotoObjects.length > 0) {
        const uploaded = await Promise.all(uploadedPhotoObjects.map((file) => uploadFarmerProductImage(user.id, file)));
        validPhotos = uploaded.map((item) => item.url);
        photoPaths = uploaded.map((item) => item.path);
      }

      await createListing({
        farmerId: user.id,
        farmerName: user.name,
        commodity,
        grade,
        quantityKg: parseFloat(quantity || '0'),
        pricePerKg: parseFloat(price || '0'),
        photos: validPhotos,
        photoPaths,
        photoSource: imageSource,
        libraryImageId: imageSource === 'library' ? selectedLibraryImage?.id : null,
        locationLabel: `${user.region} Farm`,
        region: user.region,
        status: 'Draft',
      });

      toast({ 
        title: 'Draft saved', 
        description: 'Your listing has been saved as a draft. You can publish it later.' 
      });
      navigate(listingsPath);
    } catch (error: any) {
      console.error('[CreateListing] Failed to save draft listing', {
        commodity,
        grade,
        imageSource,
        hasSelectedLibraryImage: Boolean(selectedLibraryImage),
        uploadedPhotoCount: uploadedPhotoObjects.length,
        error,
      });
      toast({
        title: 'Unable to save draft',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutComponent>
      <div className="max-w-md mx-auto animate-fade-up">
        <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {/* KYC Warning Banner */}
        {!isKYCApproved && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-farm-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">Verification Required</p>
                <p className="text-sm text-muted-foreground mb-3">
                    Complete KYC verification to publish listings. You can save as draft without verification.
                </p>
                <button
                  onClick={() => navigate('/farmer/kyc')}
                  className="px-4 py-2 bg-farm-warning text-foreground rounded-xl text-sm font-medium"
                >
                  Complete Verification
                </button>
              </div>
            </div>
          </div>
        )}

        <Stepper steps={steps} currentStep={step} className="mb-8" />

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">What are you selling?</h2>
            <div className="grid grid-cols-2 gap-3">
              {commodities.map((c) => (
                <button key={c} onClick={() => setCommodity(c)} className={`p-4 rounded-xl border text-left transition-all min-h-[72px] active:scale-[0.98] ${commodity === c ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                  <span className="font-medium text-foreground text-base">{c}</span>
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold mt-4 min-h-[52px] active:scale-[0.98]">Continue</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">How much {commodity}?</h2>
            <div className="relative">
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" min="0.01" step="0.01" className="w-full px-4 py-4 pr-12 bg-card border border-border rounded-xl text-foreground text-lg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
            </div>
            <p className="text-xs text-muted-foreground">You can list any available stock volume. There is no fixed 100kg cap in the app.</p>
            <button onClick={handleNext} disabled={!quantity} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Add photo</h2>
            <p className="text-muted-foreground text-sm">Upload your own produce photo or choose one from the image library</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImageSource('upload')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${imageSource === 'upload' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}
              >
                Upload my own image
              </button>
              <button
                type="button"
                onClick={() => setImageSource('library')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${imageSource === 'library' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}
              >
                Choose from library
              </button>
            </div>

            {imageSource === 'upload' ? (
              <FileUploader
                files={uploadedPhotos}
                onFilesChange={setUploadedPhotos}
                fileObjects={uploadedPhotoObjects}
                onFileObjectsChange={setUploadedPhotoObjects}
                maxFiles={1}
              />
            ) : (
              <ProductImageLibraryPicker
                images={libraryImages}
                selectedImageId={selectedLibraryImage?.id}
                onSelect={setSelectedLibraryImage}
                loading={libraryLoading}
                emptyMessage="No active library images are available yet. Ask an admin to upload produce images or switch to your own upload."
              />
            )}

            {previewPhotos.length > 0 && previewPhotos[0] && (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-sm font-medium text-foreground mb-2">
                  {imageSource === 'library' ? 'Selected Library Image' : 'Uploaded Photo Preview'}
                </p>
                <div className="relative group">
                  <img
                    src={previewPhotos[0]}
                    alt="Produce photo"
                    className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border-2 border-primary"
                    onClick={() => {
                      // Open image in new tab for full view
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<img src="${previewPhotos[0]}" style="max-width: 100%; height: auto;" />`);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center">
                    <p className="text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-lg font-medium">
                      Click to view full size
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={handleNext} 
              disabled={previewPhotos.length === 0}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Set your price</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full pl-10 pr-16 py-4 bg-card border border-border rounded-xl text-foreground text-lg min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">per kg</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quality Grade</label>
              <div className="flex gap-3">
                {grades.map((g) => (
                  <button key={g} onClick={() => setGrade(g)} className={`flex-1 py-3 rounded-xl border font-semibold min-h-[48px] active:scale-[0.98] ${grade === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleNext} disabled={!price} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]">Continue</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Review Your Listing</h2>
            
            {/* Preview Card */}
            <div className="farm-card">
              {/* Photos Preview */}
              <div 
                className="relative w-full h-48 rounded-xl bg-muted mb-4 flex items-center justify-center overflow-hidden group cursor-pointer hover:opacity-90 transition-opacity border-2 border-primary"
                onClick={() => {
                  if (previewPhotos.length > 0 && previewPhotos[0]) {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>${commodity} Photo</title>
                            <style>
                              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                              img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            </style>
                          </head>
                          <body>
                            <img src="${previewPhotos[0]}" alt="${commodity}" />
                          </body>
                        </html>
                      `);
                    }
                  }
                }}
              >
                {previewPhotos.length > 0 && previewPhotos[0] ? (
                  <>
                    <img 
                      src={previewPhotos[0]} 
                      alt={commodity} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <p className="text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-4 py-2 rounded-lg font-medium">
                        Click to view full size
                      </p>
                    </div>
                  </>
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">{commodity}</h3>
                    <p className="text-sm text-muted-foreground">Grade {grade} · {quantity}kg available</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                    Grade {grade}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-2xl font-bold text-primary">{formatNaira(parseFloat(price || '0'))}/kg</p>
                  <p className="text-sm text-muted-foreground mt-1">Total value: {formatNaira(parseFloat(quantity || '0') * parseFloat(price || '0'))}</p>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{user?.region} Farm</p>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Image source</p>
                  <p className="font-medium text-foreground">
                    {imageSource === 'library'
                      ? `${selectedLibraryImage?.name || 'Library image'} from the product image library`
                      : 'Custom farmer upload'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(3)} 
                  className="flex-1 py-4 bg-card border border-border text-foreground rounded-xl font-semibold min-h-[52px] active:scale-[0.98]"
                >
                  Edit
                </button>
                <button 
                  onClick={handleSaveDraft} 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" /> {isSubmitting ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
              <button 
                onClick={handlePublish} 
                disabled={!price || !quantity || !isKYCApproved || isSubmitting} 
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] active:scale-[0.98]"
              >
                <Check className="w-5 h-5" /> 
                {isSubmitting ? 'Publishing...' : isKYCApproved ? 'Publish Listing' : 'KYC Required to Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </LayoutComponent>
  );
};

export default CreateListing;
