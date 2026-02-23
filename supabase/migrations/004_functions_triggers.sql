-- FarmSquare Phase 2 Backend - Database Functions & Triggers
-- Run this after 003_rls_policies.sql
-- Functions for status transitions, audit logging, and automatic operations

-- ============================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate Order Status Transition
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_order_status_transition(
  current_status order_status,
  new_status order_status
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Define allowed transitions
  CASE current_status
    WHEN 'Pending' THEN
      RETURN new_status IN ('Paid', 'Cancelled');
    WHEN 'Paid' THEN
      RETURN new_status IN ('Accepted', 'Rejected', 'Cancelled');
    WHEN 'Accepted' THEN
      RETURN new_status IN ('Processing', 'Cancelled');
    WHEN 'Rejected' THEN
      RETURN FALSE; -- Cannot transition from rejected
    WHEN 'Processing' THEN
      RETURN new_status IN ('PickupScheduled', 'Cancelled');
    WHEN 'PickupScheduled' THEN
      RETURN new_status IN ('InTransit', 'Cancelled');
    WHEN 'InTransit' THEN
      RETURN new_status IN ('Delivered', 'Cancelled');
    WHEN 'Delivered' THEN
      RETURN new_status IN ('Cancelled'); -- Can only cancel, completed is automatic
    WHEN 'Cancelled' THEN
      RETURN FALSE; -- Cannot transition from cancelled
    WHEN 'Refunded' THEN
      RETURN FALSE; -- Cannot transition from refunded
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Validate Logistics Status Transition
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_logistics_status_transition(
  current_status logistics_status,
  new_status logistics_status
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Define allowed transitions
  CASE current_status
    WHEN 'assigned' THEN
      RETURN new_status IN ('picked_up', 'cancelled');
    WHEN 'picked_up' THEN
      RETURN new_status IN ('in_transit', 'cancelled');
    WHEN 'in_transit' THEN
      RETURN new_status IN ('delivered', 'cancelled');
    WHEN 'delivered' THEN
      RETURN FALSE; -- Cannot transition from delivered
    WHEN 'cancelled' THEN
      RETURN FALSE; -- Cannot transition from cancelled
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Create Order Status History Entry
-- ============================================

CREATE OR REPLACE FUNCTION public.create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Create Logistics Status Update Entry
-- ============================================

CREATE OR REPLACE FUNCTION public.create_logistics_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create update entry if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.logistics_status_updates (
      logistics_id,
      status,
      location_text,
      location,
      progress_percentage
    )
    VALUES (
      NEW.id,
      NEW.status,
      NULL,
      NEW.current_location,
      NEW.progress_percentage
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-create Wallet on Profile Creation
-- ============================================

CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update Order Timestamps Based on Status
-- ============================================

CREATE OR REPLACE FUNCTION public.update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status-specific timestamps
  IF NEW.status = 'Accepted' AND OLD.status != 'Accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  
  IF NEW.status = 'Processing' AND OLD.status != 'Processing' THEN
    NEW.processing_at = NOW();
  END IF;
  
  IF NEW.status = 'PickupScheduled' AND OLD.status != 'PickupScheduled' THEN
    NEW.pickup_scheduled_at = NOW();
  END IF;
  
  IF NEW.status = 'InTransit' AND OLD.status != 'InTransit' THEN
    NEW.in_transit_at = NOW();
  END IF;
  
  IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update Logistics Timestamps Based on Status
-- ============================================

CREATE OR REPLACE FUNCTION public.update_logistics_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status-specific timestamps
  IF NEW.status = 'picked_up' AND OLD.status != 'picked_up' THEN
    NEW.picked_up_at = NOW();
  END IF;
  
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Expire Inventory Reservations
-- ============================================

CREATE OR REPLACE FUNCTION public.expire_inventory_reservations()
RETURNS void AS $$
BEGIN
  UPDATE public.inventory_reservations
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_businesses_updated_at
  BEFORE UPDATE ON public.buyer_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_groups_updated_at
  BEFORE UPDATE ON public.order_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logistics_updated_at
  BEFORE UPDATE ON public.logistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: Create wallet on profile creation
-- ============================================

CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_user();

-- ============================================
-- TRIGGER: Order status history
-- ============================================

CREATE TRIGGER order_status_history_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_status_history();

-- ============================================
-- TRIGGER: Order timestamps
-- ============================================

CREATE TRIGGER order_timestamps_trigger
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_timestamps();

-- ============================================
-- TRIGGER: Logistics status updates
-- ============================================

CREATE TRIGGER logistics_status_update_trigger
  AFTER UPDATE OF status ON public.logistics
  FOR EACH ROW
  EXECUTE FUNCTION public.create_logistics_status_update();

-- ============================================
-- TRIGGER: Logistics timestamps
-- ============================================

CREATE TRIGGER logistics_timestamps_trigger
  BEFORE UPDATE OF status ON public.logistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_logistics_timestamps();

-- ============================================
-- SCHEDULED FUNCTION: Expire inventory reservations
-- ============================================
-- Note: This should be set up as a cron job in Supabase
-- For now, it can be called manually or via Edge Function

-- Example cron setup (run in Supabase SQL Editor):
-- SELECT cron.schedule('expire-reservations', '*/5 * * * *', 'SELECT public.expire_inventory_reservations()');

