import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Điều khoản sử dụng — DigitalStore" },
      { name: "description", content: "Điều khoản sử dụng dịch vụ DigitalStore." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Điều khoản sử dụng</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cập nhật lần cuối: 15/04/2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Giới thiệu</h2>
          <p className="mt-2">
            Chào mừng bạn đến với DigitalStore. Khi truy cập và sử dụng website của chúng tôi, bạn đồng ý tuân thủ
            các điều khoản và điều kiện được nêu dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Tài khoản người dùng</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bạn phải cung cấp thông tin chính xác khi đăng ký tài khoản.</li>
            <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
            <li>Mỗi người chỉ được sở hữu một tài khoản. Chúng tôi có quyền khóa tài khoản trùng lặp.</li>
            <li>Bạn không được chia sẻ, bán lại hoặc chuyển nhượng tài khoản người dùng.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Sản phẩm và dịch vụ</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Sản phẩm trên DigitalStore là tài khoản số và giấy phép kỹ thuật số.</li>
            <li>Sau khi thanh toán thành công, sản phẩm sẽ được giao tự động qua hệ thống.</li>
            <li>Chúng tôi không đảm bảo sản phẩm sẽ luôn có sẵn. Tồn kho được cập nhật theo thời gian thực.</li>
            <li>Giá sản phẩm có thể thay đổi mà không cần thông báo trước.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Thanh toán</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng (QR code).</li>
            <li>Thanh toán được xác nhận tự động bởi hệ thống.</li>
            <li>Đơn hàng chưa thanh toán sau 30 phút sẽ tự động hủy.</li>
            <li>Bạn phải chuyển đúng số tiền và nội dung chuyển khoản được chỉ định.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Quyền sở hữu trí tuệ</h2>
          <p className="mt-2">
            Toàn bộ nội dung trên website (bao gồm logo, thiết kế, văn bản) thuộc sở hữu của DigitalStore và được
            bảo vệ bởi luật sở hữu trí tuệ. Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại
            mà không có sự cho phép bằng văn bản.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Hành vi bị cấm</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Sử dụng dịch vụ cho mục đích bất hợp pháp.</li>
            <li>Cố gắng truy cập trái phép vào hệ thống.</li>
            <li>Gian lận thanh toán hoặc lạm dụng chính sách hoàn tiền.</li>
            <li>Bán lại sản phẩm đã mua trên nền tảng khác (trừ khi được cho phép).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Giới hạn trách nhiệm</h2>
          <p className="mt-2">
            DigitalStore cung cấp dịch vụ "nguyên trạng" (as-is). Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt
            hại gián tiếp nào phát sinh từ việc sử dụng dịch vụ, bao gồm nhưng không giới hạn ở mất dữ liệu, gián
            đoạn kinh doanh hoặc mất lợi nhuận.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Thay đổi điều khoản</h2>
          <p className="mt-2">
            Chúng tôi có quyền cập nhật điều khoản bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng
            trên website. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Liên hệ</h2>
          <p className="mt-2">
            Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ chúng tôi qua{" "}
            <a href="/contact" className="text-primary hover:underline">trang Liên hệ</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
