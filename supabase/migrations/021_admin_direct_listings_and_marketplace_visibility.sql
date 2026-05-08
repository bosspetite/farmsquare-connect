-- 021_admin_direct_listings_and_marketplace_visibility.sql
-- Purpose:
-- 1) Allow admins to own/publish listings directly.
-- 2) Keep farmer-owned listings restricted to approved farmers for active marketplace visibility.
-- 3) Keep RLS secure while unblocking admin/farmer listing publish flows.

-- ---------------------------------------------------------------------------
-- A) Relax table constraints to allow admin-owned listing/order ownership.
-- ---------------------------------------------------------------------------

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_farmer_role;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_farmer_role;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_owner_role;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_seller_role;

CREATE OR REPLACE FUNCTION public.validate_listing_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_kyc_status public.kyc_status;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  SELECT p.role, p.kyc_status, p.deleted_at
  INTO v_role, v_kyc_status, v_deleted_at
  FROM public.profiles p
  WHERE p.id = NEW.farmer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing owner profile does not exist: %', NEW.farmer_id;
  END IF;

  IF v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Listing owner profile is deleted: %', NEW.farmer_id;
  END IF;

  IF v_role NOT IN ('farmer', 'admin') THEN
    RAISE EXCEPTION 'Listing owner must be farmer or admin. Got role=% for profile=%', v_role, NEW.farmer_id;
  END IF;

  IF NEW.status = 'Active'::public.listing_status AND v_role = 'farmer' AND v_kyc_status <> 'APPROVED'::public.kyc_status THEN
    RAISE EXCEPTION 'Only approved farmers can publish active listings. Profile=%', NEW.farmer_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_listing_owner_role_trigger ON public.listings;

CREATE TRIGGER validate_listing_owner_role_trigger
BEFORE INSERT OR UPDATE OF farmer_id, status
ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_listing_owner_role();

CREATE OR REPLACE FUNCTION public.validate_order_seller_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  SELECT p.role, p.deleted_at
  INTO v_role, v_deleted_at
  FROM public.profiles p
  WHERE p.id = NEW.farmer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order seller profile does not exist: %', NEW.farmer_id;
  END IF;

  IF v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Order seller profile is deleted: %', NEW.farmer_id;
  END IF;

  IF v_role NOT IN ('farmer', 'admin') THEN
    RAISE EXCEPTION 'Order seller must be farmer or admin. Got role=% for profile=%', v_role, NEW.farmer_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_seller_role_trigger ON public.orders;

CREATE TRIGGER validate_order_seller_role_trigger
BEFORE INSERT OR UPDATE OF farmer_id
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_seller_role();

-- ---------------------------------------------------------------------------
-- B) Marketplace read models: show active listings owned by approved farmers
--    or by admins.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_marketplace_listings()
RETURNS TABLE (
  id UUID,
  farmer_id UUID,
  farmer_name TEXT,
  commodity TEXT,
  grade TEXT,
  quantity_kg DECIMAL,
  price_per_kg DECIMAL,
  min_order_kg DECIMAL,
  location_label TEXT,
  region TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  photo_urls TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.farmer_id,
    p.full_name AS farmer_name,
    l.commodity::TEXT,
    l.grade::TEXT,
    l.quantity_kg,
    l.price_per_kg,
    l.min_order_kg,
    l.location_label,
    l.region,
    l.status::TEXT,
    l.description,
    l.created_at,
    COALESCE(
      ARRAY_AGG(lp.photo_url ORDER BY lp.display_order) FILTER (WHERE lp.photo_url IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS photo_urls
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.farmer_id
  LEFT JOIN public.listing_photos lp ON lp.listing_id = l.id
  WHERE l.deleted_at IS NULL
    AND l.status = 'Active'
    AND p.deleted_at IS NULL
    AND (
      p.role = 'admin'
      OR (p.role = 'farmer' AND p.kyc_status = 'APPROVED')
    )
  GROUP BY
    l.id,
    l.farmer_id,
    p.full_name,
    l.commodity,
    l.grade,
    l.quantity_kg,
    l.price_per_kg,
    l.min_order_kg,
    l.location_label,
    l.region,
    l.status,
    l.description,
    l.created_at
  ORDER BY l.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_listing(p_listing_id UUID)
RETURNS TABLE (
  id UUID,
  farmer_id UUID,
  farmer_name TEXT,
  commodity TEXT,
  grade TEXT,
  quantity_kg DECIMAL,
  price_per_kg DECIMAL,
  min_order_kg DECIMAL,
  location_label TEXT,
  region TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  photo_urls TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.get_marketplace_listings()
  WHERE id = p_listing_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_listings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_listing(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- C) Listings RLS policies.
-- ---------------------------------------------------------------------------

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read Active listings" ON public.listings;
DROP POLICY IF EXISTS "Farmers can insert own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can insert listings for farmers" ON public.listings;
DROP POLICY IF EXISTS "Farmers can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
DROP POLICY IF EXISTS "Farmers can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;

CREATE POLICY "Anyone can read Active listings"
ON public.listings FOR SELECT
USING (
  (
    status = 'Active'
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = listings.farmer_id
        AND p.deleted_at IS NULL
        AND (
          p.role = 'admin'
          OR (p.role = 'farmer' AND p.kyc_status = 'APPROVED')
        )
    )
  )
  OR farmer_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

CREATE POLICY "Farmers can insert own listings"
ON public.listings FOR INSERT
WITH CHECK (
  farmer_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'farmer'
      AND p.kyc_status = 'APPROVED'
      AND p.deleted_at IS NULL
  )
);

CREATE POLICY "Admins can insert listings for farmers or self"
ON public.listings FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles owner_profile
    WHERE owner_profile.id = listings.farmer_id
      AND owner_profile.deleted_at IS NULL
      AND (
        owner_profile.role = 'admin'
        OR owner_profile.role = 'farmer'
      )
  )
);

CREATE POLICY "Farmers can update own listings"
ON public.listings FOR UPDATE
USING (
  farmer_id = auth.uid()
  AND public.get_user_role() = 'farmer'
)
WITH CHECK (
  farmer_id = auth.uid()
  AND public.get_user_role() = 'farmer'
);

CREATE POLICY "Admins can update any listing"
ON public.listings FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (
  public.get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles owner_profile
    WHERE owner_profile.id = listings.farmer_id
      AND owner_profile.deleted_at IS NULL
      AND owner_profile.role IN ('admin', 'farmer')
  )
);

CREATE POLICY "Farmers can delete own listings"
ON public.listings FOR DELETE
USING (
  farmer_id = auth.uid()
  AND public.get_user_role() = 'farmer'
);

CREATE POLICY "Admins can delete any listing"
ON public.listings FOR DELETE
USING (public.get_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- D) Listing photo RLS policies.
-- ---------------------------------------------------------------------------

ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read Active listing photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Farmers can manage own listing photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Admins can manage all listing photos" ON public.listing_photos;

CREATE POLICY "Anyone can read Active listing photos"
ON public.listing_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.status = 'Active'
      AND l.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.farmer_id = auth.uid()
  )
  OR public.get_user_role() = 'admin'
);

CREATE POLICY "Farmers can manage own listing photos"
ON public.listing_photos FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.farmer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.farmer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all listing photos"
ON public.listing_photos FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');
