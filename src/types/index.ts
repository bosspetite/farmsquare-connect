// FarmSquare Data Types

export type UserRole = 'farmer' | 'buyer' | 'agent' | 'admin';

export type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type ListingStatus = 'Draft' | 'Active' | 'Paused' | 'SoldOut' | 'Sold' | 'Archived';

export type OrderStatus = 'Pending' | 'Paid' | 'Accepted' | 'Rejected' | 'Processing' | 'PickupScheduled' | 'InTransit' | 'Delivered' | 'Disputed' | 'Cancelled' | 'Refunded';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Escrowed' | 'Released' | 'Refunded';

export type GradeType = 'A' | 'B' | 'C';
export type ProductImageSource = 'upload' | 'library';

export type WithdrawalStatus = 'Submitted' | 'InReview' | 'Paid' | 'Rejected';

export type TransactionType = 'Credit' | 'Debit' | 'fund' | 'payment' | 'release' | 'withdrawal' | 'refund' | 'commission' | 'escrow_hold' | 'escrow_release' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Closed';

export type DisputeType = 'quality' | 'quantity' | 'delivery' | 'payment' | 'other';

export interface User {
  id: string;
  name: string;
  email?: string;
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
  available: number; // Available balance (can be used immediately)
  pending: number; // Pending balance (awaiting release)
  locked: number; // Locked balance (in escrow for active orders)
  currency: string;
  withdrawn?: number; // Total withdrawn amount (for farmers)
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
  photoPaths?: string[];
  photoSource?: ProductImageSource;
  libraryImageId?: string;
  locationLabel: string;
  region: string;
  status: ListingStatus;
  description?: string;
  createdAt: string;
}

export interface ProductImageLibraryItem {
  id: string;
  name: string;
  category?: string;
  imageUrl: string;
  imagePath?: string;
  storageBucket: string;
  createdBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEvidence {
  photos: string[];
  notes: string;
  timestamp: string;
}

export type LatLng = { lat: number; lng: number };

export interface OrderTracking {
  pickup: LatLng;        // farmer location
  dropoff: LatLng;       // buyer delivery location
  current: LatLng;       // moving marker (agent)
  isTracking: boolean;
  lastUpdatedAt?: string;
  progressPct?: number;  // 0-100
  // Legacy fields for backward compatibility
  currentLocation?: { lat: number; lng: number } | null;
  route?: { lat: number; lng: number }[];
  progressPercentage?: number;
  eta?: number;
  distanceRemaining?: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  listingId: string;
  commodity: string;
  grade?: GradeType;
  listingRegion?: string;
  listingPhotos?: string[];
  quantityKg: number;
  pricePerKg: number;
  amount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus; // Payment status for escrow tracking
  paymentMethod?: 'paystack' | 'wallet'; // How payment was made
  paymentReference?: string; // Paystack reference if paid via Paystack
  pickupLocation: string;
  // Location coordinates for tracking
  buyerLocation?: { lat: number; lng: number };
  farmerLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  // Tracking data
  tracking?: OrderTracking;
  createdAt: string;
  acceptedAt?: string;
  processingAt?: string;
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
  status?: TransactionStatus;
  reference?: string; // Paystack reference or transaction ID
  orderId?: string; // Related order ID if applicable
  metadata?: Record<string, any>; // Additional data
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
  recordId?: string;
  userId: string;
  userRole?: UserRole;
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  primaryDocumentUrl?: string;
  rejectionReason?: string; // Reason for rejection if status is REJECTED
  // Personal Information (for Farmers - KYC)
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string; // Optional - not required for KYB
  address?: string;
  // Identity Verification
  idType?: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  idNumber?: string;
  idDocumentFile?: string; // File URL or base64
  selfieFile?: string; // File URL or base64
  // Business Information (for Buyers - KYB)
  businessName?: string;
  businessType?: 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP';
  businessRegistrationNumber?: string; // CAC Registration Number
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessDocumentFile?: string; // CAC Certificate upload
  // Authorized Representative (for Buyers - KYB)
  authorizedRepresentativeName?: string; // Full Name
  authorizedRepresentativeRole?: string; // Role in Business
  authorizedRepresentativeIdFile?: string; // Government ID upload
}

export interface AppNotification {
  id: string;
  recipientRole?: UserRole | null;
  recipientUserId?: string | null;
  actorId?: string | null;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  relatedOrderId?: string | null;
  relatedProductId?: string | null;
  relatedListingId?: string | null;
  relatedPaymentId?: string | null;
  relatedEscrowId?: string | null;
  relatedKycId?: string | null;
  relatedWithdrawalId?: string | null;
  linkUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
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

export interface Escrow {
  id: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  amount: number;
  commission: number; // Platform commission amount
  farmerAmount: number; // Amount farmer will receive (after commission)
  status: 'held' | 'released' | 'refunded';
  createdAt: string;
  releasedAt?: string;
  refundedAt?: string;
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
  escrows: Escrow[];
  platformCommission: number; // Total platform commission earned
}
