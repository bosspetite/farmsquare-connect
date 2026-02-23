-- FarmSquare Phase 2 Backend - Seed Data for Development/Testing
-- Run this AFTER all migrations and AFTER creating at least one admin user
-- This creates demo users, listings, and test data

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. This script creates demo data for testing
-- 2. Replace the phone numbers and emails with your test values
-- 3. Users must be created via Supabase Auth first, then profiles are created here
-- 4. For admin/agent users, create them manually via Supabase Dashboard first
-- 5. Adjust quantities, prices, and other values as needed for testing

-- ============================================
-- HELPER: Create demo users (profiles only)
-- ============================================
-- Note: Actual auth.users must be created via Supabase Auth Dashboard or API
-- This assumes auth.users already exist with matching UUIDs

-- Example: Create demo buyer profiles
-- INSERT INTO public.profiles (id, full_name, phone, email, role, address, state, lga)
-- VALUES
--   ('buyer-1-uuid', 'Demo Buyer 1', '+2348012345678', 'buyer1@demo.com', 'buyer', '123 Test St', 'Lagos', 'Ikeja'),
--   ('buyer-2-uuid', 'Demo Buyer 2', '+2348012345679', 'buyer2@demo.com', 'buyer', '456 Test Ave', 'Abuja', 'Garki');

-- Example: Create demo farmer profiles
-- INSERT INTO public.profiles (id, full_name, phone, email, role, address, state, lga)
-- VALUES
--   ('farmer-1-uuid', 'Demo Farmer 1', '+2348012345680', 'farmer1@demo.com', 'farmer', '789 Farm Rd', 'Kaduna', 'Kaduna North'),
--   ('farmer-2-uuid', 'Demo Farmer 2', '+2348012345681', 'farmer2@demo.com', 'farmer', '321 Farm St', 'Ogun', 'Abeokuta');

-- ============================================
-- CREATE DEMO LISTINGS
-- ============================================
-- Replace farmer_id UUIDs with actual farmer profile IDs

-- Example listings for Farmer 1
-- INSERT INTO public.listings (farmer_id, commodity, grade, quantity_kg, price_per_kg, min_order_kg, location_label, region, status, description)
-- VALUES
--   ('farmer-1-uuid', 'Maize', 'A', 5000.00, 250.00, 100.00, 'Kaduna Central Market', 'Kaduna', 'Active', 'Premium quality maize, freshly harvested'),
--   ('farmer-1-uuid', 'Rice', 'B', 3000.00, 450.00, 50.00, 'Kaduna Central Market', 'Kaduna', 'Active', 'Good quality rice, well processed');

-- Example listings for Farmer 2
-- INSERT INTO public.listings (farmer_id, commodity, grade, quantity_kg, price_per_kg, min_order_kg, location_label, region, status, description)
-- VALUES
--   ('farmer-2-uuid', 'Cassava', 'A', 4000.00, 180.00, 200.00, 'Abeokuta Main Market', 'Ogun', 'Active', 'Fresh cassava tubers'),
--   ('farmer-2-uuid', 'Yam', 'B', 2000.00, 350.00, 100.00, 'Abeokuta Main Market', 'Ogun', 'Paused', 'Quality yam tubers');

-- ============================================
-- CREATE DEMO CART AND CART ITEMS
-- ============================================
-- Replace buyer_id and listing_id UUIDs with actual IDs

-- Example: Create active cart for Buyer 1
-- INSERT INTO public.carts (buyer_id, status)
-- VALUES ('buyer-1-uuid', 'active')
-- RETURNING id;

-- Example: Add items to cart (items from multiple farmers to test multi-merchant checkout)
-- INSERT INTO public.cart_items (cart_id, listing_id, quantity_kg, unit_price_snapshot)
-- VALUES
--   ('cart-uuid', 'listing-1-uuid', 200.00, 250.00), -- From Farmer 1
--   ('cart-uuid', 'listing-3-uuid', 300.00, 180.00); -- From Farmer 2

