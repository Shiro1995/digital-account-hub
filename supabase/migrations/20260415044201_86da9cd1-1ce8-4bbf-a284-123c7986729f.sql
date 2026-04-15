
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.inventory_status AS ENUM ('available', 'reserved', 'sold', 'disabled');
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'paid', 'delivered', 'cancelled', 'refunded', 'payment_failed');
CREATE TYPE public.payment_session_status AS ENUM ('pending', 'matched', 'expired', 'failed');
CREATE TYPE public.support_message_status AS ENUM ('new', 'closed');

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- USER_ROLES (first, so has_role can reference it)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT, phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, short_description TEXT, description TEXT,
  price_vnd BIGINT NOT NULL DEFAULT 0, cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCT_IMAGES
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- INVENTORY_ITEMS (private)
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  internal_label TEXT, credential_username TEXT, credential_password TEXT, credential_email TEXT,
  credential_recovery_info TEXT, internal_note TEXT,
  status public.inventory_status NOT NULL DEFAULT 'available',
  reserved_for_order_id UUID, sold_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_inventory_product_status ON public.inventory_items (product_id, status);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL UNIQUE, status public.order_status NOT NULL DEFAULT 'pending_payment',
  total_amount_vnd BIGINT NOT NULL DEFAULT 0, payment_status TEXT, payment_provider TEXT, payment_reference TEXT,
  paid_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDER_ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id), product_name_snapshot TEXT NOT NULL,
  unit_price_vnd BIGINT NOT NULL, quantity INT NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DELIVERED_ITEMS
CREATE TABLE public.delivered_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id), inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credential_username TEXT, credential_password TEXT, credential_email TEXT, credential_recovery_info TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivered_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own delivered items" ON public.delivered_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage delivered items" ON public.delivered_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PAYMENT_SESSIONS
CREATE TABLE public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT, amount_vnd BIGINT NOT NULL, transfer_content TEXT NOT NULL, qr_payload TEXT, qr_image_url TEXT,
  status public.payment_session_status NOT NULL DEFAULT 'pending', expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payment sessions" ON public.payment_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payment_sessions.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins manage payment sessions" ON public.payment_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_payment_sessions_updated_at BEFORE UPDATE ON public.payment_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PAYMENT_EVENTS
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT, external_transaction_id TEXT,
  amount_vnd BIGINT, transaction_content TEXT, matched_order_id UUID REFERENCES public.orders(id),
  raw_payload JSONB, processing_status TEXT NOT NULL DEFAULT 'received', error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payment events" ON public.payment_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert payment events" ON public.payment_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX idx_payment_events_external_tx ON public.payment_events (provider, external_transaction_id) WHERE external_transaction_id IS NOT NULL;

-- SUPPORT_MESSAGES
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL,
  subject TEXT NOT NULL, message TEXT NOT NULL, status public.support_message_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit support" ON public.support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read support messages" ON public.support_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update support messages" ON public.support_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SHOP_SETTINGS
CREATE TABLE public.shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shop_name TEXT NOT NULL DEFAULT 'Digital Store',
  support_email TEXT, support_phone TEXT, bank_account_name TEXT, bank_account_number TEXT, bank_name TEXT,
  payment_provider TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads shop settings" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage shop settings" ON public.shop_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.shop_settings (shop_name) VALUES ('Digital Store');

-- FUNCTION: get stock count
CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id UUID)
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COUNT(*) FROM public.inventory_items WHERE product_id = p_product_id AND status = 'available' $$;

-- FUNCTION: process payment and deliver (atomic)
CREATE OR REPLACE FUNCTION public.process_payment_and_deliver(p_order_id UUID, p_payment_reference TEXT, p_provider TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order RECORD; v_order_item RECORD; v_inventory RECORD; v_delivered_count INT := 0; v_needed INT := 0; v_result JSONB;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status != 'pending_payment' THEN RETURN jsonb_build_object('success', false, 'error', 'Order already processed'); END IF;

  UPDATE public.orders SET status = 'paid', payment_status = 'paid', payment_provider = p_provider, payment_reference = p_payment_reference, paid_at = now() WHERE id = p_order_id;
  UPDATE public.payment_sessions SET status = 'matched' WHERE order_id = p_order_id AND status = 'pending';

  FOR v_order_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    FOR i IN 1..v_order_item.quantity LOOP
      v_needed := v_needed + 1;
      SELECT * INTO v_inventory FROM public.inventory_items WHERE product_id = v_order_item.product_id AND status = 'available' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
      IF FOUND THEN
        UPDATE public.inventory_items SET status = 'sold', sold_order_id = p_order_id WHERE id = v_inventory.id;
        INSERT INTO public.delivered_items (order_id, order_item_id, inventory_item_id, user_id, credential_username, credential_password, credential_email, credential_recovery_info)
        VALUES (p_order_id, v_order_item.id, v_inventory.id, v_order.user_id, v_inventory.credential_username, v_inventory.credential_password, v_inventory.credential_email, v_inventory.credential_recovery_info);
        v_delivered_count := v_delivered_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  IF v_delivered_count = v_needed AND v_needed > 0 THEN
    UPDATE public.orders SET status = 'delivered', delivered_at = now() WHERE id = p_order_id;
    v_result := jsonb_build_object('success', true, 'status', 'delivered', 'delivered_count', v_delivered_count);
  ELSIF v_delivered_count > 0 THEN
    v_result := jsonb_build_object('success', true, 'status', 'partial', 'delivered_count', v_delivered_count, 'needed', v_needed);
  ELSE
    v_result := jsonb_build_object('success', true, 'status', 'no_inventory', 'delivered_count', 0, 'needed', v_needed);
  END IF;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, metadata) VALUES ('payment_processed', 'order', p_order_id::text, v_result);
  RETURN v_result;
END; $$;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
