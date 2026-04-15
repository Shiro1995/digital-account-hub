import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Liên hệ — DigitalStore" },
      { name: "description", content: "Liên hệ với đội ngũ hỗ trợ DigitalStore" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        name, email, subject, message,
      });
      if (error) throw error;
      toast.success("Đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm.");
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Liên hệ</h1>
      <p className="mt-2 text-muted-foreground">Gửi tin nhắn cho chúng tôi và chúng tôi sẽ phản hồi sớm nhất.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Gửi tin nhắn</CardTitle>
            <CardDescription>Điền thông tin bên dưới</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Chủ đề</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={500} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Nội dung</Label>
                <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang gửi..." : "Gửi tin nhắn"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-start gap-3 p-6">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="mt-1 text-sm text-muted-foreground">support@digitalstore.vn</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-6">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Hotline</h3>
                <p className="mt-1 text-sm text-muted-foreground">1900 xxxx</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
