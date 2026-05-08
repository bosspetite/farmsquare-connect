-- FarmSquare MVP: allow buyer/farmer/admin to create order workflow notifications safely.

DROP POLICY IF EXISTS "Users can create KYC and order notifications" ON public.notifications;

CREATE POLICY "Users can create KYC and order notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Admins can create any notifications.
    public.get_user_role() = 'admin'

    OR (
      -- Buyer/Farmer can create order notifications only for orders they are part of.
      type IN (
        'new_order',
        'payment_successful',
        'order_status_updated',
        'order_accepted',
        'order_rejected',
        'order_completed',
        'escrow_released'
      )
      AND entity_type = 'order'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = entity_id
          AND (
            o.buyer_id = auth.uid()
            OR o.farmer_id = auth.uid()
          )
      )
    )

    OR (
      -- KYC submission notification to admin role from self.
      type = 'KYC_SUBMITTED'
      AND recipient_role = 'admin'
      AND (
        (
          entity_type = 'kyc_record'
          AND entity_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.kyc_records kr
            WHERE kr.id = entity_id
              AND kr.user_id = auth.uid()
          )
        )
        OR (
          entity_type = 'profile'
          AND entity_id = auth.uid()
        )
      )
    )
  )
);
