import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Package, ShoppingCart, CreditCard, Settings, BarChart3, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Quản trị — DigitalStore" }],
  }),
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin" as const, label: "Tổng quan", icon: BarChart3, exact: true },
  { to: "/admin/products" as const, label: "Sản phẩm", icon: Package },
  { to: "/admin/orders" as const, label: "Đơn hàng", icon: ShoppingCart },
  { to: "/admin/payments" as const, label: "Thanh toán", icon: CreditCard },
  { to: "/admin/support" as const, label: "Hỗ trợ", icon: MessageSquare },
  { to: "/admin/settings" as const, label: "Cài đặt", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate({ to: "/" });
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || !user || !isAdmin) {
    return <div className="mx-auto max-w-7xl px-4 py-10">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
              activeOptions={{ exact: item.exact }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
