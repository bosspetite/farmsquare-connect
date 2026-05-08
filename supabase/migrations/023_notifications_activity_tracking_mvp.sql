-- 023_notifications_activity_tracking_mvp.sql
-- Purpose:
-- 1) Expand notifications table for richer activity tracking metadata.
-- 2) Add order_events timeline table for auditable order activity.
-- 3) Tighten/extend RLS insert policy so real MVP events can be persisted.

-- ---------------------------------------------------------------------------
-- A) Notifications schema extensions (safe additive changes).
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_payment_id UUID,
  ADD COLUMN IF NOT EXISTS related_escrow_id UUID REFERENCES public.escrows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_kyc_id UUID REFERENCES public.kyc_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'related_product_id'
  ) THEN
    EXECUTE $update$
      UPDATE public.notifications
      SET related_listing_id = related_product_id
      WHERE related_listing_id IS NULL
        AND related_product_id IS NOT NULL
    $update$;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_is_read_created
  ON public.notifications(recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_created
  ON public.notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_listing
  ON public.notifications(related_listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_escrow
  ON public.notifications(related_escrow_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_kyc
  ON public.notifications(related_kyc_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- B) Order events table for admin/buyer/farmer order activity timeline.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON public.order_events(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_events_event_type
  ON public.order_events(event_type, created_at DESC);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order participants can read order events" ON public.order_events;
CREATE POLICY "Order participants can read order events"
ON public.order_events FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND (
        o.buyer_id = auth.uid()
        OR o.farmer_id = auth.uid()
        OR public.get_user_role() = 'admin'
      )
  )
);

DROP POLICY IF EXISTS "Order participants can create order events" ON public.order_events;
CREATE POLICY "Order participants can create order events"
ON public.order_events FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (
          o.buyer_id = auth.uid()
          OR o.farmer_id = auth.uid()
        )
    )
  )
);

DROP POLICY IF EXISTS "Admins can update order events" ON public.order_events;
CREATE POLICY "Admins can update order events"
ON public.order_events FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete order events" ON public.order_events;
CREATE POLICY "Admins can delete order events"
ON public.order_events FOR DELETE
USING (public.get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_events TO authenticated;

-- ---------------------------------------------------------------------------
-- C) Notifications insert policy refresh for MVP event coverage.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create KYC and order notifications" ON public.notifications;

CREATE POLICY "Users can create KYC and order notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Admins can create any notification.
    public.get_user_role() = 'admin'

    -- Order workflow notifications for order participants.
    OR (
      type IN (
        'new_order',
        'payment_successful',
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
          AND (
            o.buyer_id = auth.uid()
            OR o.farmer_id = auth.uid()
          )
      )
    )

    -- Wallet notifications for the wallet owner (and admin-targeted alerts).
    OR (
      type IN ('wallet_funded', 'withdrawal_requested')
      AND entity_type = 'wallet'
      AND entity_id IS NOT NULL
      AND (
        entity_id = auth.uid()
        OR public.get_user_role() = 'admin'
      )
    )

    -- Listing notifications for listing owner/admin.
    OR (
      type IN ('listing_created', 'listing_published')
      AND entity_type IN ('listing', 'product')
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.listings l
        WHERE l.id = entity_id
          AND (
            l.farmer_id = auth.uid()
            OR public.get_user_role() = 'admin'
          )
      )
    )

    -- KYC submission notifications from self to admin reviewers.
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
