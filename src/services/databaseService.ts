/**
 * Database Service – Supabase CRUD operations
 *
 * Provides functions that mirror the localStorage store.ts helpers
 * but read/write to Supabase PostgreSQL via the JS client.
 *
 * Each function gracefully falls back to returning null/empty on error
 * so the UI never crashes.
 */

import { supabase } from '@/lib/supabase';

// ════════════════════════════════════════════════════════════════════
// TYPES (map Supabase rows → frontend-friendly shapes)
// ════════════════════════════════════════════════════════════════════

export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: string;
  kyc_status: string;
  kyb_status: string;
  address: string | null;
  state: string | null;
  lga: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingRow {
  id: string;
  farmer_id: string;
  commodity: string;
  grade: string;
  quantity_kg: number;
  price_per_kg: number;
  min_order_kg: number | null;
  location_label: string;
  region: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // joined
  farmer_name?: string;
  photos?: string[];
}

export interface OrderRow {
  id: string;
  order_group_id: string | null;
  buyer_id: string;
  farmer_id: string;
  total_amount: number;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  pickup_location: string;
  buyer_location: any;
  farmer_location: any;
  delivery_location: any;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  processing_at: string | null;
  pickup_scheduled_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
}

export interface WalletRow {
  id: string;
  user_id: string;
  available: number;
  pending: number;
  locked: number;
  withdrawn: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  wallet_id: string;
  order_id: string | null;
  type: string;
  title: string;
  amount: number;
  status: string;
  reference: string | null;
  metadata: any;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════
// PROFILES
// ════════════════════════════════════════════════════════════════════

/** Fetch a single profile by ID */
export const getProfile = async (userId: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.error('getProfile error:', error.message);
  return data;
};

/** Update profile fields */
export const updateProfile = async (
  userId: string,
  updates: Partial<Omit<ProfileRow, 'id' | 'created_at'>>
): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) console.error('updateProfile error:', error.message);
  return data;
};

/** Fetch all profiles (admin) */
export const getAllProfiles = async (role?: string): Promise<ProfileRow[]> => {
  let query = supabase.from('profiles').select('*').is('deleted_at', null).order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  if (error) console.error('getAllProfiles error:', error.message);
  return data || [];
};

// ════════════════════════════════════════════════════════════════════
// LISTINGS
// ════════════════════════════════════════════════════════════════════

/** Fetch all active listings (marketplace) */
export const getActiveListings = async (): Promise<ListingRow[]> => {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*, profiles!listings_farmer_id_fkey(full_name)')
    .eq('status', 'Active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getActiveListings error:', error.message);
    return [];
  }

  // Flatten farmer name & fetch photos
  const enriched: ListingRow[] = [];
  for (const l of listings || []) {
    const { data: photos } = await supabase
      .from('listing_photos')
      .select('photo_url')
      .eq('listing_id', l.id)
      .order('display_order');

    enriched.push({
      ...l,
      farmer_name: (l as any).profiles?.full_name || 'Unknown Farmer',
      photos: (photos || []).map((p: any) => p.photo_url),
    });
  }
  return enriched;
};

/** Fetch listings by farmer */
export const getListingsByFarmer = async (farmerId: string): Promise<ListingRow[]> => {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('farmer_id', farmerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getListingsByFarmer error:', error.message);
    return [];
  }

  const enriched: ListingRow[] = [];
  for (const l of listings || []) {
    const { data: photos } = await supabase
      .from('listing_photos')
      .select('photo_url')
      .eq('listing_id', l.id)
      .order('display_order');
    enriched.push({ ...l, photos: (photos || []).map((p: any) => p.photo_url) });
  }
  return enriched;
};

/** Create a new listing */
export const createListing = async (listing: {
  farmer_id: string;
  commodity: string;
  grade: string;
  quantity_kg: number;
  price_per_kg: number;
  location_label: string;
  region: string;
  description?: string;
  photos?: string[];
}): Promise<ListingRow | null> => {
  const { photos, ...rest } = listing;

  const { data, error } = await supabase
    .from('listings')
    .insert({ ...rest, status: 'Active' })
    .select()
    .single();

  if (error) {
    console.error('createListing error:', error.message);
    return null;
  }

  // Insert photos
  if (photos && photos.length > 0 && data) {
    const photoRows = photos.map((url, i) => ({
      listing_id: data.id,
      photo_url: url,
      display_order: i,
    }));
    await supabase.from('listing_photos').insert(photoRows);
  }

  return data ? { ...data, photos: photos || [] } : null;
};

