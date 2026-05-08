import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard, DollarSign, TrendingUp, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatNaira, formatDate } from '@/lib/store';
import {
  getAllOrders,
  getAllPayoutRequests,
  getAllTransactions,
  processPayoutRequest,
} from '@/services/adminService';
import { Transaction } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/hooks/use-toast';

const AdminPayments = () => {
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<Awaited<ReturnType<typeof getAllPayoutRequests>>>([]);
  const [deliveredOrdersTotal, setDeliveredOrdersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<(Awaited<ReturnType<typeof getAllPayoutRequests>>)[number] | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [isUpdatingWithdrawal, setIsUpdatingWithdrawal] = useState(false);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [nextTransactions, nextPayouts, orders] = await Promise.all([
        getAllTransactions(),
        getAllPayoutRequests(),
        getAllOrders(),
      ]);

      setTransactions(nextTransactions);
      setPayoutRequests(nextPayouts);
      setDeliveredOrdersTotal(
        orders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + order.amount, 0),
      );
      console.log('[AdminPayments] Loaded payment data', {
        transactions: nextTransactions.length,
        payoutRequests: nextPayouts.length,
      });
    } catch (error) {
      console.error('[AdminPayments] Failed to load payment data', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const pendingWithdrawals = useMemo(
    () => payoutRequests.filter((request) => request.status === 'InReview' || request.status === 'Submitted'),
    [payoutRequests],
  );
  const paidWithdrawals = useMemo(
    () => payoutRequests.filter((request) => request.status === 'Paid'),
    [payoutRequests],
  );
  const rejectedWithdrawals = useMemo(
    () => payoutRequests.filter((request) => request.status === 'Rejected'),
    [payoutRequests],
  );
  const totalWithdrawals = paidWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  const openWithdrawalDetails = (request: (Awaited<ReturnType<typeof getAllPayoutRequests>>)[number]) => {
    setSelectedWithdrawal(request);
    setAdminNote('');
    setShowWithdrawalModal(true);
  };

  const handleProcessWithdrawal = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) {
      return;
    }

    try {
      setIsUpdatingWithdrawal(true);
      await processPayoutRequest({
        payoutRequestId: selectedWithdrawal.id,
        action,
        note: adminNote.trim() || undefined,
      });
      toast({
        title: action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected',
        description: `${selectedWithdrawal.userName}'s request was ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      setShowWithdrawalModal(false);
      setSelectedWithdrawal(null);
      setAdminNote('');
      await loadPayments();
    } catch (error) {
      console.error('[AdminPayments] Failed to process withdrawal', {
        payoutRequestId: selectedWithdrawal.id,
        action,
        error,
      });
      toast({
        title: 'Could not process withdrawal',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingWithdrawal(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const withdrawalIdFromQuery = params.get('withdrawal');

    if (!withdrawalIdFromQuery || payoutRequests.length === 0 || showWithdrawalModal) {
      return;
    }

    const matching = payoutRequests.find((request) => request.id === withdrawalIdFromQuery);
    if (matching) {
      openWithdrawalDetails(matching);
    }
  }, [location.search, payoutRequests, showWithdrawalModal]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Management</h1>
            <p className="text-muted-foreground">Monitor real transactions and payout requests</p>
          </div>
          <button
            onClick={() => void loadPayments()}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <DollarSign className="w-8 h-8 text-farm-success mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(deliveredOrdersTotal)}</p>
            <p className="text-sm text-muted-foreground">Delivered Order Value</p>
          </div>
          <div className="farm-card text-center">
            <CreditCard className="w-8 h-8 text-farm-info mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(totalWithdrawals)}</p>
            <p className="text-sm text-muted-foreground">Paid Out</p>
          </div>
          <div className="farm-card text-center">
            <Clock className="w-8 h-8 text-farm-warning mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{pendingWithdrawals.length}</p>
            <p className="text-sm text-muted-foreground">Pending Payouts</p>
          </div>
          <div className="farm-card text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{transactions.length}</p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="farm-card text-center py-12">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">Could not load payment data</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <button onClick={() => void loadPayments()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {pendingWithdrawals.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-farm-warning" />
                  <h3 className="font-semibold text-foreground">Pending Payout Requests</h3>
                </div>
                <div className="space-y-3">
                  {pendingWithdrawals.map((withdrawal) => (
                    <button
                      key={withdrawal.id}
                      type="button"
                      onClick={() => openWithdrawalDetails(withdrawal)}
                      className="w-full text-left flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-transparent hover:border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{withdrawal.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.bankName} • {withdrawal.accountMasked}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Requested {formatDate(withdrawal.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatNaira(withdrawal.amount)}</p>
                        <span className="px-3 py-1 bg-farm-warning/10 text-farm-warning rounded-lg text-xs font-medium">
                          {withdrawal.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paidWithdrawals.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-farm-success" />
                  <h3 className="font-semibold text-foreground">Recent Paid Payouts</h3>
                </div>
                <div className="space-y-3">
                  {paidWithdrawals.slice(0, 10).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{withdrawal.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.bankName} • {withdrawal.accountMasked}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Paid {formatDate(withdrawal.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatNaira(withdrawal.amount)}</p>
                        <span className="px-3 py-1 bg-farm-success/10 text-farm-success rounded-lg text-xs font-medium">
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rejectedWithdrawals.length > 0 && (
              <div className="farm-card">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-foreground">Rejected Withdrawal Requests</h3>
                </div>
                <div className="space-y-3">
                  {rejectedWithdrawals.slice(0, 10).map((withdrawal) => (
                    <button
                      key={withdrawal.id}
                      type="button"
                      onClick={() => openWithdrawalDetails(withdrawal)}
                      className="w-full text-left flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-transparent hover:border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{withdrawal.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.bankName} • {withdrawal.accountMasked}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Updated {formatDate(withdrawal.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatNaira(withdrawal.amount)}</p>
                        <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-medium">
                          Rejected
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="farm-card">
              <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className={`text-right ${transaction.amount >= 0 ? 'text-farm-success' : 'text-destructive'}`}>
                        <p className="font-semibold">{transaction.amount >= 0 ? '+' : '-'}{formatNaira(Math.abs(transaction.amount))}</p>
                        <p className="text-xs text-muted-foreground">{transaction.status || 'completed'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showWithdrawalModal}
        onClose={() => {
          if (isUpdatingWithdrawal) return;
          setShowWithdrawalModal(false);
          setSelectedWithdrawal(null);
          setAdminNote('');
        }}
        title="Withdrawal Request Details"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Farmer</p>
                <p className="font-medium text-foreground">{selectedWithdrawal.userName}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold text-foreground">{formatNaira(selectedWithdrawal.amount)}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Bank</p>
                <p className="font-medium text-foreground">{selectedWithdrawal.bankName}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Account</p>
                <p className="font-medium text-foreground">{selectedWithdrawal.accountMasked}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">{selectedWithdrawal.status}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-muted-foreground">Requested</p>
                <p className="font-medium text-foreground">{formatDate(selectedWithdrawal.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Admin note (optional)</label>
              <textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Add approval/rejection note"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => void handleProcessWithdrawal('reject')}
                disabled={isUpdatingWithdrawal}
                className="px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                {isUpdatingWithdrawal ? 'Processing...' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => void handleProcessWithdrawal('approve')}
                disabled={isUpdatingWithdrawal}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {isUpdatingWithdrawal ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminPayments;
