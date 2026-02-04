import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Declare Paystack on window
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        metadata?: Record<string, any>;
        onClose?: () => void;
        callback: (response: { reference: string; status: string; message: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

export interface PaystackConfig {
  email: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  onError?: (message: string) => void;
}

/**
 * Hook for Paystack payment integration
 * Uses environment variable VITE_PAYSTACK_PUBLIC_KEY
 */
export const usePaystack = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get API key from environment
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  // Check if Paystack script is loaded
  useEffect(() => {
    const checkPaystack = () => {
      if (window.PaystackPop) {
        setIsLoaded(true);
      } else {
        // Retry after a short delay
        setTimeout(checkPaystack, 100);
      }
    };
    checkPaystack();
  }, []);

  // Generate unique reference
  const generateReference = (): string => {
    return `FSQ_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  };

  // Initialize Paystack payment
  const initializePayment = (config: PaystackConfig): void => {
    // Validate API key
    if (!publicKey || publicKey === 'your_paystack_public_key_here' || publicKey.trim() === '') {
      toast({
        title: 'Payment Configuration Error',
        description: 'Paystack API key is not configured. Please contact support.',
        variant: 'destructive',
      });
      config.onError?.('API key not configured');
      return;
    }

    // Check if Paystack is loaded
    if (!isLoaded || !window.PaystackPop) {
      toast({
        title: 'Payment System Loading',
        description: 'Please wait a moment and try again',
        variant: 'destructive',
      });
      config.onError?.('Paystack not loaded');
      return;
    }

    // Validate email
    if (!config.email || !config.email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      config.onError?.('Invalid email');
      return;
    }

    // Validate amount
    if (config.amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Payment amount must be greater than zero',
        variant: 'destructive',
      });
      config.onError?.('Invalid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const reference = config.reference || generateReference();

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: config.email,
        amount: config.amount * 100, // Convert to kobo (Paystack uses smallest currency unit)
        currency: 'NGN',
        ref: reference,
        metadata: config.metadata || {},
        onClose: () => {
          setIsProcessing(false);
          config.onClose?.();
        },
        callback: (response) => {
          setIsProcessing(false);
          if (response.status === 'success' && response.reference) {
            config.onSuccess(response.reference);
          } else {
            const errorMessage = response.message || 'Payment could not be processed. Please try again.';
            toast({
              title: 'Payment Failed',
              description: errorMessage,
              variant: 'destructive',
            });
            config.onError?.(errorMessage);
          }
        },
      });

      // Open Paystack payment popup
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      const errorMessage = 'An error occurred while processing your payment. Please try again.';
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      config.onError?.(errorMessage);
    }
  };

  return {
    initializePayment,
    isLoaded,
    isProcessing,
    isConfigured: !!publicKey && publicKey !== 'your_paystack_public_key_here' && publicKey.trim() !== '',
  };
};

