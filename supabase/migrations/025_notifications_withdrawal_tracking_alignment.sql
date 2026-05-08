-- 025_notifications_withdrawal_tracking_alignment.sql
-- Purpose:
-- 1) Add explicit related_withdrawal_id pointer for notification drill-down.
-- 2) Ensure withdrawal notification types are allowed by notifications INSERT RLS.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_withdrawal_id UUID REFERENCES public.payout_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_withdrawal
  ON public.notifications(related_withdrawal_id, created_at DESC);

DROP POLICY IF EXISTS "Users can create KYC and order notifications" ON public.notifications;

CREATE POLICY "Users can create KYC and order notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Admins can create any notification row.
    public.get_user_role() = 'admin'

    -- Order workflow notifications by buyer/farmer participants.
    OR (
      type IN (
        'new_order',
        'payment_successful',
        'payment_received',
        'order_status_updated',
        'order_accepted',
        'order_rejected',
        'order_completed',
        'escrow_held',
        'escrow_released'
      )
      AND entity_type = 'order'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = entity_id
          AND (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid())
      )
    )

    -- Wallet/withdrawal notifications by wallet owner.
    OR (
      type IN (
        'wallet_funded',
        'withdrawal_request',
        'withdrawal_requested',
        'withdrawal_approved',
        'withdrawal_rejected'
      )
      AND entity_type = 'wallet'
      AND entity_id IS NOT NULL
      AND entity_id = auth.uid()
    )

    -- Listing notifications for listing owners.
    OR (
      type IN ('listing_created', 'listing_published')
      AND entity_type IN ('listing', 'product')
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.listings l
        WHERE l.id = entity_id
          AND l.farmer_id = auth.uid()
      )
    )

    -- KYC submission notification to admin role from self.
    OR (
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
