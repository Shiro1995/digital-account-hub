-- Further restrict shop_settings to admin-only read (RPC is SECURITY DEFINER, no client needs direct read)
DROP POLICY IF EXISTS "Authenticated users read shop settings" ON public.shop_settings;

CREATE POLICY "Admins read shop settings"
ON public.shop_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));