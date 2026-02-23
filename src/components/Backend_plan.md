🌾 Agricultural Multi-Merchant Marketplace
Corrected System Architecture & Technical Specification
Version: 2.2 (Updated with Role Immutability, Soft Deletes, Status Transitions, RLS Performance, Storage Security & Dev Seeding)

1. Project Overview
This system is a role-based agricultural multi-merchant marketplace supporting:
Buyers (Customers)
Merchants (Farmers / Sellers – UI labels only)
Field Agents
Delivery Partners
Admins
Core features: - Produce management - Product quality verification workflow - Orders & multi-merchant checkout - Payments (PCI-safe integration) - Delivery tracking - Reviews - Loyalty system - Promotions - Inventory reservation - Audit logging - Role-based access control (RBAC)
⚠️ Critical Requirement: Produce must be verified by a field agent before it is approved for sale or maintains a verified grade.

2. User & Role Model (Finalized)
Decision: A user can only have ONE role.
Implementation:
SUPABASE AUTH + PROFILES (UPDATED)
Auth users are managed by Supabase Auth (auth.users). Do NOT store passwords in application tables.
Farmers & Buyers: Phone OTP (Supabase Phone provider).
Admins & Field Agents: Email + Password (Supabase Email provider).
Application profile data lives in public.profiles and is linked 1:1 to auth.users via UUID.
(Removed) password_hash — Supabase Auth handles credentials securely.
PROFILES (public.profiles)
id (UUID PK, FK → auth.users.id, ON DELETE CASCADE)
full_name
phone (E.164), email (nullable), role ENUM('buyer','farmer','agent','admin')
kyc_status ENUM('NOT_STARTED','IN_REVIEW','APPROVED','REJECTED')  // for farmers
kyb_status ENUM('NOT_STARTED','IN_REVIEW','APPROVED','REJECTED')  // for buyers (business)
address, state, lga
created_at, updated_at
NOTE: No Date of Birth is required for Business Verification (KYB).
NOTE: Seller/Farmer label in UI maps to role='farmer' in DB.

3. KYB Business Verification Data Model (MVP)
BUYER_BUSINESSES
id (UUID PK)
buyer_id (UUID FK → profiles.id, role='buyer')
business_name (text)
business_type (text) // e.g., INDIVIDUAL, COMPANY, PARTNERSHIP
cac_number (text)
address (text)
state (text)
lga (text)
status (ENUM: NOT_STARTED, IN_REVIEW, APPROVED, REJECTED)
rejection_reason (text nullable)
created_at, updated_at

BUYER_BUSINESS_REPS
id (UUID PK)
business_id (UUID FK → buyer_businesses.id)
full_name (text)
role_title (text) // Role in business
id_type (text) // NIN, PASSPORT, DRIVER_LICENSE, VOTERS_CARD
id_number (text nullable)
created_at

KYB_DOCUMENTS (Updated)
Links to business_id (FK → buyer_businesses.id) as primary join
Keep user_id optionally for convenience queries
Document types: CAC_CERT, REP_ID_DOC, etc.
Admin reviews buyer_businesses + kyb_documents together as single KYB application

KYB Flow:
- Buyer submits structured business info (buyer_businesses) + rep info (buyer_business_reps) + CAC docs (kyb_documents)
- Admin reviews buyer_businesses + kyb_documents as unified KYB application
- No date of birth fields in KYB (business verification only)

4. Merchant, Customer & Operations Tables
MERCHANTS
merchant_id (PK)
user_id (FK → USERS, unique)
business_name
address
phone
verification_status (pending / verified / suspended)
rating
created_at
CUSTOMERS
customer_id (PK)
user_id (FK → USERS, unique)
shipping_address
billing_address
preferences
FIELD_AGENTS
agent_id (PK)
user_id (FK → USERS, unique)
assigned_region
certification_level
active_status
created_at
DELIVERY_PARTNERS
partner_id (PK)
user_id (FK → USERS, unique)
vehicle_type
vehicle_number
availability_status
rating
created_at

5. Product & Produce Verification System
PRODUCTS
product_id (PK)
merchant_id (FK → MERCHANTS)
category_id (FK → CATEGORIES)
name
description
price
stock_quantity
image_url
created_at
Verification Fields: - verification_status (unverified / pending / verified / rejected / suspended) - verified_grade (A / B / C / Premium / Standard) - last_inspection_id (FK → PRODUCE_INSPECTIONS, nullable) - verified_at (timestamp, nullable)