/** Update an existing listing */
export const updateListing = async (
  listingId: string,
  updates: Partial<{
    commodity: string;
    grade: string;
    quantity_kg: number;
    price_per_kg: number;
    status: string;
    description: string;
  }>
): Promise<ListingRow | null> => {
  const { data, error } = await supabase
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select()
    .single();
  if (error) console.error('updateListing error:', error.message);
  return data;
};

/** Soft-delete listing */
export const deleteListing = async (listingId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('listings')
    .update({ deleted_at: new Date().toISOString(), status: 'Archived' })
    .eq('id', listingId);
  if (error) {
    console.error('deleteListing error:', error.message);
    return false;
  }
  return true;
};

// ════════════════════════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════════════════════════

/** Place a new order */
export const createOrder = async (order: {
  buyer_id: string;
  farmer_id: string;
  total_amount: number;
  pickup_location: string;
  items: { listing_id: string; quantity_kg: number; price_per_unit: number }[];
}): Promise<OrderRow | null> => {
  // Create the order
  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: order.buyer_id,
      farmer_id: order.farmer_id,
      total_amount: order.total_amount,
      pickup_location: order.pickup_location,
      status: 'Pending',
      payment_status: 'Unpaid',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('createOrder error:', error?.message);
    return null;
  }

  // Insert order items
  const items = order.items.map((item) => ({
    order_id: data.id,
    listing_id: item.listing_id,
    quantity_kg: item.quantity_kg,
    price_per_unit_snapshot: item.price_per_unit,
    line_total: item.quantity_kg * item.price_per_unit,
  }));
  await supabase.from('order_items').insert(items);

  // Insert status history
  await supabase.from('order_status_history').insert({
    order_id: data.id,
    status: 'Pending',
    notes: 'Order placed',
  });

  return data;
};

/** Get orders by buyer */
export const getOrdersByBuyer = async (buyerId: string): Promise<OrderRow[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', buyerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) console.error('getOrdersByBuyer error:', error.message);
  return data || [];
};

/** Get orders by farmer */
export const getOrdersByFarmer = async (farmerId: string): Promise<OrderRow[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('farmer_id', farmerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) console.error('getOrdersByFarmer error:', error.message);
  return data || [];
};

/** Get all orders (admin) */
export const getAllOrders = async (): Promise<OrderRow[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) console.error('getAllOrders error:', error.message);
  return data || [];
};

/** Update order status */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  notes?: string
): Promise<OrderRow | null> => {
  const timestampField: Record<string, string> = {
    Accepted: 'accepted_at',
    Processing: 'processing_at',
    PickupScheduled: 'pickup_scheduled_at',
    InTransit: 'in_transit_at',
    Delivered: 'delivered_at',
  };

  const updatePayload: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (timestampField[status]) {
    updatePayload[timestampField[status]] = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('updateOrderStatus error:', error.message);
    return null;
  }

  // Log status change
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status,
    notes: notes || `Status changed to ${status}`,
  });

  return data;
};

// ════════════════════════════════════════════════════════════════════
// WALLETS & TRANSACTIONS
// ════════════════════════════════════════════════════════════════════

/** Get wallet by user ID */
export const getWallet = async (userId: string): Promise<WalletRow | null> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('getWallet error:', error.message);
  return data;
};

/** Fund wallet (add to available balance) */
export const fundWallet = async (
  userId: string,
  amount: number,
  reference: string
): Promise<boolean> => {
  // Get current wallet
  const wallet = await getWallet(userId);
  if (!wallet) {
    console.error('Wallet not found for user:', userId);
    return false;
  }

  // Update balance
  const { error } = await supabase
    .from('wallets')
    .update({
      available: wallet.available + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('fundWallet error:', error.message);
    return false;
  }

  // Record transaction
  await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'fund',
    title: 'Wallet funding via Paystack',
    amount,
    status: 'completed',
    reference,
  });

  return true;
};

/** Get transactions for a wallet */
export const getTransactions = async (userId: string): Promise<TransactionRow[]> => {
  const wallet = await getWallet(userId);
  if (!wallet) return [];

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false });

  if (error) console.error('getTransactions error:', error.message);
  return data || [];
};

