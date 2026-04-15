export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_payment: "Chờ thanh toán",
    paid: "Đã thanh toán",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    payment_failed: "Thanh toán thất bại",
  };
  return map[status] ?? status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending_payment: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-primary/10 text-primary border-primary/20",
    delivered: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-muted text-muted-foreground",
    payment_failed: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return map[status] ?? "";
}

export function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ORD-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