PRODUCE_INSPECTIONS (Immutable After Submission)
inspection_id (PK)
product_id (FK → PRODUCTS)
agent_id (FK → FIELD_AGENTS)
inspection_date
proposed_grade
notes
status (draft / submitted / approved / rejected)
submitted_at
decision_at
decided_by (FK → USERS)
created_at
Rules: - Only “draft” inspections may be edited. - Once submitted, record becomes immutable. - New inspections create new rows (no overwriting).

PRODUCE_INSPECTION_MEDIA
media_id (PK)
inspection_id (FK)
url
created_at

PRODUCE_INSPECTION_EVENTS (Audit Trail)
event_id (PK)
inspection_id (FK)
actor_user_id (FK → USERS)
event_type (created / submitted / approved / rejected / commented)
event_payload_json
created_at

6. Orders & Multi-Merchant Checkout
Decision: One order per merchant.
At checkout: - Cart items are grouped by merchant. - Separate orders are created per merchant.

ORDERS
order_id (PK)
customer_id (FK → CUSTOMERS)
merchant_id (FK → MERCHANTS)
total_amount
status
shipping_address
billing_address
created_at
updated_at
Order Status Flow: pending → confirmed → processing → shipped → delivered → completed / cancelled

ORDER_ITEMS
order_item_id (PK)
order_id (FK → ORDERS)
product_id (FK → PRODUCTS)
quantity
unit_price
subtotal

7. Inventory Reservation (Prevents Overselling)
INVENTORY_RESERVATIONS
reservation_id (PK)
order_id (FK → ORDERS)
product_id (FK → PRODUCTS)
quantity
status (active / expired / consumed / released)
expires_at
created_at
Rules: - Created during checkout. - TTL expiration enforced. - Consumed on successful payment. - Released on failure or cancellation.

8. Payment System (PCI-Safe)
PAYMENTS
payment_id (PK)
order_id (FK → ORDERS)
amount
payment_method
status (pending / completed / failed / refunded)
provider (stripe / paystack / flutterwave)
provider_transaction_id
provider_reference
created_at
updated_at
Security Rule: - Use hosted checkout. - Never store raw card data.

9. Delivery System
DELIVERIES
delivery_id (PK)
order_id (FK → ORDERS, unique)
partner_id (FK → DELIVERY_PARTNERS)
pickup_address
delivery_address
status (assigned / picked_up / in_transit / delivered)
picked_up_at
delivered_at
created_at

DELIVERY_EVENTS
event_id (PK)
delivery_id (FK)
status
location_text
created_at

10. Loyalty System (Transaction-Based)
LOYALTY_TRANSACTIONS
loyalty_tx_id (PK)
customer_id (FK → CUSTOMERS)
type (earn / redeem / reversal)
points
reference_order_id (FK, nullable)
created_at
Balance = SUM(earn) - SUM(redeem) - SUM(reversal)

11. Promotions
PROMOTIONS
promotion_id (PK)
merchant_id (FK)
code
discount_percentage
start_date
end_date
usage_limit
Enforcement: - Per-customer tracking - Date validity - Usage limit validation

12. Reviews
REVIEWS
review_id (PK)
customer_id (FK)
product_id (FK)
rating (1–5)
comment
verified_purchase
created_at
Rules: - One review per product per customer - Only verified purchases allowed

13. Global Audit Logging
AUDIT_LOGS
audit_id (PK)
actor_user_id (FK → USERS)
action
entity_type
entity_id
before_json
after_json
created_at
ip_address
user_agent
Tracks: - Order status changes - Payment updates - Inspection decisions - Merchant verification - Role changes

14. Performance & Indexing (RLS-Optimized)
Required Indexes Checklist (for strict RLS performance):

