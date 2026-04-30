DO $$
BEGIN
  ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Disputed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'escrow_hold';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'escrow_release';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'adjustment';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id UUID,
  p_payment_reference TEXT,
  p_payment_method TEXT DEFAULT 'paystack'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_farmer_wallet_id UUID;
  v_existing_escrow public.escrows%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF public.get_user_role() <> 'admin' AND v_order.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'You are not allowed to update this order';
  END IF;

  UPDATE public.orders
  SET
    status = 'Paid'::public.order_status,
    payment_status = 'Paid'::public.payment_status,
    payment_method = COALESCE(p_payment_method, payment_method, 'paystack'),
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    updated_at = NOW()
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (
    v_order.id,
    'Paid'::public.order_status,
    'Payment verified and order moved into escrow'
  );

  INSERT INTO public.wallets (user_id)
  VALUES (v_order.farmer_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id
  INTO v_farmer_wallet_id
  FROM public.wallets
  WHERE user_id = v_order.farmer_id;

  SELECT *
  INTO v_existing_escrow
  FROM public.escrows
  WHERE order_id = v_order.id;

  IF NOT FOUND THEN
    INSERT INTO public.escrows (
      order_id,
      buyer_id,
      farmer_id,
      amount,
      commission,
      farmer_amount,
      status
    )
    VALUES (
      v_order.id,
      v_order.buyer_id,
      v_order.farmer_id,
      v_order.total_amount,
      0,
      v_order.total_amount,
      'held'::public.escrow_status
    );

    UPDATE public.wallets
    SET
      pending = pending + v_order.total_amount,
      updated_at = NOW()
    WHERE id = v_farmer_wallet_id;

    INSERT INTO public.wallet_transactions (
      wallet_id,
      order_id,
      type,
      title,
      amount,
      status,
      reference,
      metadata
    )
    VALUES (
      v_farmer_wallet_id,
      v_order.id,
      'escrow_hold'::public.transaction_type,
      'Escrow hold for paid order',
      v_order.total_amount,
      'completed'::public.transaction_status,
      COALESCE(p_payment_reference, v_order.payment_reference),
      jsonb_build_object(
        'stage', 'held',
        'order_status', 'Paid',
        'payment_method', COALESCE(p_payment_method, v_order.payment_method, 'paystack')
      )
    );
  END IF;

  RETURN v_order.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_paid(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.transition_order_workflow(
  p_order_id UUID,
  p_next_status public.order_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_role public.user_role;
  v_now TIMESTAMPTZ := NOW();
  v_escrow public.escrows%ROWTYPE;
  v_farmer_wallet_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT public.get_user_role()
  INTO v_role;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_role = 'farmer' THEN
    IF v_order.farmer_id <> auth.uid() THEN
      RAISE EXCEPTION 'You cannot update another farmer''s order';
    END IF;

    IF p_next_status = 'Accepted'::public.order_status AND v_order.status <> 'Paid'::public.order_status THEN
      RAISE EXCEPTION 'Only paid orders can be accepted';
    ELSIF p_next_status = 'Rejected'::public.order_status AND v_order.status NOT IN ('Paid'::public.order_status, 'Accepted'::public.order_status) THEN
      RAISE EXCEPTION 'This order can no longer be rejected';
    ELSIF p_next_status = 'Processing'::public.order_status AND v_order.status <> 'Accepted'::public.order_status THEN
      RAISE EXCEPTION 'Only accepted orders can move to preparing';
    ELSIF p_next_status = 'InTransit'::public.order_status AND v_order.status <> 'Processing'::public.order_status THEN
      RAISE EXCEPTION 'Only preparing orders can move to out for delivery';
    ELSIF p_next_status NOT IN ('Accepted'::public.order_status, 'Rejected'::public.order_status, 'Processing'::public.order_status, 'InTransit'::public.order_status) THEN
      RAISE EXCEPTION 'Invalid farmer order transition';
    END IF;
  ELSIF v_role = 'buyer' THEN
    IF v_order.buyer_id <> auth.uid() THEN
      RAISE EXCEPTION 'You cannot update another buyer''s order';
    END IF;

    IF p_next_status = 'Delivered'::public.order_status AND v_order.status NOT IN ('InTransit'::public.order_status, 'Delivered'::public.order_status) THEN
      RAISE EXCEPTION 'Delivery can only be confirmed once the order is out for delivery';
    ELSIF p_next_status = 'Disputed'::public.order_status AND v_order.status NOT IN ('Paid'::public.order_status, 'Accepted'::public.order_status, 'Processing'::public.order_status, 'InTransit'::public.order_status, 'Delivered'::public.order_status) THEN
      RAISE EXCEPTION 'This order cannot be disputed in its current state';
    ELSIF p_next_status NOT IN ('Delivered'::public.order_status, 'Disputed'::public.order_status) THEN
      RAISE EXCEPTION 'Invalid buyer order transition';
    END IF;
  ELSIF v_role <> 'admin' THEN
    RAISE EXCEPTION 'You are not allowed to update this order';
  END IF;

  UPDATE public.orders
  SET
    status = p_next_status,
    accepted_at = CASE
      WHEN p_next_status = 'Accepted'::public.order_status AND accepted_at IS NULL THEN v_now
      ELSE accepted_at
    END,
    processing_at = CASE
      WHEN p_next_status = 'Processing'::public.order_status AND processing_at IS NULL THEN v_now
      ELSE processing_at
    END,
    in_transit_at = CASE
      WHEN p_next_status = 'InTransit'::public.order_status AND in_transit_at IS NULL THEN v_now
      ELSE in_transit_at
    END,
    delivered_at = CASE
      WHEN p_next_status = 'Delivered'::public.order_status AND delivered_at IS NULL THEN v_now
      ELSE delivered_at
    END,
    payment_status = CASE
      WHEN p_next_status = 'Rejected'::public.order_status THEN 'Refunded'::public.payment_status
      WHEN p_next_status = 'Delivered'::public.order_status THEN 'Released'::public.payment_status
      ELSE payment_status
    END,
    updated_at = v_now
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (
    v_order.id,
    p_next_status,
    COALESCE(
      p_notes,
      CASE
        WHEN p_next_status = 'Accepted'::public.order_status THEN 'Farmer accepted the order'
        WHEN p_next_status = 'Rejected'::public.order_status THEN 'Farmer rejected the order'
        WHEN p_next_status = 'Processing'::public.order_status THEN 'Farmer is preparing the order'
        WHEN p_next_status = 'InTransit'::public.order_status THEN 'Order is out for delivery'
        WHEN p_next_status = 'Delivered'::public.order_status THEN 'Buyer confirmed delivery and escrow was released'
        WHEN p_next_status = 'Disputed'::public.order_status THEN 'Buyer reported an issue with the order'
        ELSE NULL
      END
    )
  );

  IF p_next_status IN ('Rejected'::public.order_status, 'Delivered'::public.order_status) THEN
    SELECT *
    INTO v_escrow
    FROM public.escrows
    WHERE order_id = v_order.id
    FOR UPDATE;

    IF FOUND THEN
      INSERT INTO public.wallets (user_id)
      VALUES (v_order.farmer_id)
      ON CONFLICT (user_id) DO NOTHING;

      SELECT id
      INTO v_farmer_wallet_id
      FROM public.wallets
      WHERE user_id = v_order.farmer_id;

      IF p_next_status = 'Rejected'::public.order_status AND v_escrow.status = 'held'::public.escrow_status THEN
        UPDATE public.escrows
        SET
          status = 'refunded'::public.escrow_status,
          refunded_at = v_now
        WHERE id = v_escrow.id;

        UPDATE public.wallets
        SET
          pending = GREATEST(pending - v_escrow.farmer_amount, 0),
          updated_at = v_now
        WHERE id = v_farmer_wallet_id;

        INSERT INTO public.wallet_transactions (
          wallet_id,
          order_id,
          type,
          title,
          amount,
          status,
          reference,
          metadata
        )
        VALUES (
          v_farmer_wallet_id,
          v_order.id,
          'adjustment'::public.transaction_type,
          'Escrow reversed for rejected order',
          -1 * v_escrow.farmer_amount,
          'completed'::public.transaction_status,
          v_order.payment_reference,
          jsonb_build_object('stage', 'refunded', 'order_status', 'Rejected')
        );
      ELSIF p_next_status = 'Delivered'::public.order_status AND v_escrow.status = 'held'::public.escrow_status THEN
        UPDATE public.escrows
        SET
          status = 'released'::public.escrow_status,
          released_at = v_now
        WHERE id = v_escrow.id;

        UPDATE public.wallets
        SET
          pending = GREATEST(pending - v_escrow.farmer_amount, 0),
          available = available + v_escrow.farmer_amount,
          updated_at = v_now
        WHERE id = v_farmer_wallet_id;

        INSERT INTO public.wallet_transactions (
          wallet_id,
          order_id,
          type,
          title,
          amount,
          status,
          reference,
          metadata
        )
        VALUES (
          v_farmer_wallet_id,
          v_order.id,
          'escrow_release'::public.transaction_type,
          'Escrow released after delivery confirmation',
          v_escrow.farmer_amount,
          'completed'::public.transaction_status,
          v_order.payment_reference,
          jsonb_build_object('stage', 'released', 'order_status', 'Delivered')
        );
      END IF;
    END IF;
  END IF;

  RETURN v_order.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_workflow(UUID, public.order_status, TEXT) TO authenticated;
