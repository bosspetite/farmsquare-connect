-- 020_listings_admin_insert_rls_fix.sql
-- Purpose:
-- 1) Allow admins to create listings on behalf of real farmer profiles.
-- 2) Preserve farmer self-service listing ownership rules.
-- 3) Keep listing photos writable by admins as part of admin-created listings.

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

-- Rebuild listings policies with explicit admin insert support.
DROP POLICY IF EXISTS "Anyone can read Active listings" ON public.listings;
DROP POLICY IF EXISTS "Farmers can insert own listings" ON public.listings;
DROP POLICY IF EXISTS "Farmers can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
DROP POLICY IF EXISTS "Farmers can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
DROP POLICY IF EXISTS "Admins can insert listings for farmers" ON public.listings;

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
        AND p.role = 'farmer'
        AND p.deleted_at IS NULL
    )
  )
  OR farmer_id = auth.uid()
  OR public.get_user_role() = 'admin'
);

CREATE POLICY "Farmers can insert own listings"
ON public.listings FOR INSERT
WITH CHECK (
  public.get_user_role() = 'farmer'
  AND farmer_id = auth.uid()
);

CREATE POLICY "Admins can insert listings for farmers"
ON public.listings FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles farmer_owner
    WHERE farmer_owner.id = listings.farmer_id
      AND farmer_owner.role = 'farmer'
      AND farmer_owner.deleted_at IS NULL
  )
);

CREATE POLICY "Farmers can update own listings"
ON public.listings FOR UPDATE
USING (
  public.get_user_role() = 'farmer'
  AND farmer_id = auth.uid()
)
WITH CHECK (
  public.get_user_role() = 'farmer'
  AND farmer_id = auth.uid()
);

CREATE POLICY "Admins can update any listing"
ON public.listings FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (
  public.get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.profiles farmer_owner
    WHERE farmer_owner.id = listings.farmer_id
      AND farmer_owner.role = 'farmer'
      AND farmer_owner.deleted_at IS NULL
  )
);

CREATE POLICY "Farmers can delete own listings"
ON public.listings FOR DELETE
USING (
  public.get_user_role() = 'farmer'
  AND farmer_id = auth.uid()
);

CREATE POLICY "Admins can delete any listing"
ON public.listings FOR DELETE
USING (public.get_user_role() = 'admin');

-- Rebuild listing photo policies so admin-created listings can also attach photos.
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
