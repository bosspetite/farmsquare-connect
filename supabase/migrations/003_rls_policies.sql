-- FarmSquare Phase 2 Backend - Row Level Security (RLS) Policies
-- Run this after 002_indexes.sql
-- These policies enforce role-based access control

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_business_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_agent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get current user role
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be changed
);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id AND role IN ('buyer', 'farmer')); -- Only buyer/farmer self-signup

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role() = 'admin');

-- Admins can update any profile (including role changes)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- BUYER BUSINESSES POLICIES
-- ============================================

-- Buyers can read their own business info
CREATE POLICY "Buyers can read own business"
ON public.buyer_businesses FOR SELECT
USING (
  buyer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Buyers can insert their own business
CREATE POLICY "Buyers can insert own business"
ON public.buyer_businesses FOR INSERT
WITH CHECK (
  buyer_id = auth.uid() AND
  public.get_user_role() = 'buyer'
);

-- Buyers can update their own business (if not approved)
CREATE POLICY "Buyers can update own business"
ON public.buyer_businesses FOR UPDATE
USING (buyer_id = auth.uid() AND status != 'APPROVED')
WITH CHECK (buyer_id = auth.uid());

-- Admins can update any business
CREATE POLICY "Admins can update any business"
ON public.buyer_businesses FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- BUYER BUSINESS REPS POLICIES
-- ============================================

-- Buyers can read reps for their businesses
CREATE POLICY "Buyers can read own business reps"
ON public.buyer_business_reps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_businesses
    WHERE id = buyer_business_reps.business_id AND buyer_id = auth.uid()
  ) OR
  public.get_user_role() = 'admin'
);

-- Buyers can manage reps for their businesses
CREATE POLICY "Buyers can manage own business reps"
ON public.buyer_business_reps FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_businesses
    WHERE id = buyer_business_reps.business_id AND buyer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buyer_businesses
    WHERE id = buyer_business_reps.business_id AND buyer_id = auth.uid()
  )
);

-- ============================================
-- KYC DOCUMENTS POLICIES
-- ============================================

-- Users can read their own KYC documents
CREATE POLICY "Users can read own KYC documents"
ON public.kyc_documents FOR SELECT
USING (
  user_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Users can insert their own KYC documents
CREATE POLICY "Users can insert own KYC documents"
ON public.kyc_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update KYC documents
CREATE POLICY "Admins can update KYC documents"
ON public.kyc_documents FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- KYB DOCUMENTS POLICIES
-- ============================================

-- Buyers can read KYB docs for their businesses
CREATE POLICY "Buyers can read own KYB documents"
ON public.kyb_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_businesses
    WHERE id = kyb_documents.business_id AND buyer_id = auth.uid()
  ) OR
  public.get_user_role() = 'admin'
);

-- Buyers can insert KYB docs for their businesses
CREATE POLICY "Buyers can insert own KYB documents"
ON public.kyb_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buyer_businesses
    WHERE id = kyb_documents.business_id AND buyer_id = auth.uid()
  )
);

-- Admins can update KYB documents
CREATE POLICY "Admins can update KYB documents"
ON public.kyb_documents FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- LISTINGS POLICIES
-- ============================================

-- Everyone can read Active listings
CREATE POLICY "Anyone can read Active listings"
ON public.listings FOR SELECT
USING (
  status = 'Active' AND deleted_at IS NULL OR
  farmer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Farmers can insert their own listings
CREATE POLICY "Farmers can insert own listings"
ON public.listings FOR INSERT
WITH CHECK (
  farmer_id = auth.uid() AND
  public.get_user_role() = 'farmer'
);

-- Farmers can update their own listings
CREATE POLICY "Farmers can update own listings"
ON public.listings FOR UPDATE
USING (farmer_id = auth.uid())
WITH CHECK (farmer_id = auth.uid());

-- Admins can update any listing
CREATE POLICY "Admins can update any listing"
ON public.listings FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- LISTING PHOTOS POLICIES
-- ============================================

-- Anyone can read photos for Active listings
CREATE POLICY "Anyone can read Active listing photos"
ON public.listing_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_photos.listing_id AND status = 'Active' AND deleted_at IS NULL
  ) OR
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_photos.listing_id AND farmer_id = auth.uid()
  ) OR
  public.get_user_role() = 'admin'
);

-- Farmers can manage photos for their listings
CREATE POLICY "Farmers can manage own listing photos"
ON public.listing_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_photos.listing_id AND farmer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_photos.listing_id AND farmer_id = auth.uid()
  )
);

-- ============================================
-- CARTS POLICIES
-- ============================================

