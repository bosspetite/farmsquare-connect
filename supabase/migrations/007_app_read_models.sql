-- FarmSquare Phase 2 Backend - App read models and helper RPCs
-- Run this after 005_storage_setup.sql (006_seed_data.sql is optional)

-- ============================================
-- MARKETPLACE LISTING READ MODEL
-- ============================================

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

-- ============================================
-- ORDER READ MODEL
-- ============================================

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

-- ============================================
-- SIMPLE ORDER CREATION RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.create_marketplace_order(
  p_listing_id UUID,
  p_quantity_kg DECIMAL,
  p_payment_method TEXT DEFAULT 'paystack',
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_order_id UUID;
  v_amount DECIMAL(10, 2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.get_user_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can create orders';
  END IF;

  SELECT *
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status <> 'Active' THEN
    RAISE EXCEPTION 'This listing is not available for orders';
  END IF;

  IF p_quantity_kg IS NULL OR p_quantity_kg <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  IF v_listing.min_order_kg IS NOT NULL AND p_quantity_kg < v_listing.min_order_kg THEN
    RAISE EXCEPTION 'Minimum order quantity is % kg', v_listing.min_order_kg;
  END IF;

  v_amount := ROUND((p_quantity_kg * v_listing.price_per_kg)::NUMERIC, 2);

  INSERT INTO public.orders (
    buyer_id,
    farmer_id,
    total_amount,
    status,
    payment_status,
    payment_method,
    payment_reference,
    pickup_location
  )
  VALUES (
    auth.uid(),
    v_listing.farmer_id,
    v_amount,
    'Pending'::public.order_status,
    CASE
      WHEN p_payment_reference IS NULL THEN 'Unpaid'::public.payment_status
      ELSE 'Paid'::public.payment_status
    END,
    p_payment_method,
    p_payment_reference,
    v_listing.location_label
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    listing_id,
    quantity_kg,
    price_per_unit_snapshot,
    line_total
  )
  VALUES (
    v_order_id,
    v_listing.id,
    p_quantity_kg,
    v_listing.price_per_kg,
    v_amount
  );

  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (
    v_order_id,
    'Pending'::public.order_status,
    'Order request created and awaiting availability confirmation'
  );

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_listings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_listing(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_marketplace_order(UUID, DECIMAL, TEXT, TEXT) TO authenticated;
