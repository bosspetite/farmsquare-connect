import { Dispute, Escrow, Listing, Order, Transaction, User, UserRole } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { approveKyc, getKycRecordByUserId, getPendingKycRecords, rejectKyc, updateKycReviewStatus } from '@/services/kycService';
import { getAccessibleOrders } from '@/services/orderService';
import { clearProfileCache, getProfileById } from '@/services/profileService';

interface ProfileListRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  kyc_status: User['kycStatus'];
  kyb_status: User['kycStatus'];
  state: string | null;
  created_at: string;
}

interface ListingRow {
  id: string;
  farmer_id: string;
  commodity: Listing['commodity'];
  grade: Listing['grade'];
  quantity_kg: number;
  price_per_kg: number;
  min_order_kg: number | null;
  location_label: string;
  region: string;
  status: Listing['status'];
  description: string | null;
  created_at: string;
}

interface ListingPhotoRow {
  listing_id: string;
  photo_url: string;
}

interface WalletTransactionRow {
  id: string;
  wallet_id: string;
  order_id: string | null;
  type: Transaction['type'];
  title: string;
  amount: number;
  status: Transaction['status'] | null;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface EscrowRow {
  id: string;
  order_id: string;
  buyer_id: string;
  farmer_id: string;
  amount: number;
  commission: number;
  farmer_amount: number;
  status: Escrow['status'];
  created_at: string;
  released_at: string | null;
  refunded_at: string | null;
}

interface PayoutRequestRow {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: 'Submitted' | 'InReview' | 'Paid' | 'Rejected';
  created_at: string;
}

interface DisputeRow {
  id: string;
  order_id: string;
  raised_by: string;
  raised_by_role: 'buyer' | 'farmer';
  type: Dispute['type'];
  status: Dispute['status'];
  title: string;
  description: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  outcome: 'buyer_favor' | 'farmer_favor' | 'partial' | 'dismissed' | null;
  created_at: string;
  updated_at: string;
}

interface DisputeEvidenceRow {
  dispute_id: string;
  photo_url: string;
  notes: string | null;
}

export interface AdminUserSummary extends User {
  email?: string;
  listingCount: number;
  orderCount: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  totalAgents: number;
  totalAdmins: number;
  activeListings: number;
  totalOrders: number;
  completedTrades: number;
  totalTradeVolume: number;
  pendingKycCount: number;
}

export interface AdminPayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankName: string;
  accountMasked: string;
  status: 'Submitted' | 'InReview' | 'Paid' | 'Rejected';
  createdAt: string;
}

export interface PendingKycSubmission {
  user: AdminUserSummary;
  kyc: Awaited<ReturnType<typeof getKycRecordByUserId>>;
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required for admin data.');
  }

  return getSupabaseClient();
};

const normalizeStatus = (status: User['kycStatus']) => (status === 'IN_REVIEW' ? 'PENDING' : status);

const mapProfileToAdminUser = (
  profile: ProfileListRow,
  listingCount: number,
  orderCount: number
): AdminUserSummary => ({
  id: profile.id,
  name: profile.full_name,
  email: profile.email || undefined,
  phone: profile.phone,
  role: profile.role,
  region: profile.state || 'Lagos',
  kycStatus: normalizeStatus(profile.role === 'buyer' ? profile.kyb_status : profile.kyc_status),
  createdAt: profile.created_at,
  listingCount,
  orderCount,
});

const getListingPhotoMap = async (listingIds: string[]) => {
  if (listingIds.length === 0) {
    return new Map<string, string[]>();
  }

  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('listing_photos')
    .select('listing_id, photo_url')
    .in('listing_id', listingIds);

  if (error) {
    throw error;
  }

  const photoMap = new Map<string, string[]>();
  for (const photo of (data || []) as ListingPhotoRow[]) {
    const current = photoMap.get(photo.listing_id) || [];
    current.push(photo.photo_url);
    photoMap.set(photo.listing_id, current);
  }

  return photoMap;
};