-- Buyers can read their own carts
CREATE POLICY "Buyers can read own carts"
ON public.carts FOR SELECT
USING (
  buyer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Buyers can insert their own carts
CREATE POLICY "Buyers can insert own carts"
ON public.carts FOR INSERT
WITH CHECK (
  buyer_id = auth.uid() AND
  public.get_user_role() = 'buyer'
);

-- Buyers can update their own carts
CREATE POLICY "Buyers can update own carts"
ON public.carts FOR UPDATE
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- ============================================
-- CART ITEMS POLICIES
-- ============================================

-- Buyers can read items in their carts
CREATE POLICY "Buyers can read own cart items"
ON public.cart_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = cart_items.cart_id AND buyer_id = auth.uid()
  ) OR
  public.get_user_role() = 'admin'
);

-- Buyers can manage items in their carts
CREATE POLICY "Buyers can manage own cart items"
ON public.cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = cart_items.cart_id AND buyer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = cart_items.cart_id AND buyer_id = auth.uid()
  )
);

-- ============================================
-- ORDER GROUPS POLICIES
-- ============================================

-- Buyers can read their own order groups
CREATE POLICY "Buyers can read own order groups"
ON public.order_groups FOR SELECT
USING (
  buyer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Buyers can insert their own order groups
CREATE POLICY "Buyers can insert own order groups"
ON public.order_groups FOR INSERT
WITH CHECK (
  buyer_id = auth.uid() AND
  public.get_user_role() = 'buyer'
);

-- Admins can update order groups
CREATE POLICY "Admins can update order groups"
ON public.order_groups FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Buyers can read their own orders
CREATE POLICY "Buyers can read own orders"
ON public.orders FOR SELECT
USING (
  buyer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Farmers can read orders for their listings
CREATE POLICY "Farmers can read own orders"
ON public.orders FOR SELECT
USING (
  farmer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Buyers can insert orders (via checkout flow)
CREATE POLICY "Buyers can insert orders"
ON public.orders FOR INSERT
WITH CHECK (
  buyer_id = auth.uid() AND
  public.get_user_role() = 'buyer'
);

-- Farmers can update orders they own (status updates)
CREATE POLICY "Farmers can update own orders"
ON public.orders FOR UPDATE
USING (farmer_id = auth.uid())
WITH CHECK (farmer_id = auth.uid());

-- Buyers can update their own orders (cancellation)
CREATE POLICY "Buyers can update own orders"
ON public.orders FOR UPDATE
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Admins can update any order
CREATE POLICY "Admins can update any order"
ON public.orders FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Users can read order items for orders they can access
CREATE POLICY "Users can read accessible order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id AND (
      buyer_id = auth.uid() OR
      farmer_id = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  )
);

-- System can insert order items (via checkout)
CREATE POLICY "System can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- ============================================
-- ORDER STATUS HISTORY POLICIES
-- ============================================

-- Users can read status history for orders they can access
CREATE POLICY "Users can read accessible order status history"
ON public.order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_status_history.order_id AND (
      buyer_id = auth.uid() OR
      farmer_id = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  )
);

-- System can insert status history (via Edge Function)
CREATE POLICY "System can insert order status history"
ON public.order_status_history FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- ============================================
-- ESCROWS POLICIES
-- ============================================

-- Buyers and farmers can read escrows for their orders
CREATE POLICY "Users can read own escrows"
ON public.escrows FOR SELECT
USING (
  buyer_id = auth.uid() OR
  farmer_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- System can insert escrows (via checkout)
CREATE POLICY "System can insert escrows"
ON public.escrows FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- Admins can update escrows (release/refund)
CREATE POLICY "Admins can update escrows"
ON public.escrows FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- WALLETS POLICIES
-- ============================================

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet"
ON public.wallets FOR SELECT
USING (
  user_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- System can insert wallets (auto-created on profile creation)
CREATE POLICY "System can insert wallets"
ON public.wallets FOR INSERT
WITH CHECK (true); -- Will be validated by trigger

-- System can update wallets (via transactions)
CREATE POLICY "System can update wallets"
ON public.wallets FOR UPDATE
USING (true); -- Will be validated by Edge Function

-- ============================================
-- WALLET TRANSACTIONS POLICIES
-- ============================================

-- Users can read transactions for their wallets
CREATE POLICY "Users can read own wallet transactions"
ON public.wallet_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE id = wallet_transactions.wallet_id AND user_id = auth.uid()
  ) OR
  public.get_user_role() = 'admin'
);

-- System can insert wallet transactions
CREATE POLICY "System can insert wallet transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- ============================================
-- PAYOUT REQUESTS POLICIES
-- ============================================

