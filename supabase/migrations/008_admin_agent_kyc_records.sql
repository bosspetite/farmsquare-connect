-- FarmSquare Phase 2 Backend - Admin/Agent read access and KYC records
-- Run this after 007_app_read_models.sql

-- ============================================
-- KYC RECORDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_role user_role NOT NULL,
    status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
    document_type TEXT,
    document_url TEXT,
    business_name TEXT,
    farm_location TEXT,
    notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_records_status ON public.kyc_records(status);
CREATE INDEX IF NOT EXISTS idx_kyc_records_user_role ON public.kyc_records(user_role);
CREATE INDEX IF NOT EXISTS idx_kyc_records_reviewed_by ON public.kyc_records(reviewed_by);

DROP TRIGGER IF EXISTS update_kyc_records_updated_at ON public.kyc_records;
CREATE TRIGGER update_kyc_records_updated_at
  BEFORE UPDATE ON public.kyc_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

DROP TRIGGER IF EXISTS sync_profile_verification_from_kyc_record_trigger ON public.kyc_records;
CREATE TRIGGER sync_profile_verification_from_kyc_record_trigger
  AFTER INSERT OR UPDATE OF status ON public.kyc_records
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_verification_from_kyc_record();

ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own kyc record" ON public.kyc_records;
CREATE POLICY "Users can read own kyc record"
ON public.kyc_records FOR SELECT
USING (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Users can upsert own kyc record" ON public.kyc_records;
CREATE POLICY "Users can upsert own kyc record"
ON public.kyc_records FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own kyc record" ON public.kyc_records;
CREATE POLICY "Users can update own kyc record"
ON public.kyc_records FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
)
WITH CHECK (
  user_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Agents can read farmers" ON public.profiles;
CREATE POLICY "Agents can read farmers"
ON public.profiles FOR SELECT
USING (
  public.get_user_role() = 'agent'
  AND role = 'farmer'
);

DROP POLICY IF EXISTS "Agents can read operational orders" ON public.orders;
CREATE POLICY "Agents can read operational orders"
ON public.orders FOR SELECT
USING (
  public.get_user_role() = 'agent'
);

CREATE OR REPLACE FUNCTION public.get_accessible_orders()
RETURNS TABLE (
  id UUID,
  buyer_id UUID,
  buyer_name TEXT,
  farmer_id UUID,
  farmer_name TEXT,
  listing_id UUID,
  commodity TEXT,
  grade TEXT,
  quantity_kg DECIMAL,
  price_per_kg DECIMAL,
  amount DECIMAL,
  status TEXT,
  payment_status TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  pickup_location TEXT,
  listing_region TEXT,
  buyer_location JSONB,
  farmer_location JSONB,
  delivery_location JSONB,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  processing_at TIMESTAMPTZ,
  pickup_scheduled_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  photo_urls TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.buyer_id,
    buyer.full_name AS buyer_name,
    o.farmer_id,
    farmer.full_name AS farmer_name,
    item.listing_id,
    l.commodity::TEXT,
    l.grade::TEXT,
    item.quantity_kg,
    item.price_per_unit_snapshot AS price_per_kg,
    item.line_total AS amount,
    o.status::TEXT,
    COALESCE(o.payment_status::TEXT, 'Unpaid') AS payment_status,
    o.payment_method,
    o.payment_reference,
    o.pickup_location,
    l.region AS listing_region,
    o.buyer_location,
    o.farmer_location,
    o.delivery_location,
    o.created_at,
    o.accepted_at,
    o.processing_at,
    o.pickup_scheduled_at,
    o.in_transit_at,
    o.delivered_at,
    COALESCE(
      ARRAY_AGG(lp.photo_url ORDER BY lp.display_order) FILTER (WHERE lp.photo_url IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS photo_urls
  FROM public.orders o
  JOIN public.profiles buyer ON buyer.id = o.buyer_id
  JOIN public.profiles farmer ON farmer.id = o.farmer_id
  JOIN LATERAL (
    SELECT
      oi.listing_id,
      oi.quantity_kg,
      oi.price_per_unit_snapshot,
      oi.line_total
    FROM public.order_items oi
    WHERE oi.order_id = o.id
    ORDER BY oi.created_at ASC
    LIMIT 1
  ) item ON TRUE
  JOIN public.listings l ON l.id = item.listing_id
  LEFT JOIN public.listing_photos lp ON lp.listing_id = l.id
  WHERE o.deleted_at IS NULL
    AND auth.uid() IS NOT NULL
    AND (
      o.buyer_id = auth.uid()
      OR o.farmer_id = auth.uid()
      OR public.get_user_role() = 'admin'
      OR public.get_user_role() = 'agent'
    )
  GROUP BY
    o.id,
    o.buyer_id,
    buyer.full_name,
    o.farmer_id,
    farmer.full_name,
    item.listing_id,
    l.commodity,
    l.grade,
    item.quantity_kg,
    item.price_per_unit_snapshot,
    item.line_total,
    o.status,
    o.payment_status,
    o.payment_method,
    o.payment_reference,
    o.pickup_location,
    l.region,
    o.buyer_location,
    o.farmer_location,
    o.delivery_location,
    o.created_at,
    o.accepted_at,
    o.processing_at,
    o.pickup_scheduled_at,
    o.in_transit_at,
    o.delivered_at
  ORDER BY o.created_at DESC;
$$;

GRANT SELECT, INSERT, UPDATE ON public.kyc_records TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_orders() TO authenticated;