-- ============================================
-- TEST MULTI-MERCHANT CHECKOUT
-- ============================================
-- This simulates the checkout flow:
-- 1. Cart items are grouped by farmer_id
-- 2. One order_group is created
-- 3. Multiple orders are created (one per farmer)
-- 4. Each order has its own order_items

-- Example order_group
-- INSERT INTO public.order_groups (buyer_id, paystack_reference, status, total_amount)
-- VALUES ('buyer-1-uuid', 'test_ref_123', 'paid', 104000.00)
-- RETURNING id;

-- Example orders (one per farmer)
-- INSERT INTO public.orders (order_group_id, buyer_id, farmer_id, total_amount, status, payment_status, payment_method, payment_reference, pickup_location)
-- VALUES
--   ('order-group-uuid', 'buyer-1-uuid', 'farmer-1-uuid', 50000.00, 'Paid', 'Escrowed', 'paystack', 'test_ref_123', 'Kaduna Central Market'),
--   ('order-group-uuid', 'buyer-1-uuid', 'farmer-2-uuid', 54000.00, 'Paid', 'Escrowed', 'paystack', 'test_ref_123', 'Abeokuta Main Market')
-- RETURNING id;

-- Example order_items
-- INSERT INTO public.order_items (order_id, listing_id, quantity_kg, price_per_unit_snapshot, line_total)
-- VALUES
--   ('order-1-uuid', 'listing-1-uuid', 200.00, 250.00, 50000.00),
--   ('order-2-uuid', 'listing-3-uuid', 300.00, 180.00, 54000.00);

-- ============================================
-- CREATE DEMO ESCROWS
-- ============================================
-- INSERT INTO public.escrows (order_id, buyer_id, farmer_id, amount, commission, farmer_amount, status)
-- VALUES
--   ('order-1-uuid', 'buyer-1-uuid', 'farmer-1-uuid', 50000.00, 2500.00, 47500.00, 'held'),
--   ('order-2-uuid', 'buyer-1-uuid', 'farmer-2-uuid', 54000.00, 2700.00, 51300.00, 'held');

-- ============================================
-- CREATE DEMO LOGISTICS
-- ============================================
-- INSERT INTO public.logistics (order_id, agent_id, status, pickup_address, delivery_address, pickup_location, delivery_location)
-- VALUES
--   ('order-1-uuid', 'agent-uuid', 'assigned', 'Kaduna Central Market', '123 Test St, Lagos', '{"lat": 10.5, "lng": 7.4}', '{"lat": 6.5, "lng": 3.4}'),
--   ('order-2-uuid', 'agent-uuid', 'assigned', 'Abeokuta Main Market', '123 Test St, Lagos', '{"lat": 7.2, "lng": 3.3}', '{"lat": 6.5, "lng": 3.4}');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify seed data:

-- Check profiles
-- SELECT id, full_name, role, phone FROM public.profiles ORDER BY role, created_at;

-- Check listings
-- SELECT l.id, p.full_name as farmer_name, l.commodity, l.grade, l.quantity_kg, l.price_per_kg, l.status
-- FROM public.listings l
-- JOIN public.profiles p ON p.id = l.farmer_id
-- ORDER BY l.created_at;

-- Check carts and items
-- SELECT c.id as cart_id, p.full_name as buyer_name, ci.quantity_kg, l.commodity
-- FROM public.carts c
-- JOIN public.profiles p ON p.id = c.buyer_id
-- JOIN public.cart_items ci ON ci.cart_id = c.id
-- JOIN public.listings l ON l.id = ci.listing_id
-- WHERE c.status = 'active';

-- Check orders grouped by farmer
-- SELECT o.id, p1.full_name as buyer_name, p2.full_name as farmer_name, o.total_amount, o.status
-- FROM public.orders o
-- JOIN public.profiles p1 ON p1.id = o.buyer_id
-- JOIN public.profiles p2 ON p2.id = o.farmer_id
-- ORDER BY o.order_group_id, o.created_at;






