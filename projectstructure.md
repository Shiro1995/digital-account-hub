DigitalStore — Project Structure & Architecture
Marketplace bán tài khoản số & giấy phép kỹ thuật số.
Stack: TanStack Start (React 19 SSR) + Vite 7 + Supabase (Lovable Cloud) + Tailwind CSS v4

📁 Cấu trúc thư mục
/
├── public/
│   └── placeholder.svg              # Ảnh placeholder mặc định
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Navigation chính (logo, menu, cart, auth)
│   │   │   └── Footer.tsx            # Footer toàn site
│   │   └── ui/                       # shadcn/ui components (40+ file)
│   │       ├── button.tsx, card.tsx, dialog.tsx, table.tsx ...
│   │       └── sonner.tsx            # Toast notifications
│   │
│   ├── hooks/
│   │   ├── use-auth.tsx              # AuthProvider + useAuth() — quản lý session, role (admin/customer)
│   │   ├── use-cart.tsx              # CartProvider + useCart() — giỏ hàng (localStorage)
│   │   └── use-mobile.tsx            # Hook detect mobile viewport
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                 # ⚠️ AUTO-GEN — Supabase browser client
│   │   ├── client.server.ts          # ⚠️ AUTO-GEN — Supabase server client (SSR)
│   │   ├── types.ts                  # ⚠️ AUTO-GEN — TypeScript types từ DB schema
│   │   └── auth-middleware.ts        # Middleware xác thực cho server functions
│   │
│   ├── lib/
│   │   ├── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   │   └── format.ts                 # formatVND() — format tiền VND
│   │
│   ├── routes/                       # 🔑 FILE-BASED ROUTING (TanStack Router)
│   │   ├── __root.tsx                # Root layout: HTML shell, providers, Header/Footer
│   │   ├── index.tsx                 # / — Trang chủ (featured products, categories)
│   │   │
│   │   │── ─── AUTH ───
│   │   ├── login.tsx                 # /login — Đăng nhập (email/password)
│   │   ├── register.tsx              # /register — Đăng ký (+ display name)
│   │   ├── forgot-password.tsx       # /forgot-password — Quên mật khẩu
│   │   ├── reset-password.tsx        # /reset-password — Đặt lại mật khẩu (từ email link)
│   │   │
│   │   │── ─── SHOP ───
│   │   ├── products.index.tsx        # /products — Danh sách sản phẩm (filter by category)
│   │   ├── products.$slug.tsx        # /products/:slug — Chi tiết sản phẩm
│   │   ├── cart.tsx                  # /cart — Giỏ hàng
│   │   ├── checkout.tsx              # /checkout — Thanh toán (tạo order → QR VietQR)
│   │   │
│   │   │── ─── CUSTOMER ───
│   │   ├── account.tsx               # /account — Hồ sơ cá nhân + danh sách đơn hàng
│   │   ├── purchases.tsx             # /purchases — Lịch sử mua hàng (delivered orders)
│   │   ├── orders.$orderId.tsx       # /orders/:orderId — Chi tiết đơn + xem credentials
│   │   │
│   │   │── ─── ADMIN (layout + children) ───
│   │   ├── admin.tsx                 # /admin — Layout admin (sidebar nav + Outlet)
│   │   ├── admin.index.tsx           # /admin/ — Dashboard tổng quan (stats)
│   │   ├── admin.products.tsx        # /admin/products — CRUD sản phẩm + inventory
│   │   ├── admin.orders.tsx          # /admin/orders — Quản lý đơn hàng (cancel/refund)
│   │   ├── admin.payments.tsx        # /admin/payments — Webhook events monitoring
│   │   ├── admin.settings.tsx        # /admin/settings — Cấu hình shop (bank info)
│   │   ├── admin.support.tsx         # /admin/support — Tin nhắn hỗ trợ
│   │   │
│   │   │── ─── STATIC ───
│   │   ├── contact.tsx               # /contact — Form liên hệ
│   │   ├── terms.tsx                 # /terms — Điều khoản sử dụng
│   │   └── refund-policy.tsx         # /refund-policy — Chính sách hoàn tiền
│   │
│   ├── styles.css                    # Tailwind v4 config + design tokens (oklch)
│   ├── router.tsx                    # Router config (QueryClient, error boundaries)
│   └── routeTree.gen.ts             # ⚠️ AUTO-GEN — Route tree
│
├── supabase/
│   ├── config.toml                   # Supabase project config
│   ├── functions/
│   │   └── payment-webhook/
│   │       └── index.ts              # Edge Function: webhook nhận thanh toán
│   └── migrations/                   # ⚠️ READ-ONLY — SQL migrations
│       ├── 20260415044201_*.sql      # Schema gốc
│       ├── 20260415044225_*.sql      # RLS policies
│       ├── 20260415105643_*.sql      # Order flow hardening
│       ├── 20260415135454_*.sql      # Additional fixes
│       ├── 20260415144345_*.sql      # Shop settings RLS (authenticated)
│       └── 20260415144450_*.sql      # Shop settings RLS (admin only)
│
├── .env                              # ⚠️ AUTO-GEN — VITE_SUPABASE_URL, keys
├── components.json                   # shadcn/ui config
├── vite.config.ts                    # Vite 7 + TanStack Start plugin
├── wrangler.jsonc                    # Cloudflare Workers deploy config
└── tsconfig.json                     # TypeScript strict mode
🗄️ Database Schema (Supabase/PostgreSQL)
Bảng chính
Bảng	Mục đích	RLS
profiles	Thông tin user (display_name, phone)	User đọc/sửa own, Admin đọc all
user_roles	Phân quyền (admin/customer)	User đọc own, Admin manage
categories	Danh mục sản phẩm	Public đọc active, Admin manage
products	Sản phẩm (name, slug, price, images)	Public đọc active, Admin manage
product_images	Gallery ảnh sản phẩm	Public đọc, Admin manage
inventory_items	Kho tài khoản (credentials)	Admin only
orders	Đơn hàng	User đọc own, Admin manage
order_items	Chi tiết đơn hàng	User đọc own, Admin manage
payment_sessions	Phiên thanh toán QR	User đọc own, Admin manage
payment_events	Log webhook events	Admin only
delivered_items	Tài khoản đã giao cho user	User đọc own, Admin manage
audit_logs	Log hành động hệ thống	Admin đọc only
shop_settings	Cấu hình shop (bank info)	Admin only
support_messages	Tin nhắn liên hệ	Public insert, Admin đọc/update
Enums
Enum	Values
app_role	admin, customer
inventory_status	available, reserved, sold, disabled
order_status	pending_payment, paid, delivered, cancelled, refunded, payment_failed
payment_session_status	pending, matched, expired, failed
support_message_status	new, closed
Database Functions (RPC)
Function	Mục đích	Security
create_order_and_payment_session(p_items)	Tạo order + payment session + QR URL	SECURITY DEFINER
process_payment_and_deliver(p_order_id, ...)	Xác nhận thanh toán + giao tài khoản	SECURITY DEFINER
allocate_inventory_for_order(p_order_id)	Retry allocation nếu lần đầu fail	SECURITY DEFINER
get_delivered_credentials_for_user(p_order_id)	Lấy credentials an toàn (check owner)	SECURITY DEFINER
get_product_stock(p_product_id)	Đếm inventory available	SECURITY DEFINER
has_role(_user_id, _role)	Check quyền user	SECURITY DEFINER
generate_order_code()	Tạo mã đơn unique (ORD-XXXXXX)	SECURITY DEFINER
handle_new_user()	Trigger: tạo profile + role khi signup	SECURITY DEFINER
🔄 Flow chính
1. Mua hàng (Customer)
Xem sản phẩm → Thêm giỏ hàng (localStorage)
     ↓
