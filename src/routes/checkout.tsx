import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatVND, getStatusColor, getStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Thanh toán — DigitalStore" }],
  }),
  component: CheckoutPage,
});

type CheckoutSession = {
  orderId: string;
  orderCode: string;
  amountVnd: number;
  transferContent: string;
  qrImageUrl: string;
  expiresAt: string | null;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  status: string;
};

const STORAGE_KEY = "pending-checkout-session";

function loadStoredSession(): CheckoutSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutSession;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: CheckoutSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(() => loadStoredSession());
  const [orderStatus, setOrderStatus] = useState<string>(() => loadStoredSession()?.status ?? "pending_payment");
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);

  const hasActiveCart = items.length > 0;
  const hasPendingSession = Boolean(checkoutSession?.orderId);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!hasActiveCart && !hasPendingSession) {
      navigate({ to: "/cart" });
    }
  }, [user, hasActiveCart, hasPendingSession, navigate]);

  useEffect(() => {
    if (!checkoutSession) return;
    persistSession({ ...checkoutSession, status: orderStatus });
  }, [checkoutSession, orderStatus]);

  const paymentRows = useMemo(() => {
    if (!checkoutSession) return [];
    return [
      { label: "Ngân hàng", value: checkoutSession.bankName },
      { label: "Số tài khoản", value: checkoutSession.bankAccountNumber },
      { label: "Chủ tài khoản", value: checkoutSession.bankAccountName },
      { label: "Số tiền", value: formatVND(checkoutSession.amountVnd) },
      { label: "Nội dung CK", value: checkoutSession.transferContent },
      {
        label: "Hết hạn",
        value: checkoutSession.expiresAt ? formatDate(checkoutSession.expiresAt) : "Chưa có",
      },
    ];
  }, [checkoutSession]);

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const createOrder = async () => {
    if (!user || items.length === 0) return;
    setCreating(true);
    try {
      const payload = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { data: rawData, error } = await supabase.rpc("create_order_and_payment_session", {
        p_items: payload as unknown as undefined,
      });

      if (error) throw error;
      if (!rawData) throw new Error("Không nhận được dữ liệu thanh toán từ server");

      const data = rawData as unknown as Record<string, string | null>;

      const session: CheckoutSession = {
        orderId: data.order_id,
        orderCode: data.order_code,
        amountVnd: Number(data.amount_vnd),
        transferContent: data.transfer_content,
        qrImageUrl: data.qr_image_url,
        expiresAt: data.expires_at ?? null,
        bankName: data.bank_name ?? "",
        bankAccountName: data.bank_account_name ?? "",
        bankAccountNumber: data.bank_account_number ?? "",
        status: data.status ?? "pending_payment",
      };

      setCheckoutSession(session);
      setOrderStatus(session.status);
      persistSession(session);
      clearCart();
      toast.success("Đã tạo đơn hàng. Vui lòng chuyển khoản đúng nội dung.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tạo đơn hàng";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!checkoutSession?.orderId) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("status, paid_at, delivered_at")
        .eq("id", checkoutSession.orderId)
        .single();

      if (error) throw error;
      if (!data) return;

      const nextStatus = data.status;
      setOrderStatus(nextStatus);
      setCheckoutSession((prev) => (prev ? { ...prev, status: nextStatus } : prev));

      if (nextStatus === "delivered") {
        toast.success("Thanh toán đã được xác nhận và tài khoản đã được giao.");
      } else if (nextStatus === "paid") {
        toast.success("Thanh toán đã được xác nhận. Hệ thống đang hoàn tất giao tài khoản.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể kiểm tra trạng thái đơn hàng";
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!checkoutSession?.orderId) return;
    if (["delivered", "cancelled", "refunded", "payment_failed"].includes(orderStatus)) return;

    const interval = window.setInterval(() => {
      void checkPaymentStatus();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [checkoutSession?.orderId, orderStatus]);

  // Pre-checkout: show cart summary + create order button
  if (!checkoutSession) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thanh toán</h1>
            <p className="mt-2 text-muted-foreground">
              Xác nhận đơn hàng để nhận QR chuyển khoản thanh toán.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">Tóm tắt đơn hàng</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-sm text-muted-foreground">Số lượng: {item.quantity}</div>
                  </div>
                  <div className="font-medium text-foreground">{formatVND(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-lg font-semibold text-foreground">
              <span>Tổng cộng</span>
              <span>{formatVND(totalAmount)}</span>
            </div>

            <Button onClick={createOrder} disabled={creating || items.length === 0} className="mt-6 w-full">
              {creating ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = (
    <Badge className={getStatusColor(orderStatus)}>{getStatusLabel(orderStatus)}</Badge>
  );

  // Delivered state
  if (orderStatus === "delivered") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-3xl font-bold text-foreground">Thanh toán thành công</h1>
          <p className="mt-3 text-muted-foreground">
            Đơn hàng <span className="font-medium text-foreground">{checkoutSession.orderCode}</span> đã được xác nhận và giao tài khoản.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">{statusBadge}</div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/orders/$orderId" params={{ orderId: checkoutSession.orderId }}>Xem đơn hàng</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                persistSession(null);
                setCheckoutSession(null);
                navigate({ to: "/products" });
              }}
            >
              Tiếp tục mua hàng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Paid state
  if (orderStatus === "paid") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <Clock className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-foreground">Đã nhận thanh toán</h1>
          <p className="mt-3 text-muted-foreground">
            Hệ thống đang hoàn tất giao tài khoản cho đơn <span className="font-medium text-foreground">{checkoutSession.orderCode}</span>.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">{statusBadge}</div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => void checkPaymentStatus()} disabled={checking} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              Cập nhật trạng thái
            </Button>
            <Button variant="outline" asChild>
              <Link to="/orders/$orderId" params={{ orderId: checkoutSession.orderId }}>Xem đơn hàng</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Failed/cancelled states
  if (["cancelled", "refunded", "payment_failed"].includes(orderStatus)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-bold text-foreground">Đơn hàng không thể tiếp tục</h1>
          <p className="mt-3 text-muted-foreground">
            Trạng thái hiện tại của đơn <span className="font-medium text-foreground">{checkoutSession.orderCode}</span> là {getStatusLabel(orderStatus).toLowerCase()}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">{statusBadge}</div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link to="/orders/$orderId" params={{ orderId: checkoutSession.orderId }}>Xem chi tiết đơn</Link>
            </Button>
            <Button asChild><Link to="/products">Quay lại sản phẩm</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending payment: show QR + bank info
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Chuyển khoản thanh toán</h1>
              <p className="mt-2 text-muted-foreground">
                Mã đơn: <span className="font-medium text-foreground">{checkoutSession.orderCode}</span>
              </p>
            </div>
            {statusBadge}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border bg-background p-4 text-center">
            {checkoutSession.qrImageUrl ? (
              <img
                src={checkoutSession.qrImageUrl}
                alt="QR thanh toán"
                className="mx-auto h-auto w-full max-w-xs rounded-lg"
              />
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-sm text-muted-foreground">
                Chưa tạo được QR. Bạn vẫn có thể chuyển khoản thủ công theo thông tin bên dưới.
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Vui lòng chuyển đúng số tiền và ghi đúng nội dung chuyển khoản để hệ thống tự động xác nhận.
          </p>

          <div className="mt-6 grid gap-4">
            {paymentRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 rounded-lg border bg-background px-4 py-3">
                <div>
                  <div className="text-sm text-muted-foreground">{row.label}</div>
                  <div className="mt-1 break-all font-medium text-foreground">{row.value || "Chưa cấu hình"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(row.value, row.label)}
                  className="rounded-md p-2 transition hover:bg-secondary"
                  aria-label={`Sao chép ${row.label}`}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">Tóm tắt thanh toán</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between text-base font-medium text-foreground">
                <span>Tổng thanh toán</span>
                <span>{formatVND(checkoutSession.amountVnd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mã đơn</span>
                <span className="font-medium text-foreground">{checkoutSession.orderCode}</span>
              </div>
              {checkoutSession.expiresAt && (
                <div className="flex items-center justify-between">
                  <span>Hết hạn lúc</span>
                  <span className="font-medium text-foreground">{formatDate(checkoutSession.expiresAt)}</span>
                </div>
              )}
            </div>

            <Button onClick={() => void checkPaymentStatus()} disabled={checking} className="mt-6 w-full gap-2">
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              Tôi đã chuyển khoản
            </Button>

            <Button variant="outline" className="mt-3 w-full" asChild>
              <Link to="/orders/$orderId" params={{ orderId: checkoutSession.orderId }}>Xem đơn hàng</Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <h3 className="font-semibold text-foreground">Lưu ý</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>Không sửa nội dung chuyển khoản.</li>
                  <li>Không chuyển thiếu hoặc dư số tiền.</li>
                  <li>Hệ thống tự kiểm tra mỗi 15 giây, bạn cũng có thể bấm cập nhật thủ công.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
