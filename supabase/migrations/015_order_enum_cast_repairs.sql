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

GRANT EXECUTE ON FUNCTION public.create_marketplace_order(UUID, DECIMAL, TEXT, TEXT) TO authenticated;
