-- FarmSquare Phase 2 Backend - Indexes for RLS Performance
-- Run this after 001_initial_schema.sql
-- These indexes are critical for RLS policy performance

-- ============================================
-- CRITICAL FOREIGN KEY INDEXES (RLS Ownership Checks)
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE UNIQUE INDEX idx_profiles_phone ON public.profiles(phone) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Listings indexes
CREATE INDEX idx_listings_farmer_id ON public.listings(farmer_id);
CREATE INDEX idx_listings_farmer_status ON public.listings(farmer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_status ON public.listings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_commodity ON public.listings(commodity) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_region ON public.listings(region) WHERE deleted_at IS NULL;

-- Listing photos indexes
CREATE INDEX idx_listing_photos_listing_id ON public.listing_photos(listing_id);

-- Carts indexes
CREATE INDEX idx_carts_buyer_id ON public.carts(buyer_id);
CREATE INDEX idx_carts_buyer_status ON public.carts(buyer_id, status) WHERE deleted_at IS NULL;

-- Cart items indexes
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_listing_id ON public.cart_items(listing_id);
CREATE UNIQUE INDEX idx_cart_items_unique ON public.cart_items(cart_id, listing_id);

-- Order groups indexes
CREATE INDEX idx_order_groups_buyer_id ON public.order_groups(buyer_id);
CREATE INDEX idx_order_groups_status ON public.order_groups(status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_order_groups_paystack_ref ON public.order_groups(paystack_reference) WHERE paystack_reference IS NOT NULL;

-- Orders indexes
CREATE INDEX idx_orders_order_group_id ON public.orders(order_group_id);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON public.orders(farmer_id);
CREATE INDEX idx_orders_buyer_status ON public.orders(buyer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_farmer_status ON public.orders(farmer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON public.orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created_at ON public.orders(created_at) WHERE deleted_at IS NULL;

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON public.order_items(listing_id);

-- Order status history indexes
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history(created_at);

-- Escrows indexes
CREATE UNIQUE INDEX idx_escrows_order_id ON public.escrows(order_id);
CREATE INDEX idx_escrows_buyer_id ON public.escrows(buyer_id);
CREATE INDEX idx_escrows_farmer_id ON public.escrows(farmer_id);

-- Wallets indexes
CREATE UNIQUE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- Wallet transactions indexes
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_order_id ON public.wallet_transactions(order_id);
CREATE INDEX idx_wallet_transactions_wallet_created ON public.wallet_transactions(wallet_id, created_at);

-- Payout requests indexes
CREATE INDEX idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX idx_payout_requests_wallet_id ON public.payout_requests(wallet_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payout_requests_created_at ON public.payout_requests(created_at) WHERE deleted_at IS NULL;

-- Logistics indexes
CREATE UNIQUE INDEX idx_logistics_order_id ON public.logistics(order_id);
CREATE INDEX idx_logistics_agent_id ON public.logistics(agent_id);
CREATE INDEX idx_logistics_status ON public.logistics(status);

-- Logistics status updates indexes
CREATE INDEX idx_logistics_status_updates_logistics_id ON public.logistics_status_updates(logistics_id);
CREATE INDEX idx_logistics_status_updates_created_at ON public.logistics_status_updates(logistics_id, created_at);

-- Field agent reports indexes
CREATE INDEX idx_field_agent_reports_agent_id ON public.field_agent_reports(agent_id);
CREATE INDEX idx_field_agent_reports_listing_id ON public.field_agent_reports(listing_id);
CREATE INDEX idx_field_agent_reports_order_id ON public.field_agent_reports(order_id);
CREATE INDEX idx_field_agent_reports_created_at ON public.field_agent_reports(created_at);

-- KYC documents indexes
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_verification_status ON public.kyc_documents(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyc_documents_created_at ON public.kyc_documents(created_at) WHERE deleted_at IS NULL;

-- Buyer businesses indexes
CREATE INDEX idx_buyer_businesses_buyer_id ON public.buyer_businesses(buyer_id);
CREATE INDEX idx_buyer_businesses_status ON public.buyer_businesses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_buyer_businesses_cac_number ON public.buyer_businesses(cac_number) WHERE deleted_at IS NULL;

-- Buyer business reps indexes
CREATE INDEX idx_buyer_business_reps_business_id ON public.buyer_business_reps(business_id);

-- KYB documents indexes
CREATE INDEX idx_kyb_documents_business_id ON public.kyb_documents(business_id);
CREATE INDEX idx_kyb_documents_user_id ON public.kyb_documents(user_id);
CREATE INDEX idx_kyb_documents_verification_status ON public.kyb_documents(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyb_documents_created_at ON public.kyb_documents(created_at) WHERE deleted_at IS NULL;

-- Disputes indexes
CREATE INDEX idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX idx_disputes_raised_by ON public.disputes(raised_by);
CREATE INDEX idx_disputes_status ON public.disputes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_created_at ON public.disputes(created_at) WHERE deleted_at IS NULL;

-- Dispute evidence indexes
CREATE INDEX idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);

-- Admin audit logs indexes
CREATE INDEX idx_admin_audit_logs_actor_user_id ON public.admin_audit_logs(actor_user_id);
CREATE INDEX idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Inventory reservations indexes
CREATE INDEX idx_inventory_reservations_order_id ON public.inventory_reservations(order_id);
CREATE INDEX idx_inventory_reservations_listing_id ON public.inventory_reservations(listing_id);
CREATE INDEX idx_inventory_reservations_status ON public.inventory_reservations(status);
CREATE INDEX idx_inventory_reservations_expires_at ON public.inventory_reservations(expires_at) WHERE status = 'active';

