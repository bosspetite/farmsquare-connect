import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, TrendingUp, ArrowDownCircle, Plus, History, Lock } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletByUserId, getTransactionsByUserId, formatNaira, formatDate, getAppState, fundBuyerWallet } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/Modal';
import { usePaystack } from '@/hooks/usePaystack';

const BuyerWallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initializePayment, isLoaded, isProcessing, isConfigured } = usePaystack();
  const state = getAppState();
  const buyerWallet = user ? getWalletByUserId(user.id) : null;
  const transactions = user ? getTransactionsByUserId(user.id) : [];
  
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'history'>('transactions');
  const [email, setEmail] = useState(user?.email || '');

  const handleFundWallet = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({ 
        title: 'Invalid amount', 
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({ 
        title: 'Authentication required', 
        description: 'Please log in to fund your wallet',
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

    if (!email || !email.includes('@')) {
      toast({ 
        title: 'Invalid email', 
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(fundAmount);

    initializePayment({
      email: email,
      amount: amount,
      metadata: {
        custom_fields: [
          {
            display_name: 'Transaction Type',
            variable_name: 'transaction_type',
            value: 'Wallet Funding',
          },
        ],
      },
      onClose: () => {
        // User closed payment window
      },
      onSuccess: (reference) => {
        // Fund wallet using the store helper
        fundBuyerWallet(user.id, amount, reference);
        
        toast({ 
          title: 'Wallet funded successfully!', 
          description: `${formatNaira(amount)} has been added to your wallet` 
        });
        setShowFundModal(false);
        setFundAmount('');
        // Reload to show updated balance
        setTimeout(() => window.location.reload(), 1000);
      },
      onError: (message) => {
        // Error toast is already shown by the hook
      },
    });
  };

  if (!buyerWallet) {
    return (
      <BuyerLayout>
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Wallet not found</p>
        </div>
      </BuyerLayout>
    );
  }

  const totalBalance = buyerWallet.available + buyerWallet.pending;
  const recentTransactions = transactions.slice(0, 10);

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your payments and escrow funds</p>
        </div>

        {/* Wallet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="farm-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNaira(buyerWallet.available)}</p>
            <p className="text-xs text-muted-foreground mt-2">Ready to use</p>
          </div>

          <div className="farm-card bg-gradient-to-br from-farm-warning/10 to-farm-warning/5 border-farm-warning/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">In Escrow</p>
              <Lock className="w-5 h-5 text-farm-warning" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNaira(buyerWallet.pending)}</p>
            <p className="text-xs text-muted-foreground mt-2">Locked in orders</p>
          </div>

          <div className="farm-card bg-gradient-to-br from-farm-success/10 to-farm-success/5 border-farm-success/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <TrendingUp className="w-5 h-5 text-farm-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNaira(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Available + Escrow</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFundModal(true)}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Fund Wallet
          </button>
        </div>

        {/* Escrow Info */}
        {buyerWallet.pending > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-farm-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Escrow Funds</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatNaira(buyerWallet.pending)} is currently held in escrow for pending orders. 
                  Funds will be released to farmers once you confirm delivery.
                </p>
                <button
                  onClick={() => navigate('/buyer/orders')}
                  className="text-sm text-farm-warning hover:underline font-medium"
                >
                  View Orders →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'text-primary border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recent Transactions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Full History
          </button>
        </div>

        {/* Transactions */}
        <div className="farm-card">
          {activeTab === 'transactions' ? (
            <>
              <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          txn.type === 'Credit' 
                            ? 'bg-farm-success/10' 
                            : 'bg-destructive/10'
                        }`}>
                          {txn.type === 'Credit' ? (
                            <ArrowDownCircle className="w-5 h-5 text-farm-success" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.timestamp)}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        txn.type === 'Credit' ? 'text-farm-success' : 'text-destructive'
                      }`}>
                        {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-semibold text-foreground mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No transaction history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          txn.type === 'Credit' 
                            ? 'bg-farm-success/10' 
                            : 'bg-destructive/10'
                        }`}>
                          {txn.type === 'Credit' ? (
                            <ArrowDownCircle className="w-5 h-5 text-farm-success" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.timestamp)}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        txn.type === 'Credit' ? 'text-farm-success' : 'text-destructive'
                      }`}>
                        {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Fund Wallet Modal */}
        <Modal isOpen={showFundModal} onClose={() => setShowFundModal(false)} title="Fund Wallet">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add funds to your wallet using Paystack. Funds will be available immediately after payment.
            </p>
            {!isConfigured && (
              <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-lg">
                <p className="text-sm text-farm-warning">
                  ⚠️ Paystack API key not configured. Wallet funding will not work.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                A payment receipt will be sent to this email
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount (₦)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {buyerWallet && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Current balance: {formatNaira(buyerWallet.available)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFundModal(false);
                  setFundAmount('');
                }}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWallet}
                disabled={!fundAmount || parseFloat(fundAmount) <= 0 || !email || !email.includes('@') || !isLoaded || !isConfigured || isProcessing}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Fund Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </BuyerLayout>
  );
};

export default BuyerWallet;








