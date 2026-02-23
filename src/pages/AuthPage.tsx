import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tractor, ShoppingBag, Users, Shield, ArrowLeft, Phone, Check, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// ── Import BOTH auth backends & auto-detect ─────────────────────────
import {
  signUp as supabaseSignUp,
  signIn as supabaseSignIn,
  validateEmail as supabaseValidateEmail,
  validatePassword as supabaseValidatePassword,
} from '@/services/supabaseAuthService';
import {
  signUp as mockSignUp,
  signIn as mockSignIn,
  validateEmail as mockValidateEmail,
  validatePassword as mockValidatePassword,
} from '@/services/authService';

const USE_SUPABASE = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

const signUp = USE_SUPABASE ? supabaseSignUp : mockSignUp;
const signIn = USE_SUPABASE ? supabaseSignIn : mockSignIn;
const validateEmail = USE_SUPABASE ? supabaseValidateEmail : mockValidateEmail;
const validatePassword = USE_SUPABASE ? supabaseValidatePassword : mockValidatePassword;

import logo from '@/assets/logo.png';
type AuthStep = 'signup' | 'login' | 'role' | 'profile';

// PRESERVED: Phone OTP steps for future restoration
// type AuthStep = 'phone' | 'otp' | 'role' | 'profile';

// Normal user roles (visible in onboarding)
const normalRoles = [
  { id: 'farmer' as UserRole, icon: Tractor, label: 'Farmer', description: 'Sell your produce directly to buyers' },
  { id: 'buyer' as UserRole, icon: ShoppingBag, label: 'Buyer', description: 'Source quality produce from farms' },
];

// Admin/Agent roles (hidden from normal onboarding, accessible via direct routes only)
const adminRoles = [
  { id: 'agent' as UserRole, icon: Users, label: 'Field Agent', description: 'Assist farmers with onboarding' },
  { id: 'admin' as UserRole, icon: Shield, label: 'Admin', description: 'Manage the platform' },
];

const ONBOARDING_INTENT_KEY = 'farmsquare_onboarding_intent';

const regions = ['Kaduna', 'Kano', 'Lagos', 'Oyo', 'Benue', 'Niger', 'Plateau', 'Nasarawa', 'Ekiti', 'Kogi', 'Kwara', 'Osun'];

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  
  // Email/Password auth state
  const [step, setStep] = useState<AuthStep>('login');
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile setup state
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [onboardingIntent, setOnboardingIntent] = useState<UserRole | null>(null);

  // PRESERVED: Phone OTP state (for future restoration)
  // const [phone, setPhone] = useState('');
  // const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Read intent from URL and store it
  useEffect(() => {
    const intentParam = searchParams.get('intent');
    if (intentParam === 'farmer' || intentParam === 'buyer') {
      const intent = intentParam as UserRole;
      setOnboardingIntent(intent);
      sessionStorage.setItem(ONBOARDING_INTENT_KEY, intent);
    } else {
      // Check if intent was stored from previous step
      const storedIntent = sessionStorage.getItem(ONBOARDING_INTENT_KEY);
      if (storedIntent === 'farmer' || storedIntent === 'buyer') {
        setOnboardingIntent(storedIntent as UserRole);
      }
    }
  }, [searchParams]);

  // Handle login with email/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.message || 'Invalid email');
      setLoading(false);
      return;
    }

    // Validate password
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      const { user: authUser, error: authError } = await signIn({ email, password });

      if (authError || !authUser) {
        setError(authError?.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Login successful - update auth context and redirect
      login(authUser.role, authUser.fullName, authUser.region);

      // Redirect to appropriate dashboard
      switch (authUser.role) {
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
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Handle signup with email/password
  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.message || 'Invalid email');
      setLoading(false);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      setLoading(false);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check if we have an intent (farmer/buyer) or need role selection
    if (!selectedRole) {
      // Need to select role first
      if (onboardingIntent && (onboardingIntent === 'farmer' || onboardingIntent === 'buyer')) {
        setSelectedRole(onboardingIntent);
        setStep('profile');
        setLoading(false);
        return;
      } else {
        setStep('role');
        setLoading(false);
        return;
      }
    }

    // If we have role but no name/region, go to profile step
    if (!name || !region) {
      setStep('profile');
      setLoading(false);
      return;
    }

    // All data ready - create account
    try {
      const { user: authUser, error: authError } = await signUp({
        email,
        password,
        fullName: name,
        phone: '+2340000000000', // Placeholder – updated after profile completion
        role: selectedRole,
        region,
      } as any);

      if (authError || !authUser) {
        setError(authError?.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Signup successful - login and redirect
      login(authUser.role, authUser.fullName, authUser.region);

      // Clear onboarding intent
      sessionStorage.removeItem(ONBOARDING_INTENT_KEY);

      // Redirect to appropriate dashboard
      switch (authUser.role) {
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
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  // PRESERVED: Phone OTP handlers (for future restoration)
  /*
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
      // Check if user already exists with this phone
      const state = getAppState();
      const existingUser = [...state.farmers, ...state.buyers, ...state.agents, ...state.admins]
        .find(u => u.phone === `+234${phone}`);
      
      if (existingUser) {
        // User exists - login and redirect to their dashboard
        login(existingUser.role, existingUser.name, existingUser.region);
        
        switch (existingUser.role) {
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
        return;
      }

      // New user - check if we have an intent
      if (onboardingIntent && (onboardingIntent === 'farmer' || onboardingIntent === 'buyer')) {
        // Skip role selection, go directly to profile setup
        setSelectedRole(onboardingIntent);
        setStep('profile');
      } else {
        // No intent - show role selection
        setStep('role');
      }
    }
  };
  */

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('profile');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !region || !selectedRole) {
      setError('Please fill in all fields');
      return;
    }

    // If we're in signup flow, complete the signup
    if (isSignup && email && password) {
      // Validate password confirmation if we're completing signup
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await handleSignup();
      return;
    }

    // Otherwise, just update profile (for existing users - fallback)
    login(selectedRole, name, region);
    
    // Clear onboarding intent after successful setup
    sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
    
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
  };

  const goBack = () => {
    switch (step) {
      case 'role':
        setStep(isSignup ? 'signup' : 'login');
        break;
      case 'profile':
        if (isSignup && selectedRole) {
          setStep('role');
        } else {
        setStep('role');
        }
        break;
      default:
        // Reset to login
        setStep('login');
        setIsSignup(false);
        break;
    }
  };

  const switchToSignup = () => {
    setIsSignup(true);
    setStep('signup');
    setError(null);
  };

  const switchToLogin = () => {
    setIsSignup(false);
    setStep('login');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-3">
          {step !== 'login' && step !== 'signup' && (
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
          {/* Login Step */}
          {step === 'login' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Welcome back
              </h1>
              <p className="text-muted-foreground mb-8">
                Sign in to your FarmSquare account
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[52px]"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* Signup Step */}
          {step === 'signup' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Create your account
              </h1>
              <p className="text-muted-foreground mb-8">
                Get started with FarmSquare
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[52px]"
                >
                  {loading ? 'Creating account...' : 'Continue'}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* PRESERVED: Phone OTP Steps (for future restoration) */}
          {/*
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
          */}

          {/* Role Selection Step - Only show Farmer and Buyer in normal flow */}
          {step === 'role' && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Choose your role
              </h1>
              <p className="text-muted-foreground mb-8">
                How will you use FarmSquare?
              </p>
              
              <div className="space-y-3">
                {/* Only show Farmer and Buyer in normal onboarding */}
                {normalRoles.map((role) => (
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
