-- FarmSquare Phase 2 Backend - KYC notifications and pending review flow
-- Run this after 008_admin_agent_kyc_records.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'kyc_status_v2'
  ) THEN
    CREATE TYPE public.kyc_status_v2 AS ENUM ('NOT_STARTED', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');
  END IF;
END $$;

ALTER TABLE public.profiles
  ALTER COLUMN kyc_status DROP DEFAULT,
  ALTER COLUMN kyb_status DROP DEFAULT;

ALTER TABLE public.buyer_businesses
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.kyc_documents
  ALTER COLUMN verification_status DROP DEFAULT;

ALTER TABLE public.kyb_documents
  ALTER COLUMN verification_status DROP DEFAULT;

ALTER TABLE public.kyc_records
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN kyc_status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN kyc_status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE kyc_status::text
    END
  )::public.kyc_status_v2,
  ALTER COLUMN kyb_status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN kyb_status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE kyb_status::text
    END
  )::public.kyc_status_v2;

ALTER TABLE public.buyer_businesses
  ALTER COLUMN status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE status::text
    END
  )::public.kyc_status_v2;

ALTER TABLE public.kyc_documents
  ALTER COLUMN verification_status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN verification_status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE verification_status::text
    END
  )::public.kyc_status_v2;

ALTER TABLE public.kyb_documents
  ALTER COLUMN verification_status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN verification_status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE verification_status::text
    END
  )::public.kyc_status_v2;

ALTER TABLE public.kyc_records
  ALTER COLUMN status TYPE public.kyc_status_v2
  USING (
    CASE
      WHEN status::text = 'IN_REVIEW' THEN 'PENDING'
      ELSE status::text
    END
  )::public.kyc_status_v2;

ALTER TABLE public.profiles
  ALTER COLUMN kyc_status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2,
  ALTER COLUMN kyb_status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2;

ALTER TABLE public.buyer_businesses
  ALTER COLUMN status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2;

ALTER TABLE public.kyc_documents
  ALTER COLUMN verification_status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2;

ALTER TABLE public.kyb_documents
  ALTER COLUMN verification_status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2;

ALTER TABLE public.kyc_records
  ALTER COLUMN status SET DEFAULT 'NOT_STARTED'::public.kyc_status_v2;

DROP TYPE public.kyc_status;
ALTER TYPE public.kyc_status_v2 RENAME TO kyc_status;

ALTER TABLE public.kyc_records
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

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

CREATE OR REPLACE FUNCTION public.sync_profile_verification_from_kyc_record()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    kyc_status = CASE
      WHEN NEW.user_role = 'buyer' THEN kyc_status
      ELSE NEW.status
    END,
    kyb_status = CASE
      WHEN NEW.user_role = 'buyer' THEN NEW.status
      ELSE kyb_status
    END
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  AND entity_type = 'kyc_record'
  AND EXISTS (
    SELECT 1
    FROM public.kyc_records kr
    WHERE kr.id = entity_id
      AND kr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can create user notifications" ON public.notifications;
CREATE POLICY "Admins can create user notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin'
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
