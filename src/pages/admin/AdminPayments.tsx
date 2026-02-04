import React from 'react';
import { CreditCard, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatNaira, formatDate } from '@/lib/store';

const AdminPayments = () => {
  const state = getAppState();
  const transactions = state.transactions;
  const withdrawals = state.withdrawals;
  const orders = (state.orders || []).filter(o => o.status === 'Delivered');
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === 'Paid').reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'InReview' || w.status === 'Submitted');
  const paidWithdrawals = withdrawals.filter(w => w.status === 'Paid');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Management</h1>
          <p className="text-muted-foreground">Monitor transactions and withdrawal requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <DollarSign className="w-8 h-8 text-farm-success mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <div className="farm-card text-center">
            <CreditCard className="w-8 h-8 text-farm-info mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{formatNaira(totalWithdrawals)}</p>
            <p className="text-sm text-muted-foreground">Paid Out</p>
          </div>
          <div className="farm-card text-center">
            <Clock className="w-8 h-8 text-farm-warning mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{pendingWithdrawals.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="farm-card text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">{transactions.length}</p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
        </div>

        {/* Pending Withdrawals */}
        {pendingWithdrawals.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-farm-warning" />
              <h3 className="font-semibold text-foreground">Pending Withdrawal Requests</h3>
            </div>
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{formatNaira(withdrawal.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.bankName} • {withdrawal.accountMasked}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-farm-warning/10 text-farm-warning rounded-lg text-xs font-medium">
                      {withdrawal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Paid Withdrawals */}
        {paidWithdrawals.length > 0 && (
          <div className="farm-card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-farm-success" />
              <h3 className="font-semibold text-foreground">Recent Paid Withdrawals</h3>
            </div>
            <div className="space-y-3">
              {paidWithdrawals.slice(0, 10).map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-farm-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{formatNaira(withdrawal.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.bankName} • {withdrawal.accountMasked}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-farm-success/10 text-farm-success rounded-lg text-xs font-medium">
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      txn.type === 'Credit' ? 'bg-farm-success/10' : 'bg-destructive/10'
                    }`}>
                      {txn.type === 'Credit' ? (
                        <TrendingUp className="w-6 h-6 text-farm-success" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{txn.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-right ${txn.type === 'Credit' ? 'text-farm-success' : 'text-destructive'}`}>
                    <p className="font-semibold">
                      {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;



