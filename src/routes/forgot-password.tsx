import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Quên mật khẩu — DigitalStore" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Đã gửi email đặt lại mật khẩu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
          <CardDescription>Nhập email để nhận link đặt lại mật khẩu</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center text-sm text-muted-foreground">
              <p>Đã gửi email đặt lại mật khẩu đến <span className="font-medium text-foreground">{email}</span>.</p>
              <p className="mt-2">Vui lòng kiểm tra hộp thư (bao gồm spam).</p>
              <Link to="/login" className="mt-4 inline-block text-primary hover:underline">Quay lại đăng nhập</Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