export const getAllUsers = async (): Promise<AdminUserSummary[]> => {
  const supabase = ensureSupabase();
  const [{ data: profiles, error: profileError }, { data: listings, error: listingError }, { data: orders, error: orderError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, kyc_status, kyb_status, state, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('listings').select('farmer_id').is('deleted_at', null),
      supabase.from('orders').select('buyer_id, farmer_id').is('deleted_at', null),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (listingError) {
    throw listingError;
  }

  if (orderError) {
    throw orderError;
  }

  const listingCountByFarmer = new Map<string, number>();
  for (const listing of listings || []) {
    const key = listing.farmer_id as string;
    listingCountByFarmer.set(key, (listingCountByFarmer.get(key) || 0) + 1);
  }

  const orderCountByUser = new Map<string, number>();
  for (const order of orders || []) {
    const farmerId = order.farmer_id as string;
    const buyerId = order.buyer_id as string;
    orderCountByUser.set(farmerId, (orderCountByUser.get(farmerId) || 0) + 1);
    orderCountByUser.set(buyerId, (orderCountByUser.get(buyerId) || 0) + 1);
  }

  return ((profiles || []) as ProfileListRow[]).map((profile) =>
    mapProfileToAdminUser(profile, listingCountByFarmer.get(profile.id) || 0, orderCountByUser.get(profile.id) || 0)
  );
};

export const getUserById = async (userId: string): Promise<AdminUserSummary | null> => {
  const users = await getAllUsers();
  return users.find((user) => user.id === userId) || null;
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const supabase = ensureSupabase();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);

  if (error) {
    throw error;
  }

  clearProfileCache(userId);
};

export const updateKycStatus = async (userId: string, status: User['kycStatus'], notes?: string) => {
  return updateKycReviewStatus(userId, normalizeStatus(status), notes);
};

export const getAdminStats = async (): Promise<AdminDashboardStats> => {
  const [users, listings, orders, pendingKyc] = await Promise.all([
    getAllUsers(),
    getAllListings(),
    getAllOrders(),
    getPendingKycSubmissions(),
  ]);

  return {
    totalUsers: users.length,
    totalFarmers: users.filter((user) => user.role === 'farmer').length,
    totalBuyers: users.filter((user) => user.role === 'buyer').length,
    totalAgents: users.filter((user) => user.role === 'agent').length,
    totalAdmins: users.filter((user) => user.role === 'admin').length,
    activeListings: listings.filter((listing) => listing.status === 'Active').length,
    totalOrders: orders.length,
    completedTrades: orders.filter((order) => order.status === 'Delivered').length,
    totalTradeVolume: orders
      .filter((order) => order.status === 'Delivered')
      .reduce((sum, order) => sum + order.amount, 0),
    pendingKycCount: pendingKyc.length,
  };
};

export const getAdminDashboardStats = async () => getAdminStats();

export const getAllListings = async (): Promise<Listing[]> => {
  const supabase = ensureSupabase();
  const [{ data: listingRows, error: listingError }, { data: profiles, error: profileError }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, farmer_id, commodity, grade, quantity_kg, price_per_kg, min_order_kg, location_label, region, status, description, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name'),
  ]);

  if (listingError) {
    throw listingError;
  }

  if (profileError) {
    throw profileError;
  }

  const farmerNameById = new Map<string, string>();
  for (const profile of profiles || []) {
    farmerNameById.set(profile.id as string, profile.full_name as string);
  }

  const typedRows = (listingRows || []) as ListingRow[];
  const photoMap = await getListingPhotoMap(typedRows.map((listing) => listing.id));

  return typedRows.map((listing) => ({
    id: listing.id,
    farmerId: listing.farmer_id,
    farmerName: farmerNameById.get(listing.farmer_id) || 'Farmer',
    commodity: listing.commodity,
    grade: listing.grade,
    quantityKg: Number(listing.quantity_kg || 0),
    pricePerKg: Number(listing.price_per_kg || 0),
    minOrderKg: listing.min_order_kg ? Number(listing.min_order_kg) : undefined,
    photos: photoMap.get(listing.id) || [],
    locationLabel: listing.location_label,
    region: listing.region,
    status: listing.status,
    description: listing.description || undefined,
    createdAt: listing.created_at,
  }));
};