/** Request withdrawal */
export const requestWithdrawal = async (params: {
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<boolean> => {
  const wallet = await getWallet(params.userId);
  if (!wallet || wallet.available < params.amount) {
    console.error('Insufficient balance or wallet not found');
    return false;
  }

  // Deduct from available
  const { error: walletError } = await supabase
    .from('wallets')
    .update({
      available: wallet.available - params.amount,
      withdrawn: wallet.withdrawn + params.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', params.userId);

  if (walletError) {
    console.error('requestWithdrawal wallet error:', walletError.message);
    return false;
  }

  // Create payout request
  await supabase.from('payout_requests').insert({
    user_id: params.userId,
    wallet_id: wallet.id,
    amount: params.amount,
    bank_name: params.bankName,
    account_number: params.accountNumber,
    account_name: params.accountName,
    status: 'Submitted',
  });

  // Record transaction
  await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'withdrawal',
    title: `Withdrawal to ${params.bankName}`,
    amount: params.amount,
    status: 'pending',
  });

  return true;
};

// ════════════════════════════════════════════════════════════════════
// ESCROW
// ════════════════════════════════════════════════════════════════════

/** Create escrow for an order */
export const createEscrow = async (params: {
  orderId: string;
  buyerId: string;
  farmerId: string;
  amount: number;
  commissionRate?: number;
}): Promise<boolean> => {
  const rate = params.commissionRate ?? 0.1;
  const commission = params.amount * rate;
  const farmerAmount = params.amount - commission;

  const { error } = await supabase.from('escrows').insert({
    order_id: params.orderId,
    buyer_id: params.buyerId,
    farmer_id: params.farmerId,
    amount: params.amount,
    commission,
    farmer_amount: farmerAmount,
    status: 'held',
  });

  if (error) {
    console.error('createEscrow error:', error.message);
    return false;
  }
  return true;
};

/** Release escrow (on delivery confirmation) */
export const releaseEscrow = async (orderId: string): Promise<boolean> => {
  const { data: escrow, error: fetchError } = await supabase
    .from('escrows')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'held')
    .maybeSingle();

  if (fetchError || !escrow) {
    console.error('releaseEscrow: not found or error', fetchError?.message);
    return false;
  }

  // Mark as released
  await supabase
    .from('escrows')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', escrow.id);

  // Credit farmer wallet
  const farmerWallet = await getWallet(escrow.farmer_id);
  if (farmerWallet) {
    await supabase
      .from('wallets')
      .update({
        available: farmerWallet.available + escrow.farmer_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', escrow.farmer_id);

    // Record transaction
    await supabase.from('wallet_transactions').insert({
      wallet_id: farmerWallet.id,
      order_id: orderId,
      type: 'release',
      title: 'Escrow funds released',
      amount: escrow.farmer_amount,
      status: 'completed',
    });
  }

  return true;
};

// ════════════════════════════════════════════════════════════════════
// KYC / KYB
// ════════════════════════════════════════════════════════════════════

/** Update KYC status on a profile */
export const updateKycStatus = async (
  userId: string,
  status: string,
  rejectionReason?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('updateKycStatus error:', error.message);
    return false;
  }
  return true;
};

/** Upload KYC document */
export const uploadKycDocument = async (
  userId: string,
  documentType: string,
  file: File
): Promise<string | null> => {
  const filePath = `kyc/${userId}/${documentType}_${Date.now()}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('uploadKycDocument error:', uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  const documentUrl = urlData.publicUrl;

  // Insert document record
  await supabase.from('kyc_documents').insert({
    user_id: userId,
    document_type: documentType,
    document_url: documentUrl,
    verification_status: 'IN_REVIEW',
  });

  return documentUrl;
};

// ════════════════════════════════════════════════════════════════════
// IMAGE UPLOAD (Listing photos)
// ════════════════════════════════════════════════════════════════════

/** Upload a listing photo to Supabase Storage */
export const uploadListingPhoto = async (
  farmerId: string,
  file: File
): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const filePath = `listings/${farmerId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('listing-images')
    .upload(filePath, file);

  if (error) {
    console.error('uploadListingPhoto error:', error.message);
    return null;
  }

  const { data } = supabase.storage
    .from('listing-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// ════════════════════════════════════════════════════════════════════
// DISPUTES
// ════════════════════════════════════════════════════════════════════

/** Create a dispute */
export const createDispute = async (dispute: {
  order_id: string;
  raised_by: string;
  raised_by_role: string;
  type: string;
  title: string;
  description: string;
}): Promise<boolean> => {
  const { error } = await supabase.from('disputes').insert(dispute);
  if (error) {
    console.error('createDispute error:', error.message);
    return false;
  }
  return true;
};

/** Get all disputes (admin) */
export const getAllDisputes = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) console.error('getAllDisputes error:', error.message);
  return data || [];
};

/** Resolve dispute */
export const resolveDispute = async (
  disputeId: string,
  resolvedBy: string,
  resolution: string,
  outcome: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('disputes')
    .update({
      status: 'Resolved',
      resolved_by: resolvedBy,
      resolution,
      outcome,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId);
  if (error) {
    console.error('resolveDispute error:', error.message);
    return false;
  }
  return true;
};

