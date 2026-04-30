import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Receipt,
  Wallet,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { WalletCard } from '@/components/ui/WalletCard';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatNaira } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Transaction, Wallet as WalletType, Withdrawal } from '@/types';
import { getFarmerOrders } from '@/services/orderService';
import { createPayoutRequest, getPayoutRequests, getWalletByUserId, getWalletTransactions } from '@/services/walletService';

const banks = [
  'GTBank',
  'Access Bank',
  'Zenith Bank',
  'First Bank',
  'UBA',
  'Fidelity Bank',
  'Union Bank',
  'Stanbic IBTC',
  'FCMB',
  'Sterling Bank',
  'Wema Bank',
  'Providus Bank',
  'Kuda Bank',
  'Opay',
  'Palmpay',
  'Moniepoint',
  'Carbon',
  'FairMoney',
];

const creditTransactionTypes = new Set(['Credit', 'fund', 'release', 'refund', 'escrow_release']);

const FarmerWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransactionReceipt, setShowTransactionReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  const isKYCApproved = user?.kycStatus === 'APPROVED';

  const loadWalletData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const [walletRow, transactionRows, payoutRows, farmerOrders] = await Promise.all([
        getWalletByUserId(user.id),
        getWalletTransactions(user.id),
        getPayoutRequests(user.id),
        getFarmerOrders(user.id),
      ]);

      setWallet(walletRow);
      setTransactions(transactionRows);
      setWithdrawals(payoutRows);
      setPendingEarnings(
        farmerOrders
          .filter((order) => ['Paid', 'Accepted', 'Processing', 'InTransit'].includes(order.status))
          .reduce((sum, order) => sum + order.amount, 0)
      );
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load your wallet right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user?.id]);

  const completedPayouts = useMemo(
    () => withdrawals.filter((withdrawal) => withdrawal.status === 'Paid'),
    [withdrawals]
  );

  const totalPayouts = useMemo(
    () => completedPayouts.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
    [completedPayouts]
  );

  const handleWithdraw = async () => {
    if (!user || !amount || !selectedBank) {
      return;
    }

    if (!isKYCApproved) {
      toast({
        title: 'KYC Verification Required',
        description: 'Please complete KYC verification before withdrawing funds.',
        variant: 'destructive',
      });
      setShowWithdrawModal(false);
      return;
    }

    const withdrawAmount = parseInt(amount, 10);
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    if (withdrawAmount > (wallet?.available || 0)) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmittingWithdrawal(true);
      await createPayoutRequest(user.id, withdrawAmount, selectedBank, user.name || 'FarmSquare Farmer');
      setShowWithdrawModal(false);
      setAmount('');
      setSelectedBank('');
      toast({
        title: 'Withdrawal requested',
        description: 'Your payout request has been submitted for review.',
      });
      await loadWalletData();
    } catch (error: any) {
      toast({
        title: 'Unable to submit withdrawal',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  if (isLoading) {
    return (
      <FarmerLayout>
        <div className="space-y-6 animate-fade-up">
          <div className="farm-card">
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </FarmerLayout>
    );
  }

  if (!wallet || loadError) {
    return (
      <FarmerLayout>
        <div className="space-y-6 animate-fade-up">
          <div className="farm-card bg-destructive/5 border-destructive/20 text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Wallet unavailable</p>
            <p className="text-muted-foreground mb-4">{loadError || 'Wallet not found'}</p>
            <button
              onClick={loadWalletData}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>

        <WalletCard
          available={wallet.available || 0}
          pending={wallet.pending || 0}
          onWithdraw={() => {
            if (!isKYCApproved) {
              toast({
                title: 'KYC Verification Required',
                description: 'Please complete KYC verification to withdraw funds.',
                variant: 'destructive',
              });
              return;
            }

            setShowWithdrawModal(true);
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="farm-card bg-farm-info/5 border-farm-info/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-farm-info/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-farm-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Earnings</p>
                <p className="text-lg font-bold text-foreground">{formatNaira(pendingEarnings)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">From active orders</p>
          </div>
          <div className="farm-card bg-farm-success/5 border-farm-success/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-farm-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-farm-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Payouts</p>
                <p className="text-lg font-bold text-foreground">{formatNaira(totalPayouts)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedPayouts.length} withdrawal{completedPayouts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {!isKYCApproved && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-farm-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">KYC Verification Required</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Complete your KYC verification to enable withdrawals.
                </p>
                <button
                  onClick={() => {
                    window.location.href = '/farmer/kyc';
                  }}
                  className="px-4 py-2 bg-farm-warning text-foreground rounded-xl text-sm font-medium"
                >
                  Complete KYC
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setTab('transactions')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
              tab === 'transactions' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
              tab === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {tab === 'transactions' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="farm-card text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Transaction history will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">All Transactions</p>
                  <p className="text-xs text-muted-foreground">{transactions.length} total</p>
                </div>
                {transactions.map((transaction) => {
                  const isCredit = creditTransactionTypes.has(transaction.type);
                  return (
                    <div
                      key={transaction.id}
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowTransactionReceipt(true);
                      }}
                      className="farm-card flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-farm-success/10' : 'bg-destructive/10'
                      }`}>
                        {isCredit ? (
                          <ArrowDownLeft className="w-6 h-6 text-farm-success" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-lg ${isCredit ? 'text-farm-success' : 'text-destructive'}`}>
                          {isCredit ? '+' : '-'}
                          {formatNaira(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="space-y-2">
            {withdrawals.length === 0 ? (
              <div className="farm-card text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No withdrawals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Withdrawal history will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">Withdrawal Requests</p>
                  <p className="text-xs text-muted-foreground">{withdrawals.length} total</p>
                </div>
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="farm-card flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        withdrawal.status === 'Paid'
                          ? 'bg-farm-success/10'
                          : withdrawal.status === 'Rejected'
                            ? 'bg-destructive/10'
                            : 'bg-farm-warning/10'
                      }`}>
                        {withdrawal.status === 'Paid' ? (
                          <CheckCircle className="w-6 h-6 text-farm-success" />
                        ) : withdrawal.status === 'Rejected' ? (
                          <AlertCircle className="w-6 h-6 text-destructive" />
                        ) : (
                          <Clock className="w-6 h-6 text-farm-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{formatNaira(withdrawal.amount)}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {withdrawal.bankName} · {withdrawal.accountMasked}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(withdrawal.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      withdrawal.status === 'Paid'
                        ? 'bg-farm-success/10 text-farm-success'
                        : withdrawal.status === 'Rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : withdrawal.status === 'InReview'
                            ? 'bg-farm-info/10 text-farm-info'
                            : 'bg-farm-warning/10 text-farm-warning'
                    }`}>
                      {withdrawal.status === 'InReview' ? 'In Review' : withdrawal.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Request Withdrawal" className="pb-safe">
          <div className="space-y-4 pb-24 sm:pb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">Available: {formatNaira(wallet.available || 0)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bank</label>
              <select
                value={selectedBank}
                onChange={(event) => setSelectedBank(event.target.value)}
                className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] text-base"
              >
                <option value="">Select bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Account details are confirmed during payout review for now.
              </p>
            </div>
            {!isKYCApproved && (
              <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-xl">
                <p className="text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  KYC verification required to withdraw funds.
                </p>
              </div>
            )}
            <div className="sticky bottom-0 pt-4 pb-2 bg-card -mx-6 px-6 border-t border-border mt-6">
              <button
                onClick={handleWithdraw}
                disabled={!amount || !selectedBank || !isKYCApproved || isSubmittingWithdrawal}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity active:scale-[0.98] shadow-lg"
              >
                {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showTransactionReceipt}
          onClose={() => {
            setShowTransactionReceipt(false);
            setSelectedTransaction(null);
          }}
          title="Transaction Receipt"
          className="max-w-md"
        >
          {selectedTransaction && (
            <div className="space-y-6 pb-4">
              <div className="text-center pb-4 border-b border-border">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  creditTransactionTypes.has(selectedTransaction.type) ? 'bg-farm-success/10' : 'bg-destructive/10'
                }`}>
                  {creditTransactionTypes.has(selectedTransaction.type) ? (
                    <ArrowDownLeft className="w-8 h-8 text-farm-success" />
                  ) : (
                    <ArrowUpRight className="w-8 h-8 text-destructive" />
                  )}
                </div>
                <p
                  className={`text-3xl font-bold mb-2 ${
                    creditTransactionTypes.has(selectedTransaction.type) ? 'text-farm-success' : 'text-destructive'
                  }`}
                >
                  {creditTransactionTypes.has(selectedTransaction.type) ? '+' : '-'}
                  {formatNaira(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.title}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-foreground">{selectedTransaction.id}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTransaction.id);
                        toast({ title: 'Transaction ID copied' });
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Copy transaction ID"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      creditTransactionTypes.has(selectedTransaction.type)
                        ? 'bg-farm-success/10 text-farm-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {creditTransactionTypes.has(selectedTransaction.type) ? 'Credit' : 'Debit'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Date & Time</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(selectedTransaction.createdAt).toLocaleString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-farm-success" />
                    <span className="text-sm font-medium text-farm-success">Completed</span>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Receipt className="w-4 h-4" />
                  <span>FarmSquare Transaction Receipt</span>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  This is a digital receipt for your records
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const receiptText = `Transaction Receipt\n\nAmount: ${formatNaira(selectedTransaction.amount)}\nType: ${
                      creditTransactionTypes.has(selectedTransaction.type) ? 'Credit' : 'Debit'
                    }\nDescription: ${selectedTransaction.title}\nTransaction ID: ${
                      selectedTransaction.id
                    }\nDate: ${new Date(selectedTransaction.createdAt).toLocaleString()}\nStatus: Completed`;
                    navigator.clipboard.writeText(receiptText);
                    toast({ title: 'Receipt copied to clipboard' });
                  }}
                  className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Receipt
                </button>
                <button
                  onClick={() => {
                    setShowTransactionReceipt(false);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerWallet;
