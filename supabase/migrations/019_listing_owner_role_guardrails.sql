-- 019_listing_owner_role_guardrails.sql
-- Purpose:
-- 1) Ensure marketplace listing read models only expose listings owned by farmer profiles.
-- 2) Prevent changing a farmer profile to a non-farmer role while it still owns listings/orders.

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
    AND p.role = 'farmer'
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

CREATE OR REPLACE FUNCTION public.prevent_invalid_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active_listings BOOLEAN;
  v_has_related_orders BOOLEAN;
BEGIN
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  IF OLD.role = 'farmer' AND NEW.role <> 'farmer' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.farmer_id = OLD.id
        AND l.deleted_at IS NULL
    ) INTO v_has_active_listings;

    SELECT EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.farmer_id = OLD.id
        AND o.deleted_at IS NULL
    ) INTO v_has_related_orders;

    IF v_has_active_listings OR v_has_related_orders THEN
      RAISE EXCEPTION
        'Cannot change role for profile % from farmer to %. Reassign listings/orders first.',
        OLD.id,
        NEW.role;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_invalid_profile_role_change_trigger ON public.profiles;

CREATE TRIGGER prevent_invalid_profile_role_change_trigger
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_invalid_profile_role_change();
