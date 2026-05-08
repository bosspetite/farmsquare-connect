import { Transaction, Wallet, Withdrawal } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  addWithdrawal as addLocalWithdrawal,
  fundBuyerWallet,
  getAppState,
  getTransactionsByUserId as getLocalTransactionsByUserId,
  getWalletByUserId as getLocalWalletByUserId,
  getWithdrawalsByUserId as getLocalWithdrawalsByUserId,
  setAppState,
} from '@/lib/store';
import { createNotification } from '@/services/notificationService';

interface WalletRow {
  id: string;
  user_id: string;
  available: number;
  pending: number;
  locked: number;
  withdrawn: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface WalletTransactionRow {
  id: string;
  order_id: string | null;
  type: Transaction['type'];
  title: string;
  amount: number;
  status: Transaction['status'] | null;
  reference: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface PayoutRequestRow {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: Withdrawal['status'];
  created_at: string;
}

const mapWallet = (row: WalletRow): Wallet => ({
  userId: row.user_id,
  available: Number(row.available || 0),
  pending: Number(row.pending || 0),
  locked: Number(row.locked || 0),
  withdrawn: Number(row.withdrawn || 0),
  currency: row.currency || '₦',
});

const mapTransaction = (row: WalletTransactionRow): Transaction => ({
  id: row.id,
  userId: '',
  type: row.type,
  title: row.title,
  amount: Number(row.amount || 0),
  createdAt: row.created_at,
  status: row.status || 'completed',
  reference: row.reference || undefined,
  orderId: row.order_id || undefined,
  metadata: row.metadata || undefined,
});

const ensureLocalWallet = (userId: string): Wallet => {
  const state = getAppState();
  const existingWallet = state.wallets.find((wallet) => wallet.userId === userId);
  if (existingWallet) {
    return existingWallet;
  }

  const wallet: Wallet = {
    userId,
    available: 0,
    pending: 0,
    locked: 0,
    withdrawn: 0,
    currency: '₦',
  };

  state.wallets.push(wallet);
  setAppState(state);
  return wallet;
};

const getWalletRow = async (userId: string): Promise<WalletRow | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wallets')
    .select('id, user_id, available, pending, locked, withdrawn, currency, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const ensureWalletExists = async (userId: string): Promise<Wallet | null> => {
  if (!isSupabaseConfigured) {
    return ensureLocalWallet(userId);
  }

  const existing = await getWalletRow(userId);
  if (existing) {
    return mapWallet(existing);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId })
    .select('id, user_id, available, pending, locked, withdrawn, currency, created_at, updated_at')
    .single();

  if (error) {
    const retryWallet = await getWalletRow(userId);
    if (retryWallet) {
      return mapWallet(retryWallet);
    }

    throw error;
  }

  return mapWallet(data);
};

export const getWalletByUserId = async (userId: string): Promise<Wallet | null> => {
  if (!isSupabaseConfigured) {
    return getLocalWalletByUserId(userId) || null;
  }

  const wallet = await getWalletRow(userId);
  return wallet ? mapWallet(wallet) : null;
};

export const getCurrentWallet = async (): Promise<Wallet | null> => {
  if (!isSupabaseConfigured) {
    const currentUser = getAppState().currentUser;
    return currentUser ? ensureLocalWallet(currentUser.id) : null;
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const user = session?.user ?? null;
  if (!user) {
    return null;
  }

  return getWalletByUserId(user.id);
};

export const getWalletTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!isSupabaseConfigured) {
    return getLocalTransactionsByUserId(userId);
  }

  const wallet = await getWalletRow(userId);
  if (!wallet) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, order_id, type, title, amount, status, reference, metadata, created_at')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    ...mapTransaction(row),
    userId,
  }));
};

export const fundWallet = async (userId: string, amount: number, reference: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    fundBuyerWallet(userId, amount, reference);
    return;
  }

  const wallet = await ensureWalletExists(userId);
  if (!wallet) {
    throw new Error('Wallet could not be created for this user.');
  }

  const walletRow = await getWalletRow(userId);
  if (!walletRow) {
    throw new Error('Wallet record could not be loaded.');
  }

  const supabase = getSupabaseClient();
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      available: walletRow.available + amount,
    })
    .eq('id', walletRow.id);

  if (updateError) {
    throw updateError;
  }

  const { error: transactionError } = await supabase.from('wallet_transactions').insert({
    wallet_id: walletRow.id,
    type: 'fund',
    title: 'Wallet funding via Paystack',
    amount,
    status: 'completed',
    reference,
  });

  if (transactionError) {
    throw transactionError;
  }

  try {
    await createNotification({
      recipientUserId: userId,
      type: 'wallet_funded',
      title: 'Wallet funded successfully',
      message: `${amount.toLocaleString()} NGN has been added to your wallet.`,
      entityType: 'wallet',
      entityId: userId,
    });
  } catch (notificationError) {
    console.error('[walletService] Failed to create wallet funding notification', notificationError);
  }
};

export const getPayoutRequests = async (userId: string): Promise<Withdrawal[]> => {
  if (!isSupabaseConfigured) {
    return getLocalWithdrawalsByUserId(userId);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('payout_requests')
    .select('id, amount, bank_name, account_number, status, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as PayoutRequestRow[]).map((request) => ({
    id: request.id,
    userId,
    amount: Number(request.amount || 0),
    bankName: request.bank_name,
    accountMasked: request.account_number === 'pending_collection' ? 'Account details pending' : request.account_number,
    status: request.status,
    createdAt: request.created_at,
  }));
};

export const createPayoutRequest = async (
  userId: string,
  amount: number,
  bankName: string,
  accountName: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    addLocalWithdrawal(userId, amount, bankName, 'Account details pending');
    return;
  }

  const walletRow = await getWalletRow(userId);
  if (!walletRow) {
    throw new Error('Wallet not found for this user.');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('payout_requests').insert({
    user_id: userId,
    wallet_id: walletRow.id,
    amount,
    bank_name: bankName,
    account_number: 'pending_collection',
    account_name: accountName,
    status: 'Submitted',
  });

  if (error) {
    throw error;
  }

  try {
    await Promise.allSettled([
      createNotification({
        recipientUserId: userId,
        type: 'withdrawal_requested',
        title: 'Withdrawal request submitted',
        message: `${amount.toLocaleString()} NGN withdrawal request is now in review.`,
        entityType: 'wallet',
        entityId: userId,
      }),
      createNotification({
        recipientRole: 'admin',
        type: 'withdrawal_requested',
        title: 'New withdrawal request',
        message: `A farmer submitted a withdrawal request of ${amount.toLocaleString()} NGN via ${bankName}.`,
        entityType: 'wallet',
        entityId: userId,
      }),
    ]);
  } catch (notificationError) {
    console.error('[walletService] Failed to create withdrawal notifications', notificationError);
  }
};
