import { AppState, Farmer, Buyer, Listing, Order, Transaction, Wallet, MarketPriceIntel, KYCData } from '@/types';

const STORAGE_KEY = 'farmsquare_state';

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Initial seed data
const createSeedData = (): AppState => {
  const farmerId = 'farmer_001';
  const buyerId = 'buyer_001';
  const agentId = 'agent_001';
  const adminId = 'admin_001';

  return {
    currentUser: null,
    farmers: [
      {
        id: farmerId,
        name: 'Adamu Bello',
        phone: '+2348012345678',
        role: 'farmer',
        region: 'Kaduna',
        kycStatus: 'APPROVED',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    buyers: [
      {
        id: buyerId,
        name: 'Ngozi Okonkwo',
        phone: '+2348098765432',
        role: 'buyer',
        region: 'Lagos',
        kycStatus: 'APPROVED',
        companyName: 'AgroTrade Nigeria Ltd',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    agents: [
      {
        id: agentId,
        name: 'Musa Ibrahim',
        phone: '+2348011112222',
        role: 'agent',
        region: 'Kano',
        kycStatus: 'APPROVED',
        farmersOnboarded: 45,
        inspectionsCompleted: 120,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    admins: [
      {
        id: adminId,
        name: 'Admin User',
        phone: '+2348000000000',
        role: 'admin',
        region: 'Lagos',
        kycStatus: 'APPROVED',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    wallets: [
      {
        userId: farmerId,
        available: 485000,
        pending: 125000,
        currency: '₦',
      },
      {
        userId: buyerId,
        available: 2500000,
        pending: 0,
        currency: '₦',
      },
    ],
    listings: [
      {
        id: 'listing_001',
        farmerId,
        farmerName: 'Adamu Bello',
        commodity: 'Maize',
        grade: 'A',
        quantityKg: 5000,
        pricePerKg: 450,
        photos: [],
        locationLabel: 'Zaria Farm Settlement',
        region: 'Kaduna',
        status: 'Active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'listing_002',
        farmerId,
        farmerName: 'Adamu Bello',
        commodity: 'Cassava',
        grade: 'B',
        quantityKg: 3000,
        pricePerKg: 280,
        photos: [],
        locationLabel: 'Zaria Farm Settlement',
        region: 'Kaduna',
        status: 'Active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    orders: [
      {
        id: 'order_001',
        buyerId,
        buyerName: 'Ngozi Okonkwo',
        farmerId,
        farmerName: 'Adamu Bello',
        listingId: 'listing_001',
        commodity: 'Maize',
        quantityKg: 2000,
        pricePerKg: 450,
        amount: 900000,
        status: 'Pending',
        pickupLocation: 'Zaria Farm Settlement, Kaduna',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'order_002',
        buyerId,
        buyerName: 'Ngozi Okonkwo',
        farmerId,
        farmerName: 'Adamu Bello',
        listingId: 'listing_002',
        commodity: 'Cassava',
        quantityKg: 1500,
        pricePerKg: 280,
        amount: 420000,
        status: 'Accepted',
        pickupLocation: 'Zaria Farm Settlement, Kaduna',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'order_003',
        buyerId,
        buyerName: 'Ngozi Okonkwo',
        farmerId,
        farmerName: 'Adamu Bello',
        listingId: 'listing_001',
        commodity: 'Maize',
        quantityKg: 1000,
        pricePerKg: 450,
        amount: 450000,
        status: 'Delivered',
        pickupLocation: 'Zaria Farm Settlement, Kaduna',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    transactions: [
      {
        id: 'txn_001',
        userId: farmerId,
        type: 'Credit',
        title: 'Payment for Maize (Order #003)',
        amount: 450000,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'txn_002',
        userId: farmerId,
        type: 'Debit',
        title: 'Withdrawal to GTBank',
        amount: 200000,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'txn_003',
        userId: farmerId,
        type: 'Credit',
        title: 'Payment for Cassava (Order #002)',
        amount: 420000,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    withdrawals: [
      {
        id: 'wd_001',
        userId: farmerId,
        amount: 200000,
        bankName: 'GTBank',
        accountMasked: '****4521',
        status: 'Paid',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    marketPrices: [
      {
        commodity: 'Maize',
        regionalPricePerKg: 420,
        lastUpdated: new Date().toISOString(),
      },
      {
        commodity: 'Cassava',
        regionalPricePerKg: 300,
        lastUpdated: new Date().toISOString(),
      },
      {
        commodity: 'Rice',
        regionalPricePerKg: 850,
        lastUpdated: new Date().toISOString(),
      },
      {
        commodity: 'Yam',
        regionalPricePerKg: 550,
        lastUpdated: new Date().toISOString(),
      },
      {
        commodity: 'Sorghum',
        regionalPricePerKg: 380,
        lastUpdated: new Date().toISOString(),
      },
    ],
    kycData: [
      {
        userId: farmerId,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
};

// Get app state from localStorage
export const getAppState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  const seedData = createSeedData();
  setAppState(seedData);
  return seedData;
};

// Set app state to localStorage
export const setAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
};

// Reset app state to seed data
export const resetAppState = (): AppState => {
  const seedData = createSeedData();
  setAppState(seedData);
  return seedData;
};

// Update partial state
export const updateAppState = (updates: Partial<AppState>): AppState => {
  const current = getAppState();
  const newState = { ...current, ...updates };
  setAppState(newState);
  return newState;
};

// Helper: Get wallet by user ID
export const getWalletByUserId = (userId: string): Wallet | undefined => {
  const state = getAppState();
  return state.wallets.find(w => w.userId === userId);
};

// Helper: Get listings by farmer ID
export const getListingsByFarmerId = (farmerId: string): Listing[] => {
  const state = getAppState();
  return state.listings.filter(l => l.farmerId === farmerId);
};

// Helper: Get orders by farmer ID
export const getOrdersByFarmerId = (farmerId: string): Order[] => {
  const state = getAppState();
  return state.orders.filter(o => o.farmerId === farmerId);
};

// Helper: Get orders by buyer ID
export const getOrdersByBuyerId = (buyerId: string): Order[] => {
  const state = getAppState();
  return state.orders.filter(o => o.buyerId === buyerId);
};

// Helper: Get transactions by user ID
export const getTransactionsByUserId = (userId: string): Transaction[] => {
  const state = getAppState();
  return state.transactions.filter(t => t.userId === userId);
};

// Helper: Get withdrawals by user ID
export const getWithdrawalsByUserId = (userId: string): import('@/types').Withdrawal[] => {
  const state = getAppState();
  return state.withdrawals.filter(w => w.userId === userId);
};

// Helper: Get KYC data by user ID
export const getKYCByUserId = (userId: string): KYCData | undefined => {
  const state = getAppState();
  return state.kycData.find(k => k.userId === userId);
};

// Helper: Add new listing
export const addListing = (listing: Omit<Listing, 'id' | 'createdAt'>): Listing => {
  const state = getAppState();
  const newListing: Listing = {
    ...listing,
    id: `listing_${generateId()}`,
    createdAt: new Date().toISOString(),
  };
  state.listings.unshift(newListing);
  setAppState(state);
  return newListing;
};

// Helper: Update listing
export const updateListing = (listingId: string, updates: Partial<Listing>): void => {
  const state = getAppState();
  const index = state.listings.findIndex(l => l.id === listingId);
  if (index !== -1) {
    state.listings[index] = { ...state.listings[index], ...updates };
    setAppState(state);
  }
};

// Helper: Update order status
export const updateOrderStatus = (orderId: string, status: import('@/types').OrderStatus, evidence?: import('@/types').OrderEvidence): void => {
  const state = getAppState();
  const index = state.orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    const now = new Date().toISOString();
    const order = state.orders[index];
    
    state.orders[index] = {
      ...order,
      status,
      ...(status === 'Accepted' && { acceptedAt: now }),
      ...(status === 'PickupScheduled' && { pickupScheduledAt: now }),
      ...(status === 'InTransit' && { inTransitAt: now }),
      ...(status === 'Delivered' && { deliveredAt: now }),
      ...(evidence && { evidence }),
    };
    setAppState(state);
  }
};

// Helper: Add transaction
export const addTransaction = (userId: string, type: import('@/types').TransactionType, title: string, amount: number): void => {
  const state = getAppState();
  const newTransaction: Transaction = {
    id: `txn_${generateId()}`,
    userId,
    type,
    title,
    amount,
    createdAt: new Date().toISOString(),
  };
  state.transactions.unshift(newTransaction);
  setAppState(state);
};

// Helper: Add withdrawal request
export const addWithdrawal = (userId: string, amount: number, bankName: string, accountMasked: string): void => {
  const state = getAppState();
  
  // Reduce available balance
  const walletIndex = state.wallets.findIndex(w => w.userId === userId);
  if (walletIndex !== -1) {
    state.wallets[walletIndex].available -= amount;
  }
  
  // Add withdrawal record
  const newWithdrawal: import('@/types').Withdrawal = {
    id: `wd_${generateId()}`,
    userId,
    amount,
    bankName,
    accountMasked,
    status: 'Submitted',
    createdAt: new Date().toISOString(),
  };
  state.withdrawals.unshift(newWithdrawal);
  
  // Add debit transaction
  const newTransaction: Transaction = {
    id: `txn_${generateId()}`,
    userId,
    type: 'Debit',
    title: `Withdrawal to ${bankName}`,
    amount,
    createdAt: new Date().toISOString(),
  };
  state.transactions.unshift(newTransaction);
  
  setAppState(state);
};

// Helper: Update KYC status
export const updateKYCStatus = (userId: string, status: import('@/types').KYCStatus, selfiePhoto?: string, idPhoto?: string): void => {
  const state = getAppState();
  const index = state.kycData.findIndex(k => k.userId === userId);
  
  const kycRecord: KYCData = {
    userId,
    status,
    selfiePhoto,
    idPhoto,
    submittedAt: new Date().toISOString(),
  };
  
  if (index !== -1) {
    state.kycData[index] = kycRecord;
  } else {
    state.kycData.push(kycRecord);
  }
  
  // Also update user's KYC status
  const farmerIndex = state.farmers.findIndex(f => f.id === userId);
  if (farmerIndex !== -1) {
    state.farmers[farmerIndex].kycStatus = status;
  }
  
  setAppState(state);
};

// Format currency
export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format time ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};