Critical Foreign Key Indexes (required for RLS ownership checks):
- orders: buyer_id, farmer_id, order_group_id (composite index on buyer_id + status recommended)
- order_items: order_id, listing_id
- listings: farmer_id, status (composite index on farmer_id + status recommended)
- carts: buyer_id, status (composite index on buyer_id + status recommended)
- cart_items: cart_id, listing_id
- wallets: user_id (unique index)
- wallet_transactions: wallet_id, order_id (composite index on wallet_id + created_at recommended)
- logistics: order_id (unique), agent_id
- logistics_status_updates: logistics_id (composite index on logistics_id + created_at recommended)
- kyc_documents: user_id
- kyb_documents: user_id, business_id
- disputes: order_id, raised_by
- admin_audit_logs: actor_user_id, entity_type, entity_id

Additional Performance Indexes:
- profiles: role, phone (unique), email (unique nullable), created_at
- listings: commodity, region (for marketplace filtering)
- listing_photos: listing_id
- order_groups: buyer_id, status, paystack_reference (unique nullable)
- orders: status, payment_status, created_at (for admin dashboards)
- order_status_history: order_id, created_at
- field_agent_reports: agent_id, listing_id, order_id, created_at
- payout_requests: user_id, wallet_id, status, created_at
- buyer_businesses: buyer_id, status, cac_number
- buyer_business_reps: business_id
- dispute_evidence: dispute_id

Required Constraints Checklist:
- price_per_kg >= 0, quantity_kg >= 0, min_order_kg >= 0
- cart_items.quantity_kg > 0
- order_items.quantity_kg > 0
- order_groups.total_amount >= 0, orders.total_amount >= 0
- progress_percentage between 0 and 100
- enforce one active cart per buyer (optional MVP rule)
- enforce one wallet per user
- enforce one logistics per order
- status transition rules documented as state machine (enforced via db function/edge function)

15. Security Requirements (Supabase-first)
15.1 Authentication & Authorization
Supabase Auth JWT sessions (access + refresh) handled by Supabase; client uses anon key; server functions use service role key.
Row Level Security (RLS) enforced on every table (buyer/farmer/agent/admin access boundaries).
Policies replace most custom RBAC middleware; keep lightweight role checks in Edge Functions where needed.
Rate limiting + abuse protection on Edge Functions (OTP, Paystack webhooks, tracking updates).
Input validation on all write operations (client + server).
TLS enforced; no secrets in client; use .env for keys.
SQL injection avoided via Supabase client parameterization; no dynamic SQL from client.
Field Agent Restrictions: may submit inspection reports & logistics updates only; cannot change pricing/stock.
Inspection records immutable after submission; disputes/audit logs append-only.

15.2 Role Safety & Anti-Privilege Escalation
CRITICAL: Prevent unauthorized role assignment.

Role Immutability Rules:
- profiles.role is set ONCE at profile creation (during signup)
- Users CANNOT change role from client/UI (no self-service role updates)
- Only admin can update role (if ever needed), enforced via RLS policies
- RLS policies must explicitly prevent users from updating their own role column
- Role changes must go through admin dashboard or Edge Function with admin authentication

Self-Service Signup Rules:
- Allowed self-service signup roles: buyer, farmer only
- agent/admin are invite-only (cannot self-register)
- Signup flow restricts role selection to buyer/farmer only
- profiles.role is set at signup to buyer/farmer only

Implementation Approach:
- Signup flow restricts role selection to buyer/farmer
- RLS policies prevent users from updating their own role (UPDATE policies check actor_user_id != id OR role != 'admin')
- Admin dashboard includes "Invite Agent/Admin" flow (later phase)
- Optionally store role in auth.users.app_metadata and sync to profiles (advanced approach)
- For dev/testing: controlled "seed admin" method (one-time manual creation via Supabase dashboard or SQL)

15.3 Storage Security & Signed URL Usage
Storage Bucket Configuration:

Bucket Privacy Rules:
- KYC/KYB documents bucket: MUST be PRIVATE only with signed URLs (never public)
- Dispute evidence bucket: MUST be PRIVATE only with signed URLs (never public)
- Inspection evidence bucket: MUST be PRIVATE only with signed URLs (never public)
- Listing photos bucket: RECOMMENDED PRIVATE + signed URLs for security
  - Optionally PUBLIC if SEO/public image URLs are desired (trade-off: security vs convenience)
  - If PUBLIC: ensure RLS policies restrict access to Active listings only

Signed URL Strategy:
- UI gets signed URLs via Supabase client where allowed by RLS
- For extra control, use Edge Function to generate signed URLs
- Signed URL expiry recommended: 15–60 minutes (balance security vs user experience)
- Signed URL caching strategy: cache signed URLs client-side for 10–15 minutes to reduce regeneration overhead
- Listing photos access rule: buyers can read only when listing status is Active (enforced via RLS)

