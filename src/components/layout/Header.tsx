import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/" as const, label: "Trang chủ" },
    { to: "/products" as const, label: "Sản phẩm" },
    { to: "/contact" as const, label: "Liên hệ" },
  ];

  const userLinks = user
    ? [
        { to: "/purchases" as const, label: "Đã mua" },
        { to: "/account" as const, label: "Tài khoản" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          DigitalStore
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/cart" })}>
            <ShoppingCart className="h-5 w-5" />
          </Button>
          {user ? (
            <>
              {userLinks.map((link) => (
                <Button key={link.to} variant="ghost" size="sm" onClick={() => navigate({ to: link.to })}>
                  {link.label}
                </Button>
              ))}
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin" })}>
                  Admin
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/login" })}>
              Đăng nhập
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground bg-accent" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/cart"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Giỏ hàng
            </Link>
            {user ? (
              <>
                <Link to="/purchases" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  Đã mua
                </Link>
                <Link to="/account" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  Tài khoản
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                    Quản trị
                  </Link>
                )}
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive">
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
