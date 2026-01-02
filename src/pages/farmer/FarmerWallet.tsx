import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { WalletCard } from '@/components/ui/WalletCard';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletByUserId, getTransactionsByUserId, getWithdrawalsByUserId, addWithdrawal, getKYCByUserId, formatNaira, formatDate } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const banks = ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA'];

const FarmerWallet = () => {
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions');

  const wallet = user ? getWalletByUserId(user.id) : null;
  const transactions = user ? getTransactionsByUserId(user.id) : [];
  const withdrawals = user ? getWithdrawalsByUserId(user.id) : [];
  const kycData = user ? getKYCByUserId(user.id) : null;
  const isKYCApproved = kycData?.status === 'APPROVED';

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
            className={`flex-1 py-3 rounded-xl font-medium text-sm ${
              tab === 'transactions' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm ${
              tab === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            Withdrawals
          </button>
        </div>

        {/* Transactions List */}
        {tab === 'transactions' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              transactions.map((txn) => (
                <div key={txn.id} className="farm-card flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.type === 'Credit' ? 'bg-farm-success/10' : 'bg-destructive/10'
                  }`}>
                    {txn.type === 'Credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-farm-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{txn.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(txn.createdAt)}</p>
                  </div>
                  <p className={`font-semibold ${txn.type === 'Credit' ? 'text-farm-success' : 'text-destructive'}`}>
                    {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Withdrawals List */}
        {tab === 'withdrawals' && (
          <div className="space-y-2">
            {withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No withdrawals yet</p>
            ) : (
              withdrawals.map((wd) => (
                <div key={wd.id} className="farm-card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{formatNaira(wd.amount)}</p>
                    <p className="text-sm text-muted-foreground">{wd.bankName} · {wd.accountMasked}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(wd.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    wd.status === 'Paid' ? 'bg-farm-success/10 text-farm-success' :
                    wd.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-farm-warning/10 text-farm-warning'
                  }`}>
                    {wd.status}
                  </span>
                </div>
              ))
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
            <button
              onClick={handleWithdraw}
              disabled={!amount || !selectedBank || !isKYCApproved}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Submit Request
            </button>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerWallet;
