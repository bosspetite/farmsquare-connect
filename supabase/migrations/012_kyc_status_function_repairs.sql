-- FarmSquare Phase 2 Backend - KYC status trigger/function repairs
-- Run this after 011_kyc_rls_repairs.sql

-- This repairs stale database functions/triggers that may still reference
-- invalid enum values such as "pednig" instead of valid kyc_status values.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'kyc_status'
      AND e.enumlabel = 'PENDING'
  ) THEN
    ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'PENDING';
  END IF;
END $$;

ALTER TABLE public.profiles
  ALTER COLUMN kyc_status SET DEFAULT 'NOT_STARTED'::public.kyc_status,
  ALTER COLUMN kyb_status SET DEFAULT 'NOT_STARTED'::public.kyc_status;

ALTER TABLE public.buyer_businesses
  ALTER COLUMN status SET DEFAULT 'NOT_STARTED'::public.kyc_status;

ALTER TABLE public.kyc_documents
  ALTER COLUMN verification_status SET DEFAULT 'NOT_STARTED'::public.kyc_status;

ALTER TABLE public.kyb_documents
  ALTER COLUMN verification_status SET DEFAULT 'NOT_STARTED'::public.kyc_status;

ALTER TABLE public.kyc_records
  ALTER COLUMN status SET DEFAULT 'NOT_STARTED'::public.kyc_status;

CREATE OR REPLACE FUNCTION public.sync_profile_verification_from_kyc_record()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    kyc_status = CASE
      WHEN NEW.user_role = 'buyer' THEN kyc_status
      WHEN NEW.status = 'IN_REVIEW'::public.kyc_status THEN 'PENDING'::public.kyc_status
      ELSE NEW.status
    END,
    kyb_status = CASE
      WHEN NEW.user_role = 'buyer' THEN
        CASE
          WHEN NEW.status = 'IN_REVIEW'::public.kyc_status THEN 'PENDING'::public.kyc_status
          ELSE NEW.status
        END
      ELSE kyb_status
    END
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_verification_from_kyc_record_trigger ON public.kyc_records;
CREATE TRIGGER sync_profile_verification_from_kyc_record_trigger
  AFTER INSERT OR UPDATE OF status ON public.kyc_records
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_verification_from_kyc_record();
