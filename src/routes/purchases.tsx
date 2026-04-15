import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatVND, getStatusColor, getStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [{ title: "Lịch sử mua hàng — DigitalStore" }],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-delivered-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name_snapshot, quantity, unit_price_vnd)")
        .eq("user_id", user!.id)
        .in("status", ["delivered", "paid"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Đang tải...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Lịch sử mua hàng</h1>
      <p className="mt-2 text-muted-foreground">
        Các đơn hàng đã thanh toán và giao tài khoản.
      </p>

      {ordersLoading ? (
        <p className="mt-6 text-muted-foreground">Đang tải...</p>
      ) : orders.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-10">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              Bạn chưa có đơn hàng nào đã hoàn tất.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/products">Xem sản phẩm</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const items = (order.order_items ?? []) as Array<{
              product_name_snapshot: string;
              quantity: number;
              unit_price_vnd: number;
            }>;
            return (
              <Link
                key={order.id}
                to="/orders/$orderId"
                params={{ orderId: order.id }}
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {order.order_code}
                          </span>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {formatDate(order.delivered_at ?? order.paid_at ?? order.created_at)}
                        </div>
                        <div className="mt-2 space-y-1">
                          {items.map((item, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {item.product_name_snapshot} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right font-medium text-foreground">
                        {formatVND(order.total_amount_vnd)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
