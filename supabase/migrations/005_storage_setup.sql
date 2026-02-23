-- FarmSquare Phase 2 Backend - Storage Buckets Setup
-- Run this in Supabase SQL Editor after migrations 001-004
-- Creates storage buckets and configures RLS policies

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================
-- Note: Buckets must be created via Supabase Dashboard or Storage API
-- This script provides the SQL for bucket policies only
-- 
-- To create buckets manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create buckets with these names:
--    - listing-photos (PRIVATE)
--    - kyc-documents (PRIVATE)
--    - kyb-documents (PRIVATE)
--    - dispute-evidence (PRIVATE)
--    - inspection-evidence (PRIVATE)

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Listing Photos Bucket Policies
-- Buyers can read photos for Active listings
CREATE POLICY "Buyers can read Active listing photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'listing-photos' AND
  (
    -- Check if listing is Active
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.listing_photos lp ON lp.photo_url LIKE '%' || (storage.objects.name) || '%'
      WHERE lp.listing_id = l.id AND l.status = 'Active' AND l.deleted_at IS NULL
    ) OR
    -- Farmers can read their own listing photos
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.listing_photos lp ON lp.photo_url LIKE '%' || (storage.objects.name) || '%'
      WHERE lp.listing_id = l.id AND l.farmer_id = auth.uid()
    ) OR
    -- Admins can read all
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Farmers can upload photos for their listings
CREATE POLICY "Farmers can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'farmer'
  )
);

-- Farmers can update/delete their own listing photos
CREATE POLICY "Farmers can manage own listing photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'farmer'
  )
);

CREATE POLICY "Farmers can delete own listing photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'farmer'
  )
);

-- KYC Documents Bucket Policies
-- Users can read their own KYC documents
CREATE POLICY "Users can read own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (
    -- User owns the document
    (storage.objects.name)::text LIKE '%' || auth.uid()::text || '%' OR
    -- Admin can read all
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Users can upload their own KYC documents
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.objects.name)::text LIKE '%' || auth.uid()::text || '%'
);

-- KYB Documents Bucket Policies
-- Buyers can read KYB documents for their businesses
CREATE POLICY "Buyers can read own KYB documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyb-documents' AND
  (
    -- Check if document belongs to buyer's business
    EXISTS (
      SELECT 1 FROM public.buyer_businesses bb
      JOIN public.kyb_documents kd ON kd.business_id = bb.id
      WHERE bb.buyer_id = auth.uid() AND
      (storage.objects.name)::text LIKE '%' || kd.id::text || '%'
    ) OR
    -- Admin can read all
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Buyers can upload KYB documents for their businesses
CREATE POLICY "Buyers can upload KYB documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyb-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer'
  )
);

-- Dispute Evidence Bucket Policies
-- Users can read evidence for disputes they're involved in
CREATE POLICY "Users can read accessible dispute evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-evidence' AND
  (
    -- Check if user is involved in the dispute
    EXISTS (
      SELECT 1 FROM public.disputes d
      JOIN public.orders o ON o.id = d.order_id
      JOIN public.dispute_evidence de ON de.photo_url LIKE '%' || (storage.objects.name) || '%'
      WHERE de.dispute_id = d.id AND
      (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid() OR d.raised_by = auth.uid())
    ) OR
    -- Admin can read all
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Users can upload evidence for disputes they raised
CREATE POLICY "Users can upload dispute evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dispute-evidence' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('buyer', 'farmer')
  )
);

-- Inspection Evidence Bucket Policies
-- Agents and admins can read inspection evidence
CREATE POLICY "Agents and admins can read inspection evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-evidence' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin')
  )
);

-- Agents can upload inspection evidence
CREATE POLICY "Agents can upload inspection evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-evidence' AND
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'agent'
  )
);






