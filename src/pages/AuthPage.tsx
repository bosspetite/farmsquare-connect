import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, ShoppingBag, Users, Shield, ArrowLeft, Phone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import logo from '@/assets/logo.png';

type AuthStep = 'phone' | 'otp' | 'role' | 'profile';

const roles = [
  { id: 'farmer' as UserRole, icon: Tractor, label: 'Farmer', description: 'Sell your produce directly to buyers' },
  { id: 'buyer' as UserRole, icon: ShoppingBag, label: 'Buyer', description: 'Source quality produce from farms' },
  { id: 'agent' as UserRole, icon: Users, label: 'Field Agent', description: 'Assist farmers with onboarding' },
  { id: 'admin' as UserRole, icon: Shield, label: 'Admin', description: 'Manage the platform' },
];

const regions = ['Kaduna', 'Kano', 'Lagos', 'Oyo', 'Benue', 'Niger', 'Plateau', 'Nasarawa', 'Ekiti', 'Kogi', 'Kwara', 'Osun'];

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.every(d => d !== '')) {
      setStep('role');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && region && selectedRole) {
      login(selectedRole, name, region);
      
      // Navigate to appropriate dashboard
      switch (selectedRole) {
        case 'farmer':
          navigate('/farmer/dashboard');
          break;
        case 'buyer':
          navigate('/buyer/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
      }
    }
  };

  const goBack = () => {
    switch (step) {
      case 'otp':
        setStep('phone');
        break;
      case 'role':
        setStep('otp');
        break;
      case 'profile':
        setStep('role');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-3">
          {step !== 'phone' && (
            <button onClick={goBack} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <img src={logo} alt="FarmSquare" className="w-10 h-10" />
          <span className="font-display font-bold text-xl text-foreground">FarmSquare</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 pb-8">
        <div className="w-full max-w-md mx-auto">
          {/* Phone Step */}
          {step === 'phone' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Welcome to FarmSquare
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter your phone number to get started
              </p>
              
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">+234</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="8012345678"
                    className="w-full pl-20 sm:pl-24 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg min-h-[52px]"
                    maxLength={10}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={phone.length < 10}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[52px]"
                >
                  Continue
                </button>
              </form>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Enter verification code
              </h1>
              <p className="text-muted-foreground mb-8">
                We sent a code to +234{phone}
              </p>
              
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-2 sm:gap-3 justify-center px-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-11 h-14 sm:w-12 sm:h-14 bg-card border border-border rounded-xl text-center text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
                      maxLength={1}
                    />
                  ))}
                </div>
                
                <button
                  type="submit"
                  disabled={!otp.every(d => d !== '')}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[52px]"
                >
                  Verify
                </button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive code?{' '}
                  <button type="button" className="text-primary font-medium">
                    Resend
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* Role Selection Step */}
          {step === 'role' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Choose your role
              </h1>
              <p className="text-muted-foreground mb-8">
                How will you use FarmSquare?
              </p>
              
              <div className="space-y-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full p-4 sm:p-5 farm-card-interactive flex items-center gap-3 sm:gap-4 text-left active:scale-[0.98] min-h-[72px]"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <role.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-base sm:text-lg">{role.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Profile Setup Step */}
          {step === 'profile' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Complete your profile
              </h1>
              <p className="text-muted-foreground mb-8">
                Tell us a bit about yourself
              </p>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-4 bg-card border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none min-h-[52px] text-base"
                  >
                    <option value="">Select your region</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={!name || !region}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]"
                >
                  <Check className="w-5 h-5" />
                  Complete Setup
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
