-- Harden order creation, webhook idempotency, and credential delivery.

-- 1) Stop trusting the browser to insert orders and order items directly.
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;

-- 2) Make webhook idempotency enforceable at the database layer.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_external_transaction_id
ON public.payment_events (external_transaction_id)
WHERE external_transaction_id IS NOT NULL;

-- 3) Make delivered_items safe against duplicate delivery of the same inventory row.
CREATE UNIQUE INDEX IF NOT EXISTS uq_delivered_items_inventory_item_id
ON public.delivered_items (inventory_item_id);

-- 4) Generate order codes server-side.
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := 'ORD-' || UPPER(SUBSTRING(ENCODE(gen_random_bytes(4), 'hex') FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders WHERE order_code = v_code
    );
  END LOOP;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_code() FROM PUBLIC;

-- 5) Create orders and payment sessions server-side from product_id + quantity only.
CREATE OR REPLACE FUNCTION public.create_order_and_payment_session(p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_order_code TEXT;
  v_total BIGINT := 0;
  v_item JSONB;
  v_product RECORD;
  v_quantity INT;
  v_settings RECORD;
  v_expires_at TIMESTAMPTZ := now() + INTERVAL '30 minutes';
  v_qr_image_url TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT id, bank_name, bank_account_name, bank_account_number
  INTO v_settings
  FROM public.shop_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_settings.id IS NULL THEN
    RAISE EXCEPTION 'Shop settings are not configured';
  END IF;

  v_order_code := public.generate_order_code();

  INSERT INTO public.orders (
    user_id,
    order_code,
    status,
    total_amount_vnd,
    payment_status,
    payment_provider
  ) VALUES (
    v_user_id,
    v_order_code,
    'pending_payment',
    0,
    'pending',
    'bank_transfer'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_quantity := COALESCE((v_item ->> 'quantity')::INT, 0);
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid quantity';
    END;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;

    SELECT id, name, price_vnd, is_active
    INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id')::UUID
      AND is_active = true;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;

    IF public.get_product_stock(v_product.id) < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_vnd,
      quantity
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price_vnd,
      v_quantity
    );

    v_total := v_total + (v_product.price_vnd * v_quantity);
  END LOOP;

  UPDATE public.orders
  SET total_amount_vnd = v_total,
      updated_at = now()
  WHERE id = v_order_id;

  v_qr_image_url := format(
    'https://img.vietqr.io/image/%s-%s-compact.png?amount=%s&addInfo=%s',
    COALESCE(v_settings.bank_name, 'VCB'),
    COALESCE(v_settings.bank_account_number, '0'),
    v_total,
    v_order_code
  );

  INSERT INTO public.payment_sessions (
    order_id,
    provider,
    amount_vnd,
    transfer_content,
    qr_payload,
    qr_image_url,
    status,
    expires_at
  ) VALUES (
    v_order_id,
    'bank_transfer',
    v_total,
    v_order_code,
    v_qr_image_url,
    v_qr_image_url,
    'pending',
    v_expires_at
  );

  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_user_id,
    'order_created',
    'order',
    v_order_id::TEXT,
    jsonb_build_object(
      'order_code', v_order_code,
      'amount_vnd', v_total
    )
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'amount_vnd', v_total,
    'transfer_content', v_order_code,
    'qr_image_url', v_qr_image_url,
    'expires_at', v_expires_at,
    'bank_name', v_settings.bank_name,
    'bank_account_name', v_settings.bank_account_name,
    'bank_account_number', v_settings.bank_account_number,
    'status', 'pending_payment'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_and_payment_session(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_and_payment_session(JSONB) TO authenticated;

-- 6) Safe customer-facing credential retrieval.
CREATE OR REPLACE FUNCTION public.get_delivered_credentials_for_user(p_order_id UUID)
RETURNS TABLE (
  delivered_item_id UUID,
  order_item_id UUID,
  inventory_item_id UUID,
  credential_username TEXT,
  credential_password TEXT,
  credential_email TEXT,
  credential_recovery_info TEXT,
  delivered_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id AS delivered_item_id,
    d.order_item_id,
    d.inventory_item_id,
    i.credential_username,
    i.credential_password,
    i.credential_email,
    i.credential_recovery_info,
    d.delivered_at
  FROM public.delivered_items d
  INNER JOIN public.orders o ON o.id = d.order_id
  INNER JOIN public.inventory_items i ON i.id = d.inventory_item_id
  WHERE d.order_id = p_order_id
    AND o.user_id = auth.uid()
  ORDER BY d.delivered_at ASC, d.id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_delivered_credentials_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_delivered_credentials_for_user(UUID) TO authenticated;

-- 7) Make inventory allocation safe to call multiple times.
CREATE OR REPLACE FUNCTION public.allocate_inventory_for_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_item RECORD;
  v_inv_id UUID;
  v_user_id UUID;
  v_allocated INT := 0;
  v_needed INT := 0;
  v_existing_count INT := 0;
  v_inserted_rows INT := 0;
  v_order_status public.order_status;
BEGIN
  SELECT user_id, status
  INTO v_user_id, v_order_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  SELECT COUNT(*)::INT
  INTO v_existing_count
  FROM public.delivered_items
  WHERE order_id = p_order_id;

  IF v_order_status = 'delivered' OR v_existing_count > 0 THEN
    IF v_existing_count > 0 THEN
      UPDATE public.orders
      SET status = 'delivered',
          delivered_at = COALESCE(delivered_at, now()),
          updated_at = now()
      WHERE id = p_order_id
        AND status <> 'delivered';
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'allocated', v_existing_count,
      'already_delivered', true
    );
  END IF;

  IF v_order_status <> 'paid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_paid',
      'status', v_order_status
    );
  END IF;

  FOR v_order_item IN
    SELECT oi.id, oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    ORDER BY oi.id
  LOOP
    FOR i IN 1..v_order_item.quantity LOOP
      v_needed := v_needed + 1;
      v_inv_id := NULL;

      SELECT id
      INTO v_inv_id
      FROM public.inventory_items
      WHERE product_id = v_order_item.product_id
        AND status = 'available'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF v_inv_id IS NULL THEN
        CONTINUE;
      END IF;

      UPDATE public.inventory_items
      SET status = 'sold',
          sold_order_id = p_order_id,
          updated_at = now()
      WHERE id = v_inv_id;

      INSERT INTO public.delivered_items (
        order_id,
        order_item_id,
        inventory_item_id,
        user_id
      ) VALUES (
        p_order_id,
        v_order_item.id,
        v_inv_id,
        v_user_id
      )
      ON CONFLICT (inventory_item_id) DO NOTHING;

      GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;

      IF v_inserted_rows > 0 THEN
        v_allocated := v_allocated + 1;
      END IF;
    END LOOP;
  END LOOP;

  IF v_allocated = v_needed AND v_needed > 0 THEN
    UPDATE public.orders
    SET status = 'delivered',
        delivered_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'allocated', v_allocated);
  ELSIF v_allocated > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partial_allocation',
      'allocated', v_allocated,
      'needed', v_needed
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_inventory',
      'needed', v_needed
    );
  END IF;
END;
$$;