Vào /checkout → Gọi RPC create_order_and_payment_session
     ↓
Hiện QR VietQR (bank transfer) + mã chuyển khoản = order_code
     ↓
Polling 15s: check order status (pending → paid → delivered)
     ↓
Khi delivered → Xem credentials tại /orders/:id
     ↓
Lịch sử mua: /purchases hoặc /account
2. Thanh toán (Webhook)
Bank gateway POST → /functions/v1/payment-webhook
     ↓
Xác thực token (PAYMENT_WEBHOOK_TOKEN secret)
     ↓
Parse: amount, transaction_content (= order_code)
     ↓
Match order → Check amount ≥ order total
     ↓
Gọi RPC process_payment_and_deliver:
  - Update order: pending_payment → paid
  - Allocate inventory (available → sold)
  - Copy credentials → delivered_items
  - Nếu đủ: paid → delivered
     ↓
Idempotency: duplicate webhook → reconcile (retry allocation nếu cần)
     ↓
Log vào payment_events + audit_logs
3. Admin
/admin           → Dashboard (tổng đơn, doanh thu, sản phẩm)
/admin/products  → CRUD sản phẩm + quản lý inventory (bulk add credentials)
/admin/orders    → Xem/hủy/hoàn tiền đơn (có confirm dialog)
/admin/payments  → Xem webhook events
/admin/settings  → Cấu hình bank info cho QR
/admin/support   → Đọc tin nhắn liên hệ
🔐 Security Model
Layer	Cách bảo vệ
Auth	Email/password only (Supabase Auth)
Roles	Bảng riêng user_roles, check qua has_role() SECURITY DEFINER
RLS	Mọi bảng đều bật RLS, policy theo role
Credentials	Chỉ truy cập qua RPC get_delivered_credentials_for_user (check owner)
Inventory	Admin-only access, không public query
Shop settings	Admin-only (RPC dùng SECURITY DEFINER để đọc bank info)
Webhook	Token auth + idempotency + amount validation
Admin actions	Confirm dialog + loading state chống double-click
🛠️ Tech Stack
Component	Technology
Framework	TanStack Start v1 (React 19, SSR)
Build	Vite 7
Routing	TanStack Router (file-based)
State	TanStack Query (server state) + React state + localStorage (cart)
Styling	Tailwind CSS v4 + shadcn/ui (New York style)
Backend	Supabase (Lovable Cloud) — PostgreSQL + Auth + Edge Functions + Storage
Deploy	Cloudflare Workers (Edge)
Payment	VietQR bank transfer + webhook
Language	Vietnamese UI, VND currency
📝 Ghi chú
Files có đánh dấu ⚠️ AUTO-GEN không được sửa tay (tự generate)
src/routes/ dùng flat dot-separated convention: admin.products.tsx = /admin/products
Cart lưu localStorage, mất khi clear browser
Webhook token cần set secret PAYMENT_WEBHOOK_TOKEN trong Supabase Edge Functions
Mọi mutation nhạy cảm đều qua RPC (SECURITY DEFINER) — không query trực tiếp từ client