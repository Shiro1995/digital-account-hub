import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">DigitalStore</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cung cấp tài khoản số & giấy phép kỹ thuật số uy tín, giao dịch tự động 24/7.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Sản phẩm</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">Tất cả sản phẩm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Hỗ trợ</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Liên hệ</Link></li>
              <li><a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Điều khoản</a></li>
              <li><a href="/refund-policy" className="text-sm text-muted-foreground hover:text-foreground">Chính sách hoàn tiền</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Tài khoản</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Đăng nhập</Link></li>
              <li><Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">Đăng ký</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DigitalStore. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
