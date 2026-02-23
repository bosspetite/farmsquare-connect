// Escrow and Commission Functions
// This file contains escrow-related functions that will be merged into store.ts

import { getAppState, setAppState, addTransaction, generateId } from './store';
import { Escrow } from '@/types';

// Platform commission rate (10%)
const PLATFORM_COMMISSION_RATE = 0.10;

// Create escrow for an order
export const createEscrow = (orderId: string, buyerId: string, farmerId: string, amount: number): Escrow => {
  const state = getAppState();
  const commission = amount * PLATFORM_COMMISSION_RATE;
  const farmerAmount = amount - commission;
  
  const escrow: Escrow = {
    id: `escrow_${generateId()}`,
    orderId,
    buyerId,
    farmerId,
    amount,
    commission,
    farmerAmount,
    status: 'held',
    createdAt: new Date().toISOString(),
  };
  
  state.escrows.push(escrow);
  
  // Lock buyer's funds
  const buyerWallet = state.wallets.find(w => w.userId === buyerId);
  if (buyerWallet) {
    buyerWallet.locked = (buyerWallet.locked || 0) + amount;
    buyerWallet.available -= amount;
  } else {
    // Create wallet if doesn't exist
    state.wallets.push({
      userId: buyerId,
      available: 0,
      pending: 0,
      locked: amount,
      currency: '₦',
    });
  }
  
  setAppState(state);
  return escrow;
};

// Release escrow funds to farmer
export const releaseEscrow = (orderId: string): void => {
  const state = getAppState();
  const escrow = state.escrows.find(e => e.orderId === orderId && e.status === 'held');
  
  if (!escrow) return;
  
  escrow.status = 'released';
  escrow.releasedAt = new Date().toISOString();
  
  // Update platform commission
  state.platformCommission = (state.platformCommission || 0) + escrow.commission;
  
  // Unlock buyer's funds
  const buyerWallet = state.wallets.find(w => w.userId === escrow.buyerId);
  if (buyerWallet) {
    buyerWallet.locked = (buyerWallet.locked || 0) - escrow.amount;
  }
  
  // Add to farmer's pending balance (will become available after confirmation)
  const farmerWallet = state.wallets.find(w => w.userId === escrow.farmerId);
  if (farmerWallet) {
    farmerWallet.pending += escrow.farmerAmount;
  } else {
    state.wallets.push({
      userId: escrow.farmerId,
      available: 0,
      pending: escrow.farmerAmount,
      locked: 0,
      currency: '₦',
      withdrawn: 0,
    });
  }
  
  // Add transactions
  addTransaction(escrow.farmerId, 'Credit', `Payment received: Order ${orderId}`, escrow.farmerAmount, 'completed', undefined, orderId);
  addTransaction(escrow.farmerId, 'commission', `Platform commission: Order ${orderId}`, -escrow.commission, 'completed', undefined, orderId);
  
  setAppState(state);
};

// Refund escrow to buyer
export const refundEscrow = (orderId: string, reason?: string): void => {
  const state = getAppState();
  const escrow = state.escrows.find(e => e.orderId === orderId && e.status === 'held');
  
  if (!escrow) return;
  
  escrow.status = 'refunded';
  escrow.refundedAt = new Date().toISOString();
  
  // Unlock and return buyer's funds
  const buyerWallet = state.wallets.find(w => w.userId === escrow.buyerId);
  if (buyerWallet) {
    buyerWallet.locked = (buyerWallet.locked || 0) - escrow.amount;
    buyerWallet.available += escrow.amount;
  }
  
  // Add refund transaction
  addTransaction(escrow.buyerId, 'refund', `Refund: Order ${orderId}${reason ? ` - ${reason}` : ''}`, escrow.amount, 'completed', undefined, orderId);
  
  setAppState(state);
};

// Get escrow by order ID
export const getEscrowByOrderId = (orderId: string): Escrow | undefined => {
  const state = getAppState();
  return state.escrows.find(e => e.orderId === orderId);
};

// Fund buyer wallet via Paystack
export const fundBuyerWallet = (userId: string, amount: number, reference: string): void => {
  const state = getAppState();
  let buyerWallet = state.wallets.find(w => w.userId === userId);
  
  if (!buyerWallet) {
    buyerWallet = {
      userId,
      available: 0,
      pending: 0,
      locked: 0,
      currency: '₦',
    };
    state.wallets.push(buyerWallet);
  }
  
  buyerWallet.available += amount;
  
  // Add transaction
  addTransaction(userId, 'fund', `Wallet funding via Paystack`, amount, 'completed', reference);
  
  setAppState(state);
};













