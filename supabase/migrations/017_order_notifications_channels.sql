-- FarmSquare Phase: Order notification channels and RLS hardening

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_product_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_channel_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_channel_check
  CHECK (channel IN ('in_app', 'email', 'whatsapp'));

UPDATE public.notifications
SET related_order_id = entity_id
WHERE related_order_id IS NULL
  AND entity_type = 'order'
  AND entity_id IS NOT NULL;

UPDATE public.notifications
SET related_product_id = entity_id
WHERE related_product_id IS NULL
  AND entity_type IN ('listing', 'product')
  AND entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_order
  ON public.notifications(related_order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_product
  ON public.notifications(related_product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user_created
  ON public.notifications(recipient_user_id, is_read, created_at DESC);

-- Tighten row-level access while preserving admin role notifications.
DROP POLICY IF EXISTS "Users can read notifications" ON public.notifications;
CREATE POLICY "Users can read notifications"
ON public.notifications FOR SELECT
USING (
  recipient_user_id = auth.uid()
  OR (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
CREATE POLICY "Users can mark notifications as read"
ON public.notifications FOR UPDATE
USING (
  recipient_user_id = auth.uid()
  OR (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
)
WITH CHECK (
  recipient_user_id = auth.uid()
  OR (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Users can create admin KYC notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create user notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create KYC and order notifications" ON public.notifications;

CREATE POLICY "Users can create KYC and order notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Admins can create all notifications.
    public.get_user_role() = 'admin'
    OR (
      -- Buyer can create order notifications only for their own order.
      type IN ('new_order', 'payment_successful', 'order_status_updated')
      AND entity_type = 'order'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = entity_id
          AND o.buyer_id = auth.uid()
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

-- Future channel preferences (WhatsApp-ready structure).
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enable_in_app BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email BOOLEAN NOT NULL DEFAULT TRUE,
  enable_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can read their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all notification preferences" ON public.notification_preferences;
CREATE POLICY "Admins can read all notification preferences"
ON public.notification_preferences FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'handle_updated_at'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
    CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
