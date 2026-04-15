-- Fix: restrict shop_settings public read to authenticated users only
-- The RPC create_order_and_payment_session is SECURITY DEFINER so it doesn't need public read
DROP POLICY IF EXISTS "Anyone reads shop settings" ON public.shop_settings;

CREATE POLICY "Authenticated users read shop settings"
ON public.shop_settings
FOR SELECT
TO authenticated
USING (true);