Access Patterns:
- KYC/KYB documents: private bucket, signed URLs only for admin review
- Inspection evidence: private bucket, signed URLs for authorized agents/admins
- Dispute evidence: private bucket, signed URLs for authorized parties (buyer, farmer, admin)

15.4 Soft Delete & Archival Policy
CRITICAL: Preserve data integrity and audit trail.

Tables Requiring Soft Delete (NO hard deletes):
- orders: Use status='archived' or deleted_at timestamp
- wallet_transactions: Immutable records, never delete (use status='cancelled' if needed)
- payout_requests: Use status='archived' or deleted_at timestamp
- admin_audit_logs: Immutable records, never delete or modify
- disputes: Use status='archived' or deleted_at timestamp

Implementation Approach:
- Add deleted_at (timestamp nullable) column to tables that need soft delete
- RLS policies filter out deleted records by default (WHERE deleted_at IS NULL)
- Admin can view archived records with explicit query filter
- Hard deletes only allowed via database admin for GDPR/compliance requests (documented process)

Archival Rules:
- Orders: Archive after completion + 90 days retention period
- Payout requests: Archive after processing + 7 years (financial records)
- Disputes: Archive after resolution + 1 year
- Audit logs: Never archive, permanent retention

15.5 Server-Side Status Transition Guards
CRITICAL: Prevent illegal status transitions via state machine validation.

Order Status State Machine (allowed transitions):
- pending → confirmed → processing → shipped → delivered → completed
- pending → cancelled
- confirmed → cancelled (before processing)
- processing → cancelled (with refund)
- delivered → completed (automatic after X days)
- Any status → cancelled (with appropriate refund logic)

Logistics Status State Machine (allowed transitions):
- assigned → picked_up → in_transit → delivered
- assigned → cancelled
- picked_up → cancelled (with return logic)
- in_transit → delivered

Implementation Requirements:
- ALL status updates (orders + logistics) must be validated server-side
- Validation via Edge Function OR Postgres function (prefer Edge Function for audit trail)
- Prevent illegal jumps (e.g., Delivered → Pending, Cancelled → Processing)
- Status transitions must create entries in order_status_history / logistics_status_updates
- Failed transitions return clear error messages

Edge Function: update-order-status
- Validates current status → new status transition
- Checks user permissions (buyer can cancel pending, farmer can update processing→shipped, etc.)
- Creates status history entry
- Updates order/logistics record atomically
- Returns success/error with reason

15.6 Payout Bank Data Storage
Bank Account Information Handling:
- For MVP: store bank_name, account_number, account_name in payout_requests table
- Mark these fields as sensitive in documentation
- Preferred approach: store encrypted using Edge Function before insert OR store tokenized reference from payment provider
- Document that encryption-at-rest is not automatic in Supabase; must be handled intentionally
- Consider using payment provider's bank account tokenization if available

16. Business Logic Summary
Checkout: 1. Validate cart 2. Group items by merchant 3. Create order per merchant 4. Create inventory reservations 5. Initiate hosted payment
Payment Success: - Consume reservations - Deduct stock - Update order status - Assign delivery - Award loyalty
Produce Verification: - Merchant lists product → pending - Agent inspects → submits - Admin approves/rejects - Product updated with verified grade

17. Implementation Phases
Phase 1: - Auth - Profiles - Catalog - Cart - Orders - Basic Payments
Phase 2: - Merchants - Delivery - Field Agent workflow - Reviews - Loyalty - Promotions
Phase 3: - Search optimization - Real-time updates - Analytics - Notifications - Scaling

18. Production Readiness Status
Schema Integrity: Corrected Order Model: Clean multi-merchant handling Inventory Safety: Reservation layer added Loyalty Safety: Transaction-based Inspection Integrity: Immutable with audit trail Security Model: RBAC enforced Delivery Model: Simplified & consistent
System Status: Architecturally Sound & Production-Ready Foundation

END OF DOCUMENT


