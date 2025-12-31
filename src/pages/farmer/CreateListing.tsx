import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { Stepper } from '@/components/ui/Stepper';
import { FileUploader } from '@/components/ui/FileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { addListing } from '@/lib/store';
import { GradeType } from '@/types';
import { toast } from '@/hooks/use-toast';

const steps = [
  { label: 'Crop' },
  { label: 'Volume' },
  { label: 'Photos' },
  { label: 'Price' },
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
    if (step < 3) setStep(step + 1);
  };

  const handlePublish = () => {
    if (!user) return;
    
    addListing({
      farmerId: user.id,
      farmerName: user.name,
      commodity,
      grade,
      quantityKg: parseInt(quantity),
      pricePerKg: parseInt(price),
      photos,
      locationLabel: `${user.region} Farm`,
      region: user.region,
      status: 'Active',
    });
    
    toast({ title: 'Success!', description: 'Your listing is now live.' });
    navigate('/farmer/dashboard');
  };

  return (
    <FarmerLayout>
      <div className="max-w-md mx-auto animate-fade-up">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/farmer/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
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
            <button onClick={handlePublish} disabled={!price} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Publish Listing
            </button>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};

export default CreateListing;
