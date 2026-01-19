import { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, AlertCircle, Clock, CheckCircle, DollarSign, Copy, Receipt, X } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { WalletCard } from '@/components/ui/WalletCard';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletByUserId, getTransactionsByUserId, getWithdrawalsByUserId, addWithdrawal, getKYCByUserId, getOrdersByFarmerId, formatNaira, formatDate } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/types';

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

const FarmerWallet = () => {
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const wallet = user ? getWalletByUserId(user.id) : null;
  const transactions = user ? getTransactionsByUserId(user.id) : [];
  const withdrawals = user ? getWithdrawalsByUserId(user.id) : [];
  const orders = user ? getOrdersByFarmerId(user.id) : [];
  const [kycData, setKycData] = useState(user ? getKYCByUserId(user.id) : null);
  const isKYCApproved = kycData?.status === 'APPROVED';
  
  // Calculate pending earnings from orders
  const pendingEarnings = orders
    .filter(o => ['Accepted', 'Processing', 'PickupScheduled', 'InTransit'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);
  
  // Completed payouts (withdrawals that are paid)
  const completedPayouts = withdrawals.filter(w => w.status === 'Paid');
  const totalPayouts = completedPayouts.reduce((sum, w) => sum + w.amount, 0);

  // Refresh KYC data
  useEffect(() => {
    if (user) {
      const data = getKYCByUserId(user.id);
      setKycData(data);
    }
  }, [user]);

  const handleWithdraw = () => {
    if (!user || !amount || !selectedBank) return;
    
    // Check KYC status
    if (!isKYCApproved) {
      toast({ 
        title: 'KYC Verification Required', 
        description: 'Please complete KYC verification before withdrawing funds.',
        variant: 'destructive' 
      });
      setShowWithdrawModal(false);
      return;
    }
    
    const withdrawAmount = parseInt(amount);
    if (withdrawAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    
    if (withdrawAmount > (wallet?.available || 0)) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    
    addWithdrawal(user.id, withdrawAmount, selectedBank, '****' + Math.floor(1000 + Math.random() * 9000));
    setShowWithdrawModal(false);
    setAmount('');
    setSelectedBank('');
    toast({ title: 'Withdrawal requested' });
    window.location.reload();
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>

        {/* Wallet Card */}
        <WalletCard
          available={wallet?.available || 0}
          pending={wallet?.pending || 0}
          onWithdraw={() => {
            if (!isKYCApproved) {
              toast({ 
                title: 'KYC Verification Required', 
                description: 'Please complete KYC verification to withdraw funds.',
                variant: 'destructive' 
              });
            } else {
              setShowWithdrawModal(true);
            }
          }}
        />
        
        {/* Pending Earnings & Completed Payouts Summary */}
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
            <p className="text-xs text-muted-foreground">{completedPayouts.length} withdrawal{completedPayouts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* KYC Warning */}
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
                  onClick={() => window.location.href = '/farmer/kyc'}
                  className="px-4 py-2 bg-farm-warning text-foreground rounded-xl text-sm font-medium"
                >
                  Complete KYC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
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

        {/* Transactions List */}
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
                {transactions.map((txn) => (
                  <div 
                    key={txn.id} 
                    onClick={() => setSelectedTransaction(txn)}
                    className="farm-card flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      txn.type === 'Credit' ? 'bg-farm-success/10' : 'bg-destructive/10'
                    }`}>
                      {txn.type === 'Credit' ? (
                        <ArrowDownLeft className="w-6 h-6 text-farm-success" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{txn.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${txn.type === 'Credit' ? 'text-farm-success' : 'text-destructive'}`}>
                        {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Withdrawals List */}
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
                {withdrawals.map((wd) => (
                  <div key={wd.id} className="farm-card flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        wd.status === 'Paid' ? 'bg-farm-success/10' :
                        wd.status === 'Rejected' ? 'bg-destructive/10' :
                        'bg-farm-warning/10'
                      }`}>
                        {wd.status === 'Paid' ? (
                          <CheckCircle className="w-6 h-6 text-farm-success" />
                        ) : wd.status === 'Rejected' ? (
                          <AlertCircle className="w-6 h-6 text-destructive" />
                        ) : (
                          <Clock className="w-6 h-6 text-farm-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{formatNaira(wd.amount)}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{wd.bankName} · {wd.accountMasked}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(wd.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      wd.status === 'Paid' ? 'bg-farm-success/10 text-farm-success' :
                      wd.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                      wd.status === 'InReview' ? 'bg-farm-info/10 text-farm-info' :
                      'bg-farm-warning/10 text-farm-warning'
                    }`}>
                      {wd.status === 'InReview' ? 'In Review' : wd.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Withdraw Modal */}
        <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Request Withdrawal">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Available: {formatNaira(wallet?.available || 0)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              >
                <option value="">Select bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            {!isKYCApproved && (
              <div className="p-3 bg-farm-warning/10 border border-farm-warning/20 rounded-xl">
                <p className="text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  KYC verification required to withdraw funds.
                </p>
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={handleWithdraw}
                disabled={!amount || !selectedBank || !isKYCApproved}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Submit Request
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerWallet;