Supabase Implementation Notes (Phase 2)
Core decision: Supabase is the backend (Postgres + Auth + Storage + Realtime). No separate Node/Next backend required for Phase 2; use Edge Functions for secure server-side flows.
Auth Providers
• Phone OTP: farmers + buyers sign in with phone number and OTP.
• Email/Password: admins + field agents sign in with email/password.
• Roles stored in public.profiles.role; enforce access with RLS.
Storage Buckets (ALL PRIVATE)
• listing-photos (private, signed URLs for Active listings only)
• kyc-documents (private, signed URLs only for admin review)
• kyb-documents (private, signed URLs only for admin review)
• dispute-evidence (private, signed URLs for authorized parties)
• inspection-evidence (private, signed URLs for agents/admins)
Server-Side Functions (Supabase Edge Functions)
• paystack-webhook: verify events, update WALLET_TRANSACTIONS, escrow release/refunds.
• tracking-update: accept GPS pings from agent app (auth required), write LOGISTICS_STATUS_UPDATES.
• admin-actions: approve/reject KYC/KYB, create admin audit log entries.
Cart + Multi-Merchant Checkout (implement now)
To support cart and order_items cleanly, add these tables and flows:
• carts (buyer_id, status)
• cart_items (cart_id, listing_id, quantity, unit_price_snapshot)
• order_groups / checkouts (buyer_id, paystack_reference, status, total_amount)
• order_items (order_id, listing_id, quantity, price_per_unit_snapshot, line_total)
Checkout split rule: group cart items by farmer_id; create ONE order per farmer, each with many order_items. Orders + wallets/escrow operate per order.
Realtime
• Enable Realtime on LOGISTICS_STATUS_UPDATES and ORDER_STATUS_HISTORY for live tracking + timelines.

========================
UPDATED NEXT STEPS (Supabase Dashboard)
========================

Phase 2A: Database Schema Setup (First Steps)
1. Create all tables in Supabase SQL Editor (profiles, listings, carts, orders, etc.)
2. Add buyer_businesses and buyer_business_reps tables
3. Update kyb_documents to include business_id FK
4. Create all required indexes (see Section 14)
5. Add all constraints (see Section 14)
6. Enable RLS on all tables
7. Create RLS policies (buyer/farmer/agent/admin access boundaries)
8. Create database functions for audit logging, inventory management
9. Create triggers for automatic timestamp updates, audit trail

Phase 2B: Storage Setup
1. Create storage buckets (all PRIVATE):
   - listing-photos
   - kyc-documents
   - kyb-documents
   - dispute-evidence
   - inspection-evidence
2. Configure bucket policies (RLS for storage)
3. Set up signed URL generation via Edge Functions

Phase 2C: Auth Configuration
1. Enable Phone OTP provider for farmers/buyers
2. Enable Email/Password provider for admins/agents
3. Configure role restrictions in signup flow
4. Create seed admin account (one-time manual creation)

Phase 2D: Edge Functions
1. Create paystack-webhook function
2. Create tracking-update function
3. Create admin-actions function
4. Create signed-url-generator function

Phase 2E: Realtime Setup
1. Enable Realtime on logistics_status_updates
2. Enable Realtime on order_status_history
3. Configure Realtime RLS policies

Phase 2F: Dev Seeding & Testing Data
Seed Data Checklist (for development/testing):
1. Create demo users:
   - At least 2 buyers (with different regions)
   - At least 2 farmers (with different regions)
   - 1 admin account (seed admin)
   - 1 agent account (for testing inspections)
2. Create demo listings:
   - At least 2 listings from Farmer 1 (different commodities)
   - At least 2 listings from Farmer 2 (different commodities)
   - Mix of Active and Paused statuses
   - Various grades (A, B, C)
   - Different price ranges
3. Simulate cart checkout:
   - Create cart with items from multiple farmers
   - Execute checkout flow
   - Verify order_group creation
   - Verify multiple orders created (one per farmer)
   - Verify order_items linked correctly
   - Verify inventory reservations created
4. Test status transitions:
   - Test valid transitions (pending → confirmed → processing)
   - Test invalid transitions (should fail with clear error)
   - Verify status history entries created
5. Test soft delete:
   - Archive an order
   - Verify it's hidden from default queries
   - Verify admin can still view archived records
6. Test RLS policies:
   - Buyer can only see their own orders
   - Farmer can only see their own orders/listings
   - Admin can see all records
   - Agent can see assigned inspections/logistics