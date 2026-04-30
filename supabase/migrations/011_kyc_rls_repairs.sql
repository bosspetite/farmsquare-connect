-- FarmSquare Phase 2 Backend - KYC/KYB legacy document RLS repairs
-- Run this after 010_kyc_pipeline_hardening.sql

-- ============================================
-- FARMER KYC DOCUMENT UPDATES
-- ============================================

DROP POLICY IF EXISTS "Users can update own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can update own KYC documents"
ON public.kyc_documents FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
)
WITH CHECK (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Users can delete own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can delete own KYC documents"
ON public.kyc_documents FOR DELETE
USING (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

-- ============================================
-- BUYER KYB DOCUMENT UPDATES
-- ============================================

DROP POLICY IF EXISTS "Buyers can update own KYB documents" ON public.kyb_documents;
CREATE POLICY "Buyers can update own KYB documents"
ON public.kyb_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_businesses bb
    WHERE bb.id = kyb_documents.business_id
      AND bb.buyer_id = auth.uid()
  )
  OR public.get_user_role() = 'admin'
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.buyer_businesses bb
    WHERE bb.id = kyb_documents.business_id
      AND bb.buyer_id = auth.uid()
  )
  OR public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Buyers can delete own KYB documents" ON public.kyb_documents;
CREATE POLICY "Buyers can delete own KYB documents"
ON public.kyb_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.buyer_businesses bb
    WHERE bb.id = kyb_documents.business_id
      AND bb.buyer_id = auth.uid()
  )
  OR public.get_user_role() = 'admin'
);
