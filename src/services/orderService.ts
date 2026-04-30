import { Escrow, Order, OrderStatus, PaymentStatus } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  addOrder as addLocalOrder,
  getAppState,
  getOrdersByBuyerId as getLocalOrdersByBuyerId,
  getOrdersByFarmerId as getLocalOrdersByFarmerId,
  updateOrderStatus as updateLocalOrderStatus,
} from '@/lib/store';

interface AccessibleOrderRow {
  id: string;
  buyer_id: string;
  buyer_name: string;
  farmer_id: string;
  farmer_name: string;
  listing_id: string;
  commodity: string;
  grade: string | null;
  quantity_kg: number;
  price_per_kg: number;
  amount: number;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  pickup_location: string;
  listing_region: string | null;
  buyer_location: { lat: number; lng: number } | null;
  farmer_location: { lat: number; lng: number } | null;
  delivery_location: { lat: number; lng: number } | null;
  created_at: string;
  accepted_at: string | null;
  processing_at: string | null;
  pickup_scheduled_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  photo_urls: string[] | null;
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

export interface CreateOrderInput {
  listingId: string;
  quantityKg: number;
  paymentMethod?: 'paystack' | 'wallet';
  paymentReference?: string;
}

const ORDER_STATUS_PENDING: OrderStatus = 'Pending';
const ORDER_STATUS_PAID: OrderStatus = 'Paid';
const ORDER_STATUS_DELIVERED: OrderStatus = 'Delivered';
const ORDER_STATUS_DISPUTED: OrderStatus = 'Disputed';
const PAYMENT_STATUS_UNPAID: PaymentStatus = 'Unpaid';
const PAYMENT_STATUS_PAID: PaymentStatus = 'Paid';
const PAYMENT_STATUS_RELEASED: PaymentStatus = 'Released';
const PAYMENT_STATUS_REFUNDED: PaymentStatus = 'Refunded';

export interface PrepareOrderInput extends CreateOrderInput {
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  commodity: string;
  grade?: Order['grade'];
  listingRegion?: string;
  listingPhotos?: string[];
  pickupLocation: string;
  pricePerKg: number;
}

const mapOrder = (row: AccessibleOrderRow): Order => ({
  id: row.id,
  buyerId: row.buyer_id,
  buyerName: row.buyer_name,
  farmerId: row.farmer_id,
  farmerName: row.farmer_name,
  listingId: row.listing_id,
  commodity: row.commodity,
  grade: row.grade ? (row.grade as Order['grade']) : undefined,
  listingRegion: row.listing_region || undefined,
  listingPhotos: row.photo_urls || [],
  quantityKg: Number(row.quantity_kg || 0),
  pricePerKg: Number(row.price_per_kg || 0),
  amount: Number(row.amount || 0),
  status: row.status as OrderStatus,
  paymentStatus: row.payment_status ? (row.payment_status as Order['paymentStatus']) : undefined,
  paymentMethod: row.payment_method ? (row.payment_method as Order['paymentMethod']) : undefined,
  paymentReference: row.payment_reference || undefined,
  pickupLocation: row.pickup_location,
  buyerLocation: row.buyer_location || undefined,
  farmerLocation: row.farmer_location || undefined,
  deliveryLocation: row.delivery_location || undefined,
  createdAt: row.created_at,
  acceptedAt: row.accepted_at || undefined,
  processingAt: row.processing_at || undefined,
  pickupScheduledAt: row.pickup_scheduled_at || undefined,
  inTransitAt: row.in_transit_at || undefined,
  deliveredAt: row.delivered_at || undefined,
});

const mapEscrow = (row: EscrowRow): Escrow => ({
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
});

export const getAccessibleOrders = async (): Promise<Order[]> => {
  if (!isSupabaseConfigured) {
    return [...getAppState().orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_accessible_orders');

  if (error) {
    throw error;
  }

  return ((data || []) as AccessibleOrderRow[]).map(mapOrder);
};

export const getBuyerOrders = async (buyerId: string): Promise<Order[]> => {
  if (!isSupabaseConfigured) {
    return getLocalOrdersByBuyerId(buyerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const orders = await getAccessibleOrders();
  return orders.filter((order) => order.buyerId === buyerId);
};

export const getFarmerOrders = async (farmerId: string): Promise<Order[]> => {
  if (!isSupabaseConfigured) {
    return getLocalOrdersByFarmerId(farmerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const orders = await getAccessibleOrders();
  return orders.filter((order) => order.farmerId === farmerId);
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  if (!isSupabaseConfigured) {
    return getAppState().orders.find((order) => order.id === orderId) || null;
  }

  const orders = await getAccessibleOrders();
  return orders.find((order) => order.id === orderId) || null;
};

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  if (!isSupabaseConfigured) {
    const state = getAppState();
    const currentUser = state.currentUser;
    if (!currentUser || currentUser.role !== 'buyer') {
      throw new Error('You must be signed in as a buyer to place an order.');
    }

    const listing = state.listings.find((entry) => entry.id === input.listingId);
    if (!listing) {
      throw new Error('Listing not found.');
    }

    if (listing.status !== 'Active') {
      throw new Error('This listing is no longer available.');
    }

    if (input.quantityKg <= 0) {
      throw new Error('Order quantity must be greater than zero.');
    }

    if (listing.minOrderKg && input.quantityKg < listing.minOrderKg) {
      throw new Error(`Minimum order quantity is ${listing.minOrderKg}kg.`);
    }
    console.log('[orderService] Creating local order request', {
      listingId: input.listingId,
      buyerId: currentUser.id,
      farmerId: listing.farmerId,
      requestedQuantityKg: input.quantityKg,
      listedStockKg: listing.quantityKg,
      paymentMethod: input.paymentMethod || 'paystack',
      paymentReference: input.paymentReference || null,
    });

    return addLocalOrder({
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      listingId: listing.id,
      commodity: listing.commodity,
      grade: listing.grade,
      listingRegion: listing.region,
      listingPhotos: listing.photos,
      quantityKg: input.quantityKg,
      pricePerKg: listing.pricePerKg,
      amount: input.quantityKg * listing.pricePerKg,
      status: ORDER_STATUS_PENDING,
      paymentStatus: PAYMENT_STATUS_PAID,
      paymentMethod: input.paymentMethod || 'paystack',
      paymentReference: input.paymentReference,
      pickupLocation: listing.locationLabel,
    });
  }

  throw new Error('createOrder requires the shared prepare/finalize payment flow.');
};

const createSupabaseOrderRecord = async (
  input: PrepareOrderInput,
  paymentStatus: PaymentStatus,
  paymentReference?: string
): Promise<Order> => {
  const supabase = getSupabaseClient();
  const amount = Number((input.quantityKg * input.pricePerKg).toFixed(2));
  const orderPayload = {
    buyer_id: input.buyerId,
    farmer_id: input.farmerId,
    total_amount: amount,
    status: ORDER_STATUS_PENDING,
    payment_status: paymentStatus,
    payment_method: input.paymentMethod || 'paystack',
    payment_reference: paymentReference || null,
    pickup_location: input.pickupLocation,
  };

  console.log('[orderService] Creating direct Supabase order record', {
    orderPayload,
    listingId: input.listingId,
    buyerName: input.buyerName,
    farmerName: input.farmerName,
  });

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (orderError) {
    console.error('[orderService] Order insert failed', {
      orderPayload,
      orderError,
      code: (orderError as any)?.code,
      details: (orderError as any)?.details,
      hint: (orderError as any)?.hint,
      message: (orderError as any)?.message,
    });
    throw orderError;
  }

  const orderId = orderRow.id as string;

  const orderItemPayload = {
    order_id: orderId,
    listing_id: input.listingId,
    quantity_kg: input.quantityKg,
    price_per_unit_snapshot: input.pricePerKg,
    line_total: amount,
  };

  const { error: itemError } = await supabase.from('order_items').insert(orderItemPayload);

  if (itemError) {
    console.error('[orderService] Order item insert failed', {
      orderId,
      orderItemPayload,
      itemError,
      code: (itemError as any)?.code,
      details: (itemError as any)?.details,
      hint: (itemError as any)?.hint,
      message: (itemError as any)?.message,
    });
    throw itemError;
  }

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: ORDER_STATUS_PENDING,
    notes: 'Order request created and awaiting availability confirmation',
  });

  if (historyError) {
    console.error('[orderService] Order status history insert failed', {
      orderId,
      historyError,
      code: (historyError as any)?.code,
      details: (historyError as any)?.details,
      hint: (historyError as any)?.hint,
      message: (historyError as any)?.message,
    });
    throw historyError;
  }

  console.log('[orderService] Direct Supabase order request created', {
    orderId,
    listingId: input.listingId,
    requestedQuantityKg: input.quantityKg,
    paymentStatus,
    paymentReference: paymentReference || null,
  });

  const createdOrder = await getOrderById(orderId);
  if (!createdOrder) {
    throw new Error('Order was created but could not be reloaded.');
  }

  return createdOrder;
};

export const createPendingOrder = async (input: PrepareOrderInput): Promise<Order> => {
  if (!isSupabaseConfigured) {
    return addLocalOrder({
      buyerId: input.buyerId,
      buyerName: input.buyerName,
      farmerId: input.farmerId,
      farmerName: input.farmerName,
      listingId: input.listingId,
      commodity: input.commodity,
      grade: input.grade,
      listingRegion: input.listingRegion,
      listingPhotos: input.listingPhotos,
      quantityKg: input.quantityKg,
      pricePerKg: input.pricePerKg,
      amount: input.quantityKg * input.pricePerKg,
      status: ORDER_STATUS_PENDING,
      paymentStatus: PAYMENT_STATUS_UNPAID,
      paymentMethod: input.paymentMethod || 'paystack',
      paymentReference: input.paymentReference,
      pickupLocation: input.pickupLocation,
    });
  }

  return createSupabaseOrderRecord(input, PAYMENT_STATUS_UNPAID, input.paymentReference);
};

export const markOrderPaid = async (orderId: string, paymentReference: string): Promise<Order> => {
  if (!isSupabaseConfigured) {
    const order = getAppState().orders.find((entry) => entry.id === orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    order.status = ORDER_STATUS_PAID;
    order.paymentStatus = PAYMENT_STATUS_PAID;
    order.paymentMethod = 'paystack';
    order.paymentReference = paymentReference;
    return order;
  }

  const supabase = getSupabaseClient();
  console.log('[orderService] Updating order after payment success', {
    orderId,
    paymentReference,
    paymentStatus: PAYMENT_STATUS_PAID,
    orderStatus: ORDER_STATUS_PAID,
  });

  const { error } = await supabase.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment_reference: paymentReference,
    p_payment_method: 'paystack',
  });

  if (error) {
    console.error('[orderService] Order payment update failed', {
      orderId,
      paymentReference,
      error,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      message: (error as any)?.message,
    });
    throw error;
  }

  const updatedOrder = await getOrderById(orderId);
  if (!updatedOrder) {
    throw new Error('Payment completed, but the order could not be reloaded.');
  }

  return updatedOrder;
};

export const discardPendingOrder = async (orderId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const order = getAppState().orders.find((entry) => entry.id === orderId);
    if (order) {
      order.status = 'Cancelled';
    }
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('orders')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('[orderService] Failed to discard pending order', {
      orderId,
      error,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      message: (error as any)?.message,
    });
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  if (!isSupabaseConfigured) {
    updateLocalOrderStatus(orderId, status);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('transition_order_workflow', {
    p_order_id: orderId,
    p_next_status: status,
    p_notes: null,
  });

  if (error) {
    console.error('[orderService] Failed to update order status', {
      orderId,
      status,
      error,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      message: (error as any)?.message,
    });
    throw error;
  }
};

export const confirmOrderDelivery = async (orderId: string): Promise<void> => {
  await updateOrderStatus(orderId, ORDER_STATUS_DELIVERED);
};

export const disputeOrder = async (orderId: string, description: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    updateLocalOrderStatus(orderId, ORDER_STATUS_DISPUTED);
    return;
  }

  const supabase = getSupabaseClient();
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) {
    throw new Error('Order not found.');
  }

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    throw authError;
  }

  const user = session?.user;
  if (!user) {
    throw new Error('Authentication required.');
  }

  const disputePayload = {
    order_id: orderId,
    raised_by: user.id,
    raised_by_role: 'buyer',
    type: 'other',
    status: 'Open',
    title: `Issue reported for ${currentOrder.commodity}`,
    description: description.trim() || 'Buyer reported an issue with this order.',
  };

  console.log('[orderService] Creating order dispute', {
    orderId,
    buyerId: user.id,
    disputePayload,
  });

  const { error: disputeError } = await supabase.from('disputes').insert(disputePayload);

  if (disputeError) {
    console.error('[orderService] Failed to create dispute', {
      orderId,
      disputeError,
      code: (disputeError as any)?.code,
      details: (disputeError as any)?.details,
      hint: (disputeError as any)?.hint,
      message: (disputeError as any)?.message,
    });
    throw disputeError;
  }

  await updateOrderStatus(orderId, ORDER_STATUS_DISPUTED);
};

export const getEscrowByOrderId = async (orderId: string): Promise<Escrow | null> => {
  if (!isSupabaseConfigured) {
    return getAppState().escrows.find((escrow) => escrow.orderId === orderId) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('escrows')
    .select('id, order_id, buyer_id, farmer_id, amount, commission, farmer_amount, status, created_at, released_at, refunded_at')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapEscrow(data as EscrowRow) : null;
};
