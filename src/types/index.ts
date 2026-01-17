// FarmSquare Data Types

export type UserRole = 'farmer' | 'buyer' | 'agent' | 'admin';

export type KYCStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type ListingStatus = 'Draft' | 'Active' | 'Paused' | 'SoldOut' | 'Sold' | 'Archived';

export type OrderStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Processing' | 'PickupScheduled' | 'InTransit' | 'Delivered' | 'Cancelled';

export type GradeType = 'A' | 'B' | 'C';

export type WithdrawalStatus = 'Submitted' | 'InReview' | 'Paid' | 'Rejected';

export type TransactionType = 'Credit' | 'Debit';

export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Closed';

export type DisputeType = 'quality' | 'quantity' | 'delivery' | 'payment' | 'other';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  region: string;
  kycStatus: KYCStatus;
  createdAt: string;
}

export interface Farmer extends User {
  role: 'farmer';
}

export interface Buyer extends User {
  role: 'buyer';
  companyName?: string;
}

export interface Agent extends User {
  role: 'agent';
  farmersOnboarded: number;
  inspectionsCompleted: number;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Wallet {
  userId: string;
  available: number;
  pending: number;
  currency: '₦';
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName: string;
  commodity: 'Maize' | 'Cassava' | 'Rice' | 'Yam' | 'Sorghum';
  grade: GradeType;
  quantityKg: number;
  pricePerKg: number;
  minOrderKg?: number; // Minimum order quantity in kg
  photos: string[];
  locationLabel: string;
  region: string;
  status: ListingStatus;
  createdAt: string;
}

export interface OrderEvidence {
  photos: string[];
  notes: string;
  timestamp: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  listingId: string;
  commodity: string;
  quantityKg: number;
  pricePerKg: number;
  amount: number;
  status: OrderStatus;
  pickupLocation: string;
  createdAt: string;
  acceptedAt?: string;
  pickupScheduledAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  evidence?: OrderEvidence;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  amount: number;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountMasked: string;
  status: WithdrawalStatus;
  createdAt: string;
}

export interface MarketPriceIntel {
  commodity: string;
  regionalPricePerKg: number;
  lastUpdated: string;
}

export interface KYCData {
  userId: string;
  status: KYCStatus;
  submittedAt?: string;
  // Personal Information
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  // Identity Verification
  idType?: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  idNumber?: string;
  idDocumentFile?: string; // File URL or base64
  selfieFile?: string; // File URL or base64
  // Business Information (for Buyers - KYB)
  businessName?: string;
  businessType?: 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP';
  businessRegistrationNumber?: string;
  businessDocumentFile?: string; // File URL or base64
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string; // userId
  raisedByName: string;
  raisedByRole: 'buyer' | 'farmer';
  type: DisputeType;
  status: DisputeStatus;
  title: string;
  description: string;
  evidence?: {
    photos: string[];
    notes: string;
  };
  resolution?: {
    resolvedBy: string; // admin userId
    resolvedAt: string;
    resolution: string;
    outcome: 'buyer_favor' | 'farmer_favor' | 'partial' | 'dismissed';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  currentUser: User | null;
  farmers: Farmer[];
  buyers: Buyer[];
  agents: Agent[];
  admins: Admin[];
  wallets: Wallet[];
  listings: Listing[];
  orders: Order[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  marketPrices: MarketPriceIntel[];
  kycData: KYCData[];
  disputes: Dispute[];
}
