import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("support_messages")
        .update({ status: "closed" as const })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
      toast.success("Đã đóng tin nhắn");
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Tin nhắn hỗ trợ</h1>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium text-foreground">{msg.name}</TableCell>
                  <TableCell className="text-muted-foreground">{msg.email}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{msg.subject}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={msg.status === "new" ? "default" : "secondary"}>
                      {msg.status === "new" ? "Mới" : "Đã đóng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(msg.created_at)}</TableCell>
                  <TableCell>
                    {msg.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => closeMutation.mutate(msg.id)}>
                        Đóng
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {messages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có tin nhắn nào</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
