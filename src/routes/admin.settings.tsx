import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["admin-shop-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [shopName, setShopName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name ?? "");
      setSupportEmail(settings.support_email ?? "");
      setSupportPhone(settings.support_phone ?? "");
      setBankName(settings.bank_name ?? "");
      setBankAccountName(settings.bank_account_name ?? "");
      setBankAccountNumber(settings.bank_account_number ?? "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings?.id) {
        const { error } = await supabase
          .from("shop_settings")
          .update({
            shop_name: shopName,
            support_email: supportEmail,
            support_phone: supportPhone,
            bank_name: bankName,
            bank_account_name: bankAccountName,
            bank_account_number: bankAccountNumber,
          })
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_settings")
          .insert({
            shop_name: shopName,
            support_email: supportEmail,
            support_phone: supportPhone,
            bank_name: bankName,
            bank_account_name: bankAccountName,
            bank_account_number: bankAccountNumber,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shop-settings"] });
      toast.success("Đã lưu cài đặt");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể lưu");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Cài đặt cửa hàng</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
            <CardDescription>Thông tin hiển thị trên website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tên cửa hàng</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email hỗ trợ</Label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại hỗ trợ</Label>
                <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin ngân hàng</CardTitle>
            <CardDescription>Thông tin để tạo QR thanh toán (VietQR)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mã ngân hàng (VietQR bank code, ví dụ: VCB, TCB, MB)</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VCB" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Số tài khoản</Label>
                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tên chủ tài khoản</Label>
                <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </form>
    </div>
  );
}