export const getAllOrders = async (): Promise<Order[]> => {
  return getAccessibleOrders();
};

export const getAllEscrows = async (): Promise<Escrow[]> => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('escrows')
    .select('id, order_id, buyer_id, farmer_id, amount, commission, farmer_amount, status, created_at, released_at, refunded_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as EscrowRow[]).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    buyerId: row.buyer_id,
    farmerId: row.farmer_id,
    amount: Number(row.amount || 0),
    commission: Number(row.commission || 0),
    farmerAmount: Number(row.farmer_amount || 0),
    status: row.status,
    createdAt: row.created_at,
    releasedAt: row.released_at || undefined,
    refundedAt: row.refunded_at || undefined,
  }));
};

export const getAllDisputes = async () => {
  const supabase = ensureSupabase();
  const [{ data: disputes, error: disputeError }, { data: evidenceRows, error: evidenceError }, users, orders] = await Promise.all([
    supabase.from('disputes').select('id, order_id, raised_by, raised_by_role, type, status, title, description, resolved_by, resolved_at, resolution, outcome, created_at, updated_at').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('dispute_evidence').select('dispute_id, photo_url, notes'),
    getAllUsers(),
    getAllOrders(),
  ]);

  if (disputeError) {
    throw disputeError;
  }

  if (evidenceError) {
    throw evidenceError;
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const evidenceMap = new Map<string, DisputeEvidenceRow[]>();

  for (const evidence of (evidenceRows || []) as DisputeEvidenceRow[]) {
    const current = evidenceMap.get(evidence.dispute_id) || [];
    current.push(evidence);
    evidenceMap.set(evidence.dispute_id, current);
  }

  return ((disputes || []) as DisputeRow[]).map((dispute) => {
    const raisedByUser = userMap.get(dispute.raised_by);
    const relatedOrder = orderMap.get(dispute.order_id);
    const disputeEvidence = evidenceMap.get(dispute.id) || [];
    const combinedNotes = disputeEvidence.map((item) => item.notes).filter(Boolean).join('\n');

    return {
      id: dispute.id,
      orderId: dispute.order_id,
      raisedBy: dispute.raised_by,
      raisedByName: raisedByUser?.name || relatedOrder?.buyerName || relatedOrder?.farmerName || 'User',
      raisedByRole: dispute.raised_by_role,
      type: dispute.type,
      status: dispute.status,
      title: dispute.title,
      description: dispute.description,
      evidence: disputeEvidence.length > 0
        ? {
            photos: disputeEvidence.map((item) => item.photo_url),
            notes: combinedNotes,
          }
        : undefined,
      resolution: dispute.resolution && dispute.resolved_at && dispute.resolved_by
        ? {
            resolvedBy: dispute.resolved_by,
            resolvedAt: dispute.resolved_at,
            resolution: dispute.resolution,
            outcome: dispute.outcome || 'dismissed',
          }
        : undefined,
      createdAt: dispute.created_at,
      updatedAt: dispute.updated_at,
    } satisfies Dispute;
  });
};

export const resolveDispute = async (
  disputeId: string,
  adminId: string,
  resolution: string,
  outcome: NonNullable<Dispute['resolution']>['outcome']
) => {
  const supabase = ensureSupabase();
  const { error } = await supabase
    .from('disputes')
    .update({
      status: 'Resolved',
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
      resolution,
      outcome,
    })
    .eq('id', disputeId);

  if (error) {
    throw error;
  }
};

export const closeDispute = async (disputeId: string) => {
  const supabase = ensureSupabase();
  const { error } = await supabase
    .from('disputes')
    .update({
      status: 'Closed',
    })
    .eq('id', disputeId);

  if (error) {
    throw error;
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const supabase = ensureSupabase();
  const [{ data: transactions, error: transactionError }, { data: wallets, error: walletError }] = await Promise.all([
    supabase
      .from('wallet_transactions')
      .select('id, wallet_id, order_id, type, title, amount, status, reference, metadata, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('wallets').select('id, user_id'),
  ]);

  if (transactionError) {
    throw transactionError;
  }

  if (walletError) {
    throw walletError;
  }

  const walletOwnerById = new Map<string, string>();
  for (const wallet of wallets || []) {
    walletOwnerById.set(wallet.id as string, wallet.user_id as string);
  }

  return ((transactions || []) as WalletTransactionRow[]).map((transaction) => ({
    id: transaction.id,
    userId: walletOwnerById.get(transaction.wallet_id) || '',
    type: transaction.type,
    title: transaction.title,
    amount: Number(transaction.amount || 0),
    createdAt: transaction.created_at,
    status: transaction.status || 'completed',
    reference: transaction.reference || undefined,
    orderId: transaction.order_id || undefined,
    metadata: transaction.metadata || undefined,
  }));
};

export const getAllPayoutRequests = async (): Promise<AdminPayoutRequest[]> => {
  const supabase = ensureSupabase();
  const [{ data: payoutRows, error: payoutError }, users] = await Promise.all([
    supabase
      .from('payout_requests')
      .select('id, user_id, amount, bank_name, account_number, status, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    getAllUsers(),
  ]);

  if (payoutError) {
    throw payoutError;
  }

  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  return ((payoutRows || []) as PayoutRequestRow[]).map((request) => ({
    id: request.id,
    userId: request.user_id,
    userName: userNameById.get(request.user_id) || 'Farmer',
    amount: Number(request.amount || 0),
    bankName: request.bank_name,
    accountMasked: request.account_number === 'pending_collection' ? 'Account details pending' : request.account_number,
    status: request.status,
    createdAt: request.created_at,
  }));
};

export const getKycReviewByUserId = async (userId: string) => {
  const [user, kyc] = await Promise.all([getUserById(userId), getKycRecordByUserId(userId)]);

  if (!user) {
    return null;
  }

  return {
    user,
    kyc,
  };
};

export const getPendingKycReviews = async () => {
  const users = await getAllUsers();
  return users.filter((user) => user.kycStatus === 'PENDING');
};

export const getPendingKycSubmissions = async (): Promise<PendingKycSubmission[]> => {
  const users = await getAllUsers();
  let records: Awaited<ReturnType<typeof getPendingKycRecords>> = [];

  try {
    records = await getPendingKycRecords();
  } catch (error) {
    console.warn('[AdminService] Falling back to profile-based pending KYC state', error);
    return users
      .filter((user) => user.kycStatus === 'PENDING' || user.kycStatus === 'IN_REVIEW')
      .map((user) => ({
        user,
        kyc: {
          userId: user.id,
          userRole: user.role,
          status: user.kycStatus === 'IN_REVIEW' ? 'PENDING' : user.kycStatus,
        },
      }));
  }

  const userMap = new Map(users.map((user) => [user.id, user]));

  return records
    .map((record) => ({
      user: userMap.get(record.userId),
      kyc: record,
    }))
    .filter((submission): submission is PendingKycSubmission => Boolean(submission.user));
};

export const approveKycSubmission = async (recordId: string, adminId: string) => approveKyc(recordId, adminId);

export const rejectKycSubmission = async (recordId: string, adminId: string, reason: string) =>
  rejectKyc(recordId, adminId, reason);

export const refreshAdminUser = async (userId: string) => {
  clearProfileCache(userId);
  return getProfileById(userId);
};
