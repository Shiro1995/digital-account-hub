import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatVND, getStatusColor, getStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [{ title: "Chi tiết đơn hàng — DigitalStore" }],
  }),
  component: OrderDetailPage,
});

type DeliveredCredential = {
  delivered_item_id: string;
  order_item_id: string;
  inventory_item_id: string;
  credential_username: string | null;
  credential_password: string | null;
  credential_email: string | null;
  credential_recovery_info: string | null;
  delivered_at: string;
};

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId, user?.id],
    enabled: Boolean(user && orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items", orderId],
    enabled: Boolean(order),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: deliveredItems = [] } = useQuery({
    queryKey: ["delivered-credentials", orderId],
    enabled: Boolean(order && order.status === "delivered"),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_delivered_credentials_for_user", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return (data ?? []) as DeliveredCredential[];
    },
  });

  const copyAll = async () => {
    if (!deliveredItems.length) return;
    const payload = deliveredItems
      .map((item, index) => {
        return [
          `Tài khoản #${index + 1}`,
          `Username: ${item.credential_username ?? ""}`,
          `Password: ${item.credential_password ?? ""}`,
          item.credential_email ? `Email: ${item.credential_email}` : null,
          item.credential_recovery_info ? `Recovery: ${item.credential_recovery_info}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n---\n");

    await navigator.clipboard.writeText(payload);
    toast.success("Đã sao chép toàn bộ thông tin tài khoản");
  };

  if (orderLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Không tìm thấy đơn hàng.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/products">Quay lại sản phẩm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Order header */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Đơn hàng {order.order_code}</h1>
              <p className="mt-2 text-muted-foreground">
                Theo dõi trạng thái thanh toán và nhận tài khoản tại đây.
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-background p-4">
              <div className="text-sm text-muted-foreground">Ngày đặt</div>
              <div className="mt-1 font-medium text-foreground">{formatDate(order.created_at)}</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="text-sm text-muted-foreground">Tổng tiền</div>
              <div className="mt-1 font-medium text-foreground">{formatVND(order.total_amount_vnd)}</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="text-sm text-muted-foreground">Thanh toán</div>
              <div className="mt-1 font-medium text-foreground">{order.paid_at ? formatDate(order.paid_at) : "Chưa xác nhận"}</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="text-sm text-muted-foreground">Giao hàng</div>
              <div className="mt-1 font-medium text-foreground">{order.delivered_at ? formatDate(order.delivered_at) : "Chưa giao"}</div>
            </div>
          </div>

          {order.payment_reference && (
            <div className="mt-4 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
              Mã thanh toán: <span className="font-medium text-foreground">{order.payment_reference}</span>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Chi tiết đơn hàng</h2>
          <div className="mt-4 space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
                <div>
                  <div className="font-medium text-foreground">{item.product_name_snapshot}</div>
                  <div className="text-sm text-muted-foreground">Số lượng: {item.quantity}</div>
                </div>
                <div className="font-medium text-foreground">{formatVND(item.unit_price_vnd * item.quantity)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivered credentials */}
        {order.status === "delivered" && deliveredItems.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Thông tin tài khoản đã mua</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thông tin được lấy qua hàm server-side an toàn.
                </p>
              </div>
              <Button variant="outline" onClick={() => void copyAll()} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy tất cả
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {deliveredItems.map((item, index) => {
                const isVisible = Boolean(showCredentials[item.delivered_item_id]);

                return (
                  <div key={item.delivered_item_id} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">Tài khoản #{index + 1}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Giao lúc {formatDate(item.delivered_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setShowCredentials((prev) => ({
                            ...prev,
                            [item.delivered_item_id]: !prev[item.delivered_item_id],
                          }));
                        }}
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {isVisible ? "Ẩn" : "Hiện"}
                      </Button>
                    </div>

                    {isVisible && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border px-4 py-3">
                          <div className="text-sm text-muted-foreground">Username</div>
                          <div className="mt-1 break-all font-medium text-foreground">{item.credential_username || "—"}</div>
                        </div>
                        <div className="rounded-lg border px-4 py-3">
                          <div className="text-sm text-muted-foreground">Password</div>
                          <div className="mt-1 break-all font-medium text-foreground">{item.credential_password || "—"}</div>
                        </div>
                        {item.credential_email && (
                          <div className="rounded-lg border px-4 py-3">
                            <div className="text-sm text-muted-foreground">Email</div>
                            <div className="mt-1 break-all font-medium text-foreground">{item.credential_email}</div>
                          </div>
                        )}
                        {item.credential_recovery_info && (
                          <div className="rounded-lg border px-4 py-3 sm:col-span-2">
                            <div className="text-sm text-muted-foreground">Recovery</div>
                            <div className="mt-1 break-all font-medium text-foreground">{item.credential_recovery_info}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
