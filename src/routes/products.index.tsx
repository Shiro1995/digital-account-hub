import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Sản phẩm — DigitalStore" },
      { name: "description", content: "Danh sách tài khoản số và giấy phép kỹ thuật số." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, slug, short_description, price_vnd, cover_image_url, category_id, is_featured")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (categoryFilter) q = q.eq("category_id", categoryFilter);
      if (search) q = q.ilike("name", `%${search}%`);

      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Sản phẩm</h1>
      <p className="mt-2 text-muted-foreground">Khám phá tài khoản số và giấy phép kỹ thuật số.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(null)}
          >
            Tất cả
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="mt-12 text-center text-muted-foreground">Đang tải...</div>
      ) : products && products.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} to="/products/$slug" params={{ slug: product.slug }}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {product.cover_image_url ? (
                    <img src={product.cover_image_url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><Star className="h-8 w-8" /></div>
                  )}
                  {product.is_featured && (
                    <Badge className="absolute left-2 top-2">Nổi bật</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  {product.short_description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.short_description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatVND(product.price_vnd)}</span>
                    <Button size="sm">Xem chi tiết</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
        </div>
      )}
    </div>
  );
}
