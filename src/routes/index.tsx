import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Zap, Headphones, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatVND } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DigitalStore — Tài khoản số & Giấy phép kỹ thuật số" },
      { name: "description", content: "Mua tài khoản số và giấy phép kỹ thuật số uy tín. Thanh toán QR tự động, giao account tức thì 24/7." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, short_description, price_vnd, cover_image_url")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Tài khoản số &<br />
              <span className="text-primary">Giấy phép kỹ thuật số</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Mua nhanh, nhận ngay. Thanh toán QR tự động, giao tài khoản tức thì 24/7.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link to="/products">
                  Xem sản phẩm <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Đăng ký ngay</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border bg-card py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Zap, title: "Thanh toán QR tự động", desc: "Quét QR, chuyển khoản, xác nhận tức thì" },
            { icon: Shield, title: "Giao account tự động", desc: "Nhận tài khoản ngay sau khi thanh toán" },
            { icon: Headphones, title: "Hỗ trợ nhanh", desc: "Đội ngũ hỗ trợ sẵn sàng giúp bạn" },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{badge.title}</h3>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Sản phẩm nổi bật</h2>
              <Link to="/products" className="text-sm font-medium text-primary hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Link key={product.id} to="/products/$slug" params={{ slug: product.slug }}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-video overflow-hidden bg-muted">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Star className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {product.short_description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.short_description}</p>
                      )}
                      <p className="mt-3 text-lg font-bold text-primary">{formatVND(product.price_vnd)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              { q: "Tài khoản được giao như thế nào?", a: "Sau khi thanh toán được xác nhận tự động, hệ thống sẽ giao thông tin tài khoản ngay trong trang đơn hàng của bạn." },
              { q: "Thanh toán bằng cách nào?", a: "Chúng tôi hỗ trợ chuyển khoản ngân hàng qua QR code. Hệ thống tự động xác nhận thanh toán." },
              { q: "Có hỗ trợ hoàn tiền không?", a: "Có. Vui lòng xem chính sách hoàn tiền chi tiết tại trang Chính sách hoàn tiền." },
              { q: "Tôi có thể liên hệ hỗ trợ ở đâu?", a: "Bạn có thể gửi yêu cầu hỗ trợ qua trang Liên hệ hoặc liên hệ trực tiếp qua email." },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{faq.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">Bắt đầu ngay hôm nay</h2>
          <p className="mt-3 text-muted-foreground">Đăng ký tài khoản miễn phí và khám phá các sản phẩm số của chúng tôi.</p>
          <div className="mt-6">
            <Button size="lg" asChild>
              <Link to="/register">Tạo tài khoản miễn phí</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
