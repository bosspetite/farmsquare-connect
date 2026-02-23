-- FarmSquare Phase 2 Backend - Initial Database Schema
-- Run this in Supabase SQL Editor
-- This migration creates all core tables, enums, and constraints

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'agent', 'admin');
CREATE TYPE kyc_status AS ENUM ('NOT_STARTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE listing_status AS ENUM ('Draft', 'Active', 'Paused', 'SoldOut', 'Sold', 'Archived');
CREATE TYPE order_status AS ENUM ('Pending', 'Paid', 'Accepted', 'Rejected', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered', 'Cancelled', 'Refunded');
CREATE TYPE payment_status AS ENUM ('Unpaid', 'Paid', 'Escrowed', 'Released', 'Refunded');
CREATE TYPE grade_type AS ENUM ('A', 'B', 'C');
CREATE TYPE commodity_type AS ENUM ('Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum');
CREATE TYPE withdrawal_status AS ENUM ('Submitted', 'InReview', 'Paid', 'Rejected');
CREATE TYPE transaction_type AS ENUM ('Credit', 'Debit', 'fund', 'payment', 'release', 'withdrawal', 'refund', 'commission');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE dispute_status AS ENUM ('Open', 'UnderReview', 'Resolved', 'Closed');
CREATE TYPE dispute_type AS ENUM ('quality', 'quantity', 'delivery', 'payment', 'other');
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');
CREATE TYPE business_type AS ENUM ('INDIVIDUAL', 'COMPANY', 'PARTNERSHIP');
CREATE TYPE id_type AS ENUM ('NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD');
CREATE TYPE logistics_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE cart_status AS ENUM ('active', 'abandoned', 'completed');
CREATE TYPE order_group_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- ============================================
-- 2. PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL, -- E.164 format
    email TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    kyc_status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    kyb_status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    address TEXT,
    state TEXT,
    lga TEXT, -- Local Government Area
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- ============================================
-- 3. KYB BUSINESS VERIFICATION TABLES
-- ============================================

CREATE TABLE public.buyer_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type business_type NOT NULL,
    cac_number TEXT NOT NULL,
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT buyer_businesses_buyer_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = buyer_id AND role = 'buyer')
    )
);

CREATE TABLE public.buyer_business_reps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.buyer_businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    id_type id_type NOT NULL,
    id_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'SELFIE'
    document_url TEXT NOT NULL,
    verification_status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.kyb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.buyer_businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Optional convenience FK
    document_type TEXT NOT NULL, -- 'CAC_CERT', 'REP_ID_DOC', etc.
    document_url TEXT NOT NULL,
    verification_status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- 4. LISTINGS & PRODUCTS
-- ============================================

CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commodity commodity_type NOT NULL,
    grade grade_type NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg >= 0),
    price_per_kg DECIMAL(10, 2) NOT NULL CHECK (price_per_kg >= 0),
    min_order_kg DECIMAL(10, 2) CHECK (min_order_kg >= 0),
    location_label TEXT NOT NULL,
    region TEXT NOT NULL,
    status listing_status NOT NULL DEFAULT 'Draft',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT listings_farmer_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = farmer_id AND role = 'farmer')
    )
);

CREATE TABLE public.listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. CARTS & CHECKOUT
-- ============================================

CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status cart_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT carts_buyer_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = buyer_id AND role = 'buyer')
    ),
    CONSTRAINT one_active_cart_per_buyer UNIQUE NULLS NOT DISTINCT (buyer_id, status) 
        WHERE status = 'active' AND deleted_at IS NULL
);

CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    unit_price_snapshot DECIMAL(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, listing_id)
);

CREATE TABLE public.order_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE,
    status order_group_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- 6. ORDERS & ORDER ITEMS
-- ============================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_group_id UUID REFERENCES public.order_groups(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status NOT NULL DEFAULT 'Pending',
    payment_status payment_status DEFAULT 'Unpaid',
    payment_method TEXT, -- 'paystack', 'wallet'
    payment_reference TEXT,
    pickup_location TEXT NOT NULL,
    buyer_location JSONB, -- {lat, lng}
    farmer_location JSONB, -- {lat, lng}
    delivery_location JSONB, -- {lat, lng}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    processing_at TIMESTAMPTZ,
    pickup_scheduled_at TIMESTAMPTZ,
    in_transit_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT orders_buyer_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = buyer_id AND role = 'buyer')
    ),
    CONSTRAINT orders_farmer_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = farmer_id AND role = 'farmer')
    )
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    price_per_unit_snapshot DECIMAL(10, 2) NOT NULL CHECK (price_per_unit_snapshot >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. ESCROW & PAYMENTS
-- ============================================

CREATE TABLE public.escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    commission DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (commission >= 0),
    farmer_amount DECIMAL(10, 2) NOT NULL CHECK (farmer_amount >= 0),
    status escrow_status NOT NULL DEFAULT 'held',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

-- ============================================
-- 8. WALLETS & TRANSACTIONS
-- ============================================

CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    available DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (available >= 0),
    pending DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (pending >= 0),
    locked DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (locked >= 0),
    withdrawn DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (withdrawn >= 0),
    currency TEXT NOT NULL DEFAULT '₦',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    reference TEXT, -- Paystack reference or transaction ID
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL, -- SENSITIVE: Consider encryption
    account_name TEXT NOT NULL, -- SENSITIVE: Consider encryption
    status withdrawal_status NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- 9. LOGISTICS & DELIVERY TRACKING
-- ============================================

CREATE TABLE public.logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status logistics_status NOT NULL DEFAULT 'assigned',
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_location JSONB, -- {lat, lng}
    delivery_location JSONB, -- {lat, lng}
    current_location JSONB, -- {lat, lng}
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    CONSTRAINT logistics_agent_role CHECK (
        agent_id IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = agent_id AND role = 'agent')
    )
);

CREATE TABLE public.logistics_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logistics_id UUID NOT NULL REFERENCES public.logistics(id) ON DELETE CASCADE,
    status logistics_status NOT NULL,
    location_text TEXT,
    location JSONB, -- {lat, lng}
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. FIELD AGENT REPORTS & INSPECTIONS
-- ============================================

CREATE TABLE public.field_agent_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL, -- 'inspection', 'delivery_update', etc.
    notes TEXT,
    photos JSONB, -- Array of photo URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT field_agent_reports_agent_role CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = agent_id AND role = 'agent')
    )
);

-- ============================================
-- 11. DISPUTES
-- ============================================

CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    raised_by_role user_role NOT NULL CHECK (raised_by_role IN ('buyer', 'farmer')),
    type dispute_type NOT NULL,
    status dispute_status NOT NULL DEFAULT 'Open',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    outcome TEXT CHECK (outcome IN ('buyer_favor', 'farmer_favor', 'partial', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT disputes_resolver_admin CHECK (
        resolved_by IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = resolved_by AND role = 'admin')
    )
);

CREATE TABLE public.dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. AUDIT LOGS
-- ============================================

CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    before_json JSONB,
    after_json JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admin_audit_logs_actor_admin CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = actor_user_id AND role = 'admin')
    )
);

-- ============================================
-- 13. INVENTORY RESERVATIONS
-- ============================================

CREATE TABLE public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed', 'released')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);






