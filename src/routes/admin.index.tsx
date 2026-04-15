import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, Users } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, pendingOrders, profiles] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount_vnd"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const totalRevenue = (orders.data ?? []).reduce((sum, o) => sum + Number(o.total_amount_vnd), 0);
      return {
        productCount: products.count ?? 0,
        orderCount: (orders.data ?? []).length,
        pendingCount: pendingOrders.count ?? 0,
        userCount: profiles.count ?? 0,
        totalRevenue,
      };
    },
  });

  const cards = [
    { title: "Sản phẩm", value: stats?.productCount ?? 0, icon: Package, format: (v: number) => String(v) },
    { title: "Đơn hàng", value: stats?.orderCount ?? 0, icon: ShoppingCart, format: (v: number) => String(v) },
    { title: "Chờ thanh toán", value: stats?.pendingCount ?? 0, icon: DollarSign, format: (v: number) => String(v) },
    { title: "Tổng doanh thu", value: stats?.totalRevenue ?? 0, icon: DollarSign, format: (v: number) => formatVND(v) },
    { title: "Người dùng", value: stats?.userCount ?? 0, icon: Users, format: (v: number) => String(v) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.format(card.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
