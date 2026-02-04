import { useState } from 'react';
import { CreditCard, Lock, CheckCircle, X, Loader2, Shield, Smartphone, Monitor, AlertCircle } from 'lucide-react';
import { formatNaira, getAppState, setAppState, addTransaction, fundBuyerWallet } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePaystack } from '@/hooks/usePaystack';

interface PaymentGatewayProps {
  amount: number;
  orderDetails: {
    commodity: string;
    quantity: number;
    farmerName: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentGateway = ({ amount, orderDetails, onSuccess, onCancel }: PaymentGatewayProps) => {
  const { user } = useAuth();
  const { initializePayment, isLoaded, isProcessing, isConfigured } = usePaystack();
  const [step, setStep] = useState<'card' | 'processing' | 'success' | 'failed'>('card');
  const [email, setEmail] = useState(user?.email || '');

  const handlePayment = () => {
    if (!email || !email.includes('@')) {
      toast({ 
        title: 'Invalid email', 
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    if (!isConfigured) {
      toast({ 
        title: 'Payment Configuration Error', 
        description: 'Paystack is not configured. Please contact support.',
        variant: 'destructive'
      });
      return;
    }

    if (!isLoaded) {
      toast({ 
        title: 'Payment system loading', 
        description: 'Please wait a moment and try again',
        variant: 'destructive'
      });
      return;
    }

    setStep('processing');

    initializePayment({
        email: email,
      amount: amount,
        metadata: {
          custom_fields: [
            {
              display_name: 'Commodity',
              variable_name: 'commodity',
              value: orderDetails.commodity,
            },
            {
              display_name: 'Quantity',
              variable_name: 'quantity',
              value: `${orderDetails.quantity}kg`,
            },
            {
              display_name: 'Farmer',
              variable_name: 'farmer_name',
              value: orderDetails.farmerName,
            },
          ],
        },
        onClose: () => {
          setStep('card');
          toast({ 
            title: 'Payment cancelled', 
            description: 'You closed the payment window',
            variant: 'default'
          });
        },
      onSuccess: (reference) => {
            // Payment successful - fund wallet
            if (user) {
          fundBuyerWallet(user.id, amount, reference);
            }
            
            setStep('success');
            toast({ 
              title: 'Payment successful!', 
              description: `Payment of ${formatNaira(amount)} processed successfully`,
            });
            
            setTimeout(() => {
              onSuccess();
            }, 2000);
      },
      onError: (message) => {
            setStep('failed');
        // Error toast is already shown by the hook
        },
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-base sm:text-lg">Secure Payment</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Powered by Paystack</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Payment Steps */}
        {step === 'card' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Order Summary */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl">
              <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Order Summary</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commodity</span>
                  <span className="text-foreground font-medium">{orderDetails.commodity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-foreground font-medium">{orderDetails.quantity}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="text-foreground font-medium truncate ml-2">{orderDetails.farmerName}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-semibold">
                  <span className="text-foreground">Total Amount</span>
                  <span className="text-primary text-base sm:text-lg">{formatNaira(amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-3 sm:space-y-4">
              {!isConfigured && (
                <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 text-farm-warning text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Paystack API key not configured. Payments will not work.</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                  placeholder="your.email@example.com"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-lg sm:rounded-xl text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  A payment receipt will be sent to this email
                </p>
              </div>

              {/* Paystack Branding */}
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg sm:rounded-xl border border-primary/20">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Secured by Paystack</p>
                  <p className="text-xs text-muted-foreground">Your payment information is encrypted and secure</p>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-start gap-2 p-3 bg-farm-success/10 rounded-lg sm:rounded-xl">
                <Shield className="w-4 h-4 text-farm-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Your payment is secured with 256-bit SSL encryption. We never store your card details.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 sm:py-3 bg-muted text-foreground rounded-lg sm:rounded-xl font-medium hover:bg-muted/80 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!email || !email.includes('@') || !isLoaded || !isConfigured || isProcessing}
                className="flex-1 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    Pay {formatNaira(amount)}
                  </>
                )}
              </button>
            </div>

            {/* Payment Methods Info */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Accepted Payment Methods</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Bank Transfer</span>
                </div>
                <span className="text-xs text-muted-foreground">USSD</span>
                <span className="text-xs text-muted-foreground">Bank Account</span>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary animate-spin" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Processing Payment</h3>
            <p className="text-sm text-muted-foreground">Please complete the payment in the popup window...</p>
            {!isConfigured && (
              <div className="mt-4 p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-farm-warning text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Paystack API key not configured</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-farm-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-farm-success" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground">Your payment has been processed successfully</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Payment Failed</h3>
            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Your payment could not be processed</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 sm:py-3 bg-muted text-foreground rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStep('card');
                  setProcessing(false);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
