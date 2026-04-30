-- FarmSquare Phase 2 Backend - KYC/KYB pipeline hardening
-- Run this after 009_kyc_notifications.sql

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'kyc-documents',
    'kyc-documents',
    false,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
  ),
  (
    'kyb-documents',
    'kyb-documents',
    false,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "KYC documents readable by owner or admin" ON storage.objects;
CREATE POLICY "KYC documents readable by owner or admin"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('kyc-documents', 'kyb-documents')
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "KYC documents uploadable by owner" ON storage.objects;
CREATE POLICY "KYC documents uploadable by owner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('kyc-documents', 'kyb-documents')
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "KYC documents updatable by owner or admin" ON storage.objects;
CREATE POLICY "KYC documents updatable by owner or admin"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('kyc-documents', 'kyb-documents')
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id IN ('kyc-documents', 'kyb-documents')
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "KYC documents deletable by owner or admin" ON storage.objects;
CREATE POLICY "KYC documents deletable by owner or admin"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('kyc-documents', 'kyb-documents')
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
);

-- ============================================
-- ADMIN KYC NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role public.user_role,
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (recipient_role IS NOT NULL OR recipient_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role
  ON public.notifications(recipient_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user
  ON public.notifications(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_role
  ON public.notifications(recipient_role, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user
  ON public.notifications(recipient_user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read notifications" ON public.notifications;
CREATE POLICY "Users can read notifications"
ON public.notifications FOR SELECT
USING (
  recipient_user_id = auth.uid()
  OR recipient_role = public.get_user_role()
);

DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
CREATE POLICY "Users can mark notifications as read"
ON public.notifications FOR UPDATE
USING (
  recipient_user_id = auth.uid()
  OR recipient_role = public.get_user_role()
)
WITH CHECK (
  recipient_user_id = auth.uid()
  OR recipient_role = public.get_user_role()
);

DROP POLICY IF EXISTS "Users can create admin KYC notifications" ON public.notifications;
CREATE POLICY "Users can create admin KYC notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND recipient_role = 'admin'
  AND type = 'KYC_SUBMITTED'
  AND (
    (
      entity_type = 'kyc_record'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.kyc_records kr
        WHERE kr.id = entity_id
          AND kr.user_id = auth.uid()
      )
    )
    OR (
      entity_type = 'profile'
      AND entity_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Admins can create user notifications" ON public.notifications;
CREATE POLICY "Admins can create user notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin'
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- ============================================
-- BACKFILL LEGACY KYC/KYB INTO KYC RECORDS
-- ============================================

ALTER TABLE public.kyc_records
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

INSERT INTO public.kyc_records (
  user_id,
  user_role,
  status,
  document_type,
  document_url,
  farm_location,
  payload
)
SELECT
  p.id,
  'farmer'::public.user_role,
  (
    CASE
      WHEN p.kyc_status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE p.kyc_status::text
    END
  )::public.kyc_status,
  MAX(CASE WHEN kd.document_type <> 'SELFIE' THEN kd.document_type END),
  MAX(CASE WHEN kd.document_type <> 'SELFIE' THEN kd.document_url END),
  p.address,
  jsonb_strip_nulls(
    jsonb_build_object(
      'fullName', p.full_name,
      'phoneNumber', p.phone,
      'address', p.address,
      'idType', MAX(CASE WHEN kd.document_type <> 'SELFIE' THEN kd.document_type END),
      'idDocumentFile', MAX(CASE WHEN kd.document_type <> 'SELFIE' THEN kd.document_url END),
      'selfieFile', MAX(CASE WHEN kd.document_type = 'SELFIE' THEN kd.document_url END)
    )
  )
FROM public.profiles p
LEFT JOIN public.kyc_documents kd
  ON kd.user_id = p.id
 AND kd.deleted_at IS NULL
WHERE p.role = 'farmer'
  AND NOT EXISTS (
    SELECT 1
    FROM public.kyc_records existing
    WHERE existing.user_id = p.id
  )
  AND (
    p.kyc_status::text <> 'NOT_STARTED'
    OR kd.id IS NOT NULL
  )
GROUP BY p.id, p.full_name, p.phone, p.address, p.kyc_status;

INSERT INTO public.kyc_records (
  user_id,
  user_role,
  status,
  document_type,
  document_url,
  business_name,
  farm_location,
  rejection_reason,
  payload
)
SELECT
  p.id,
  'buyer'::public.user_role,
  (
    CASE
      WHEN COALESCE(bb.status::text, p.kyb_status::text) = 'IN_REVIEW' THEN 'PENDING'
      ELSE COALESCE(bb.status::text, p.kyb_status::text)
    END
  )::public.kyc_status,
  rep.id_type::text,
  MAX(CASE WHEN kd.document_type = 'REP_ID_DOC' THEN kd.document_url END),
  bb.business_name,
  bb.address,
  bb.rejection_reason,
  jsonb_strip_nulls(
    jsonb_build_object(
      'businessName', bb.business_name,
      'businessType', bb.business_type,
      'businessRegistrationNumber', bb.cac_number,
      'businessAddress', bb.address,
      'businessEmail', p.email,
      'businessPhone', p.phone,
      'authorizedRepresentativeName', rep.full_name,
      'authorizedRepresentativeRole', rep.role_title,
      'idType', rep.id_type,
      'idNumber', rep.id_number,
      'authorizedRepresentativeIdFile', MAX(CASE WHEN kd.document_type = 'REP_ID_DOC' THEN kd.document_url END),
      'businessDocumentFile', MAX(CASE WHEN kd.document_type = 'CAC_CERT' THEN kd.document_url END)
    )
  )
FROM public.profiles p
JOIN public.buyer_businesses bb
  ON bb.buyer_id = p.id
 AND bb.deleted_at IS NULL
LEFT JOIN public.buyer_business_reps rep
  ON rep.business_id = bb.id
LEFT JOIN public.kyb_documents kd
  ON kd.business_id = bb.id
 AND kd.deleted_at IS NULL
WHERE p.role = 'buyer'
  AND NOT EXISTS (
    SELECT 1
    FROM public.kyc_records existing
    WHERE existing.user_id = p.id
  )
  AND (
    p.kyb_status::text <> 'NOT_STARTED'
    OR bb.status::text <> 'NOT_STARTED'
    OR kd.id IS NOT NULL
  )
GROUP BY
  p.id,
  p.email,
  p.phone,
  p.kyb_status,
  bb.business_name,
  bb.business_type,
  bb.cac_number,
  bb.address,
  bb.status,
  bb.rejection_reason,
  rep.id_type,
  rep.id_number,
  rep.full_name,
  rep.role_title;
