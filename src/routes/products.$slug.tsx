import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { ShoppingCart, Package } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — DigitalStore` },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      return data;
    },
  });

  const { data: stock } = useQuery({
    queryKey: ["stock", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_product_stock", { p_product_id: product!.id });
      return data as number ?? 0;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Đang tải...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Không tìm thấy sản phẩm</h1>
        <Button className="mt-4" asChild><Link to="/products">Quay lại danh sách</Link></Button>
      </div>
    );
  }

  const inStock = (stock ?? 0) > 0;
  const images = product.product_images?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) ?? [];

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price_vnd,
      coverImage: product.cover_image_url ?? undefined,
      maxStock: stock ?? 0,
    });
    toast.success("Đã thêm vào giỏ hàng!");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">← Tất cả sản phẩm</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg bg-muted">
            {product.cover_image_url ? (
              <img src={product.cover_image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-16 w-16" /></div>
            )}
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img: { id: string; image_url: string }) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">{formatVND(product.price_vnd)}</span>
            {inStock ? (
              <Badge variant="secondary" className="bg-success/10 text-success">Còn hàng ({stock})</Badge>
            ) : (
              <Badge variant="destructive">Hết hàng</Badge>
            )}
          </div>

          {product.short_description && (
            <p className="mt-4 text-muted-foreground">{product.short_description}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" disabled={!inStock} onClick={handleAdd}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? "Thêm vào giỏ" : "Hết hàng"}
            </Button>
            {inStock && (
              <Button size="lg" variant="outline" asChild>
                <Link to="/cart">Mua ngay</Link>
              </Button>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">Mô tả chi tiết</h2>
                <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.description}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
