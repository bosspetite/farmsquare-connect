import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowDownCircle, CreditCard, History, Lock, Plus, TrendingUp, Wallet } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatNaira } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/Modal';
import { usePaystack } from '@/hooks/usePaystack';
import { Transaction, Wallet as WalletType } from '@/types';
import { fundWallet, getWalletByUserId, getWalletTransactions } from '@/services/walletService';

const creditTransactionTypes = new Set(['Credit', 'fund', 'release', 'refund']);

const BuyerWallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initializePayment, isLoaded, isProcessing, isConfigured } = usePaystack();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'history'>('transactions');
  const [email, setEmail] = useState(user?.email || '');

  const loadWallet = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const [walletRow, transactionRows] = await Promise.all([
        getWalletByUserId(user.id),
        getWalletTransactions(user.id),
      ]);
      setWallet(walletRow);
      setTransactions(transactionRows);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load your wallet right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user?.id]);

  const handleFundWallet = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to fund your wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: 'Payment Configuration Error',
        description: 'Paystack is not configured. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    if (!isLoaded) {
      toast({
        title: 'Payment system loading',
        description: 'Please wait a moment and try again',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(fundAmount);

    initializePayment({
      email,
      amount,
      metadata: {
        custom_fields: [
          {
            display_name: 'Transaction Type',
            variable_name: 'transaction_type',
            value: 'Wallet Funding',
          },
        ],
      },
      onSuccess: async (reference) => {
        try {
          await fundWallet(user.id, amount, reference);
          toast({
            title: 'Wallet funded successfully!',
            description: `${formatNaira(amount)} has been added to your wallet`,
          });
          setShowFundModal(false);
          setFundAmount('');
          await loadWallet();
        } catch (error: any) {
          toast({
            title: 'Unable to update wallet',
            description: error?.message || 'Your payment succeeded, but the wallet update failed.',
            variant: 'destructive',
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
          <div className="farm-card">
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </BuyerLayout>
    );
  }

  if (!wallet || loadError) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
          <div className="farm-card bg-destructive/5 border-destructive/20 text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Wallet unavailable</p>
            <p className="text-muted-foreground mb-4">{loadError || 'Wallet not found'}</p>
            <button
              onClick={loadWallet}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  const totalBalance = wallet.available + wallet.pending;
  const recentTransactions = transactions.slice(0, 10);

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your payments and escrow funds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="farm-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNaira(wallet.available)}</p>
            <p className="text-xs text-muted-foreground mt-2">Ready to use</p>
          </div>

          <div className="farm-card bg-gradient-to-br from-farm-warning/10 to-farm-warning/5 border-farm-warning/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">In Escrow</p>
              <Lock className="w-5 h-5 text-farm-warning" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNaira(wallet.pending)}</p>
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

        <div className="flex gap-3">
          <button
            onClick={() => setShowFundModal(true)}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Fund Wallet
          </button>
        </div>

        {wallet.pending > 0 && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-farm-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Escrow Funds</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatNaira(wallet.pending)} is currently held in escrow for pending orders.
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
                  {recentTransactions.map((transaction) => {
                    const isCredit = creditTransactionTypes.has(transaction.type);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isCredit ? 'bg-farm-success/10' : 'bg-destructive/10'
                          }`}>
                            {isCredit ? (
                              <ArrowDownCircle className="w-5 h-5 text-farm-success" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{transaction.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${isCredit ? 'text-farm-success' : 'text-destructive'}`}>
                          {isCredit ? '+' : '-'}{formatNaira(transaction.amount)}
                        </p>
                      </div>
                    );
                  })}
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
                  {transactions.map((transaction) => {
                    const isCredit = creditTransactionTypes.has(transaction.type);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isCredit ? 'bg-farm-success/10' : 'bg-destructive/10'
                          }`}>
                            {isCredit ? (
                              <ArrowDownCircle className="w-5 h-5 text-farm-success" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{transaction.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${isCredit ? 'text-farm-success' : 'text-destructive'}`}>
                          {isCredit ? '+' : '-'}{formatNaira(transaction.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <Modal isOpen={showFundModal} onClose={() => setShowFundModal(false)} title="Fund Wallet">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add funds to your wallet using Paystack. Funds will be available immediately after payment.
            </p>
            {!isConfigured && (
              <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-lg">
                <p className="text-sm text-farm-warning">
                  Paystack API key not configured. Wallet funding will not work.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value.toLowerCase().trim())}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount (₦)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Current balance: {formatNaira(wallet.available)}
              </p>
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
                {isProcessing ? 'Processing...' : 'Fund Wallet'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </BuyerLayout>
  );
};

export default BuyerWallet;
