import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();

    const webhookToken = Deno.env.get("PAYMENT_WEBHOOK_TOKEN");
    if (webhookToken) {
      const providedToken = req.headers.get("x-webhook-token") || body.token;
      if (providedToken !== webhookToken) {
        return json({ error: "Invalid token" }, 401);
      }
    }

    const externalTransactionId = String(
      body.external_transaction_id ?? body.transaction_id ?? body.reference ?? "",
    ).trim();
    const amount = Number(body.amount ?? body.amount_vnd ?? 0);
    const content = String(
      body.content ?? body.transaction_content ?? body.description ?? "",
    ).trim();
    const provider = String(body.provider ?? "bank_transfer").trim() || "bank_transfer";

    if (!externalTransactionId || !Number.isFinite(amount) || amount <= 0 || !content) {
      return json(
        {
          error:
            "Missing required fields: external_transaction_id, amount, content",
        },
        400,
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("payment_events")
      .insert({
        provider,
        external_transaction_id: externalTransactionId,
        amount_vnd: amount,
        transaction_content: content,
        raw_payload: body,
        processing_status: "processing",
      })
      .select("id")
      .single();

    if (eventError) {
      if (eventError.code === "23505") {
        return json({ message: "Already processed" });
      }
      throw eventError;
    }

    const orderCodeMatch = content.match(/ORD-[A-Z0-9]{6}/i);
    if (!orderCodeMatch) {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "failed",
          error_message: "No order code found in content",
        })
        .eq("id", event.id);

      return json({ error: "No order code found" });
    }

    const orderCode = orderCodeMatch[0].toUpperCase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_code, status, total_amount_vnd, payment_reference")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "failed",
          error_message: `No order found for ${orderCode}`,
        })
        .eq("id", event.id);

      return json({ error: "Order not found" });
    }

    if (Number(order.total_amount_vnd) !== amount) {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "failed",
          matched_order_id: order.id,
          error_message: `Amount mismatch: got ${amount}, expected ${order.total_amount_vnd}`,
        })
        .eq("id", event.id);

      return json({ error: "Amount mismatch", order_id: order.id });
    }

    const alreadyApplied =
      ["paid", "delivered"].includes(order.status) &&
      order.payment_reference === externalTransactionId;

    if (alreadyApplied) {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "completed",
          matched_order_id: order.id,
          error_message: null,
        })
        .eq("id", event.id);

      return json({ message: "Already applied to order", order_id: order.id });
    }

    if (order.status !== "pending_payment") {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "failed",
          matched_order_id: order.id,
          error_message: `Order not pending: ${order.status}`,
        })
        .eq("id", event.id);

      return json({ error: "Order not pending", order_id: order.id, status: order.status });
    }

    const nowIso = new Date().toISOString();

    const { error: paymentSessionError } = await supabase
      .from("payment_sessions")
      .update({
        status: "matched",
        updated_at: nowIso,
      })
      .eq("order_id", order.id)
      .eq("status", "pending");

    if (paymentSessionError) {
      throw paymentSessionError;
    }

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_reference: externalTransactionId,
        paid_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .select("id, status")
      .maybeSingle();

    if (updateOrderError) {
      throw updateOrderError;
    }

    if (!updatedOrder) {
      await supabase
        .from("payment_events")
        .update({
          processing_status: "failed",
          matched_order_id: order.id,
          error_message: "Order state changed before payment update",
        })
        .eq("id", event.id);

      return json({ error: "Order state changed before payment update", order_id: order.id });
    }

    const { data: allocation, error: allocationError } = await supabase.rpc(
      "allocate_inventory_for_order",
      { p_order_id: order.id },
    );

    if (allocationError) {
      throw allocationError;
    }

    await supabase
      .from("payment_events")
      .update({
        processing_status: allocation?.success ? "completed" : "failed",
        matched_order_id: order.id,
        error_message: allocation?.success ? null : JSON.stringify(allocation),
      })
      .eq("id", event.id);

    await supabase.from("audit_logs").insert({
      action: "payment_confirmed",
      entity_type: "order",
      entity_id: order.id,
      metadata: {
        order_code: orderCode,
        amount,
        external_transaction_id: externalTransactionId,
        allocation,
      },
    });

    return json({ success: true, order_id: order.id, allocation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
