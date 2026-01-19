import { useState } from 'react';
import { CreditCard, Lock, CheckCircle, X, Loader2, Shield } from 'lucide-react';
import { formatNaira, getAppState, setAppState, addTransaction } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const [step, setStep] = useState<'card' | 'processing' | 'success' | 'failed'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !cardName) {
      toast({ 
        title: 'Incomplete payment details', 
        description: 'Please fill all payment fields',
        variant: 'destructive'
      });
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast({ 
        title: 'Invalid card number', 
        description: 'Please enter a valid 16-digit card number',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    setStep('processing');

    // Simulate payment gateway processing (2-4 seconds for realism)
    const processingTime = 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate 90% success rate (realistic payment gateway)
    const success = Math.random() > 0.1;

    if (success) {
      // Fund wallet with payment amount
      if (user) {
        const state = getAppState();
        let buyerWallet = state.wallets.find(w => w.userId === user.id);
        
        if (!buyerWallet) {
          buyerWallet = {
            userId: user.id,
            available: 0,
            pending: 0,
            currency: '₦',
          };
          state.wallets.push(buyerWallet);
        }
        
        // Add payment to wallet available balance
        buyerWallet.available += amount;
        
        // Add transaction record
        addTransaction(user.id, 'Credit', `Payment for ${orderDetails.commodity} order`, amount);
        
        setAppState(state);
      }
      
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setStep('failed');
      setProcessing(false);
      toast({ 
        title: 'Payment failed', 
        description: 'Your payment could not be processed. Please try again or use a different card.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">Secure Payment</h2>
              <p className="text-xs text-muted-foreground">Powered by FarmSquare Pay</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Payment Steps */}
        {step === 'card' && (
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
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
                  <span className="text-foreground font-medium">{orderDetails.farmerName}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-semibold">
                  <span className="text-foreground">Total Amount</span>
                  <span className="text-primary text-lg">{formatNaira(amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 p-3 bg-farm-success/10 rounded-xl">
                <Shield className="w-4 h-4 text-farm-success" />
                <p className="text-xs text-muted-foreground">
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Pay {formatNaira(amount)}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Processing Payment</h3>
            <p className="text-sm text-muted-foreground">Please wait while we process your payment...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-farm-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-farm-success" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground">Your payment has been processed successfully</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Payment Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">Your payment could not be processed</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('card')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
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



