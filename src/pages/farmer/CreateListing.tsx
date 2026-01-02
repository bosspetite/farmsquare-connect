import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { addListing, formatNaira } from '@/lib/store';
import { GradeType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

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
  const [step, setStep] = useState(0);
  const [commodity, setCommodity] = useState<typeof commodities[number]>('Maize');
  const [quantity, setQuantity] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [grade, setGrade] = useState<GradeType>('A');

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate('/farmer/dashboard');
    }
  };

  const handlePublish = () => {
    if (!user) return;
    
    // Validate required fields
    if (!quantity || parseInt(quantity) <= 0) {
      toast({ 
        title: 'Invalid quantity', 
        description: 'Please enter a valid quantity',
        variant: 'destructive'
      });
      return;
    }
    
    if (!price || parseInt(price) <= 0) {
      toast({ 
        title: 'Invalid price', 
        description: 'Please enter a valid price',
        variant: 'destructive'
      });
      return;
    }
    
    // Ensure photos array is properly formatted
    const validPhotos = photos.filter(photo => photo && photo.length > 0);
    
    addListing({
      farmerId: user.id,
      farmerName: user.name,
      commodity,
      grade,
      quantityKg: parseInt(quantity),
      pricePerKg: parseInt(price),
      photos: validPhotos, // Only include valid photos
      locationLabel: `${user.region} Farm`,
      region: user.region,
      status: 'Active',
    });
    
    toast({ 
      title: 'Success!', 
      description: `Your ${commodity} listing is now live in the marketplace.` 
    });
    navigate('/farmer/listings'); // Navigate to listings page to see the new listing
  };

  return (
    <FarmerLayout>
      <div className="max-w-md mx-auto animate-fade-up">
        <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <Stepper steps={steps} currentStep={step} className="mb-8" />

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">What are you selling?</h2>
            <div className="grid grid-cols-2 gap-3">
              {commodities.map((c) => (
                <button key={c} onClick={() => setCommodity(c)} className={`p-4 rounded-xl border text-left transition-all ${commodity === c ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                  <span className="font-medium text-foreground">{c}</span>
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium mt-4">Continue</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">How much {commodity}?</h2>
            <div className="relative">
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" className="w-full px-4 py-4 pr-12 bg-card border border-border rounded-xl text-foreground text-lg" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
            </div>
            <button onClick={handleNext} disabled={!quantity} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Add photos</h2>
            <p className="text-muted-foreground text-sm">Add up to 3 photos of your produce</p>
            <FileUploader files={photos} onFilesChange={setPhotos} maxFiles={3} />
            <button onClick={handleNext} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium">Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Set your price</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full pl-10 pr-16 py-4 bg-card border border-border rounded-xl text-foreground text-lg" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">per kg</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quality Grade</label>
              <div className="flex gap-3">
                {grades.map((g) => (
                  <button key={g} onClick={() => setGrade(g)} className={`flex-1 py-3 rounded-xl border font-medium ${grade === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleNext} disabled={!price} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Continue</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Review Your Listing</h2>
            
            {/* Preview Card */}
            <div className="farm-card">
              {/* Photos Preview */}
              <div className="w-full h-48 rounded-xl bg-muted mb-4 flex items-center justify-center overflow-hidden">
                {photos.length > 0 && photos[0] ? (
                  <img 
                    src={photos[0]} 
                    alt={commodity} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
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
                  <p className="text-2xl font-bold text-primary">{formatNaira(parseInt(price || '0'))}/kg</p>
                  <p className="text-sm text-muted-foreground mt-1">Total value: {formatNaira(parseInt(quantity || '0') * parseInt(price || '0'))}</p>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{user?.region} Farm</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStep(3)} 
                className="flex-1 py-4 bg-card border border-border text-foreground rounded-xl font-medium"
              >
                Edit
              </button>
              <button 
                onClick={handlePublish} 
                disabled={!price || !quantity} 
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Publish Listing
              </button>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};

export default CreateListing;