-- Users can read their own payout requests
CREATE POLICY "Users can read own payout requests"
ON public.payout_requests FOR SELECT
USING (
  user_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Users can insert their own payout requests
CREATE POLICY "Users can insert own payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update payout requests
CREATE POLICY "Admins can update payout requests"
ON public.payout_requests FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- LOGISTICS POLICIES
-- ============================================

-- Buyers, farmers, and agents can read logistics for their orders
CREATE POLICY "Users can read accessible logistics"
ON public.logistics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = logistics.order_id AND (
      buyer_id = auth.uid() OR
      farmer_id = auth.uid() OR
      agent_id = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  )
);

-- System can insert logistics
CREATE POLICY "System can insert logistics"
ON public.logistics FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- Agents can update logistics they're assigned to
CREATE POLICY "Agents can update assigned logistics"
ON public.logistics FOR UPDATE
USING (
  agent_id = auth.uid() AND
  public.get_user_role() = 'agent'
)
WITH CHECK (
  agent_id = auth.uid() AND
  public.get_user_role() = 'agent'
);

-- Admins can update any logistics
CREATE POLICY "Admins can update any logistics"
ON public.logistics FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- LOGISTICS STATUS UPDATES POLICIES
-- ============================================

-- Users can read status updates for logistics they can access
CREATE POLICY "Users can read accessible logistics status updates"
ON public.logistics_status_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.logistics
    WHERE id = logistics_status_updates.logistics_id AND (
      EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = logistics.order_id AND (
          buyer_id = auth.uid() OR
          farmer_id = auth.uid()
        )
      ) OR
      agent_id = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  )
);

-- Agents can insert status updates for assigned logistics
CREATE POLICY "Agents can insert logistics status updates"
ON public.logistics_status_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.logistics
    WHERE id = logistics_status_updates.logistics_id AND
    agent_id = auth.uid() AND
    public.get_user_role() = 'agent'
  )
);

-- ============================================
-- FIELD AGENT REPORTS POLICIES
-- ============================================

-- Agents can read their own reports
CREATE POLICY "Agents can read own reports"
ON public.field_agent_reports FOR SELECT
USING (
  agent_id = auth.uid() OR
  public.get_user_role() = 'admin'
);

-- Agents can insert their own reports
CREATE POLICY "Agents can insert own reports"
ON public.field_agent_reports FOR INSERT
WITH CHECK (
  agent_id = auth.uid() AND
  public.get_user_role() = 'agent'
);

-- ============================================
-- DISPUTES POLICIES
-- ============================================

-- Users can read disputes for their orders
CREATE POLICY "Users can read accessible disputes"
ON public.disputes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = disputes.order_id AND (
      buyer_id = auth.uid() OR
      farmer_id = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  ) OR
  raised_by = auth.uid()
);

-- Buyers and farmers can insert disputes for their orders
CREATE POLICY "Users can insert disputes"
ON public.disputes FOR INSERT
WITH CHECK (
  raised_by = auth.uid() AND
  public.get_user_role() IN ('buyer', 'farmer')
);

-- Admins can update disputes
CREATE POLICY "Admins can update disputes"
ON public.disputes FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- DISPUTE EVIDENCE POLICIES
-- ============================================

-- Users can read evidence for disputes they can access
CREATE POLICY "Users can read accessible dispute evidence"
ON public.dispute_evidence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.disputes
    WHERE id = dispute_evidence.dispute_id AND (
      EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = disputes.order_id AND (
          buyer_id = auth.uid() OR
          farmer_id = auth.uid()
        )
      ) OR
      raised_by = auth.uid() OR
      public.get_user_role() = 'admin'
    )
  )
);

-- Users can insert evidence for disputes they raised
CREATE POLICY "Users can insert dispute evidence"
ON public.dispute_evidence FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.disputes
    WHERE id = dispute_evidence.dispute_id AND raised_by = auth.uid()
  )
);

-- ============================================
-- ADMIN AUDIT LOGS POLICIES
-- ============================================

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.get_user_role() = 'admin');

-- System can insert audit logs (via Edge Function)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- ============================================
-- INVENTORY RESERVATIONS POLICIES
-- ============================================

-- System can read inventory reservations
CREATE POLICY "System can read inventory reservations"
ON public.inventory_reservations FOR SELECT
USING (true); -- Will be filtered by application logic

-- System can insert inventory reservations
CREATE POLICY "System can insert inventory reservations"
ON public.inventory_reservations FOR INSERT
WITH CHECK (true); -- Will be validated by Edge Function

-- System can update inventory reservations
CREATE POLICY "System can update inventory reservations"
ON public.inventory_reservations FOR UPDATE
USING (true); -- Will be validated by Edge Function

