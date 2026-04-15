import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { formatVND } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Giỏ hàng — DigitalStore" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Giỏ hàng trống</h1>
        <p className="mt-2 text-muted-foreground">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục.</p>
        <Button className="mt-6" asChild><Link to="/products">Xem sản phẩm</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Giỏ hàng</h1>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.coverImage ? (
                  <img src={item.coverImage} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs">Ảnh</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                <p className="text-sm text-primary">{formatVND(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.maxStock}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="w-28 text-right font-semibold text-foreground">{formatVND(item.price * item.quantity)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.productId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="flex items-center justify-between p-6">
          <span className="text-lg font-semibold text-foreground">Tổng cộng</span>
          <span className="text-2xl font-bold text-primary">{formatVND(totalAmount)}</span>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" asChild><Link to="/products">Tiếp tục mua</Link></Button>
        <Button size="lg" asChild><Link to="/checkout">Thanh toán</Link></Button>
      </div>
    </div>
  );
}
