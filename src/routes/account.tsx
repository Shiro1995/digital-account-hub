import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatVND, formatDate, getStatusLabel, getStatusColor } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, User, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Tài khoản — DigitalStore" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Đang tải...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Tài khoản</h1>
      <p className="mt-2 text-muted-foreground">Xin chào, {profile?.display_name || user.email}</p>

      {/* Profile card */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="mt-1 font-medium text-foreground">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tên hiển thị</div>
              <div className="mt-1 font-medium text-foreground">{profile?.display_name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Số điện thoại</div>
              <div className="mt-1 font-medium text-foreground">{profile?.phone || "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Đơn hàng của tôi</h2>
        </div>

        {orders.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-10">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Bạn chưa có đơn hàng nào</p>
              <Button className="mt-4" asChild><Link to="/products">Xem sản phẩm</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <Link key={order.id} to="/orders/$orderId" params={{ orderId: order.id }}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-foreground">{order.order_code}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{formatVND(order.total_amount_vnd)}</span>
                      <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
