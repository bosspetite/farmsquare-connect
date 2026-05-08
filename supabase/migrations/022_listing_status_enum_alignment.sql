-- 022_listing_status_enum_alignment.sql
-- Purpose:
-- 1) Document and enforce canonical listing_status enum usage.
-- 2) Rebuild listing marketplace functions and RLS filters with explicit enum casts.
-- 3) Eliminate lowercase "active" mismatches against listing_status enum.

-- Verify expected enum labels exist.
DO $$
DECLARE
  v_values TEXT[];
BEGIN
  SELECT ARRAY_AGG(value::TEXT ORDER BY value::TEXT)
  INTO v_values
  FROM UNNEST(enum_range(NULL::public.listing_status)) AS value;

  IF NOT ('Active' = ANY(v_values)) THEN
    RAISE EXCEPTION 'listing_status enum is missing expected value "Active". Current values: %', v_values;
  END IF;
END
$$;

-- Rebuild marketplace functions with explicit listing_status enum casts.
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
    AND l.status = 'Active'::public.listing_status
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

-- Rebuild listing SELECT policy with explicit listing_status enum casts.
DROP POLICY IF EXISTS "Anyone can read Active listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can read active listings" ON public.listings;

CREATE POLICY "Anyone can read Active listings"
ON public.listings FOR SELECT
USING (
  (
    status = 'Active'::public.listing_status
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

-- Rebuild listing_photos SELECT policy with explicit listing_status enum casts.
DROP POLICY IF EXISTS "Anyone can read Active listing photos" ON public.listing_photos;
DROP POLICY IF EXISTS "Anyone can read active listing photos" ON public.listing_photos;

CREATE POLICY "Anyone can read Active listing photos"
ON public.listing_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.status = 'Active'::public.listing_status
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
