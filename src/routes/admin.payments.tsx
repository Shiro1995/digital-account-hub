import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatVND, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const { data: events = [] } = useQuery({
    queryKey: ["admin-payment-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Sự kiện thanh toán</h1>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Lỗi</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium text-foreground">{event.external_transaction_id || "—"}</TableCell>
                  <TableCell className="text-right">{event.amount_vnd ? formatVND(event.amount_vnd) : "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{event.transaction_content || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={event.processing_status === "completed" ? "default" : event.processing_status === "failed" ? "destructive" : "secondary"}>
                      {event.processing_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-destructive">{event.error_message || ""}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(event.created_at)}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có sự kiện thanh toán nào</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
