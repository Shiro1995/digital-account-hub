import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  formatVND,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

type OrderAction = {
  orderId: string;
  orderCode: string;
  action: "cancelled" | "refunded";
};

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      orderId,
      action,
    }: {
      orderId: string;
      action: "cancelled" | "refunded";
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: `order_${action}`,
        entity_type: "order",
        entity_id: orderId,
        metadata: { triggered_by: "admin" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Đã cập nhật trạng thái đơn hàng");
      setPendingAction(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật",
      );
    },
  });

  const confirmAction = () => {
    if (!pendingAction) return;
    statusMutation.mutate({
      orderId: pendingAction.orderId,
      action: pendingAction.action,
    });
  };

  const actionLabel = pendingAction?.action === "cancelled" ? "Hủy" : "Hoàn tiền";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const canCancel = order.status === "pending_payment";
                const canRefund = ["paid", "delivered"].includes(order.status);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVND(order.total_amount_vnd)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.payment_reference || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPendingAction({
                                orderId: order.id,
                                orderCode: order.order_code,
                                action: "cancelled",
                              })
                            }
                          >
                            Hủy
                          </Button>
                        )}
                        {canRefund && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPendingAction({
                                orderId: order.id,
                                orderCode: order.order_code,
                                action: "refunded",
                              })
                            }
                          >
                            Hoàn tiền
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Chưa có đơn hàng nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionLabel} đơn hàng {pendingAction?.orderCode}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc muốn{" "}
              {actionLabel.toLowerCase()} đơn hàng này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending
                ? "Đang xử lý..."
                : `Xác nhận ${actionLabel.toLowerCase()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
