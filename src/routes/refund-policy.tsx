import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Chính sách hoàn tiền — DigitalStore" },
      { name: "description", content: "Chính sách hoàn tiền và đổi trả của DigitalStore." },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Chính sách hoàn tiền</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cập nhật lần cuối: 15/04/2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Phạm vi áp dụng</h2>
          <p className="mt-2">
            Chính sách hoàn tiền áp dụng cho tất cả sản phẩm số (tài khoản, giấy phép kỹ thuật số) được mua trên
            DigitalStore. Do tính chất đặc biệt của sản phẩm số, chính sách hoàn tiền có một số giới hạn nhất định.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Các trường hợp được hoàn tiền</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Sản phẩm không hoạt động:</strong> Tài khoản/giấy phép không thể sử dụng ngay sau khi giao.</li>
            <li><strong>Sản phẩm sai mô tả:</strong> Sản phẩm nhận được khác với mô tả trên website.</li>
            <li><strong>Không nhận được sản phẩm:</strong> Đã thanh toán nhưng hệ thống không giao sản phẩm.</li>
            <li><strong>Lỗi hệ thống:</strong> Thanh toán trùng lặp hoặc tính sai số tiền.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Các trường hợp KHÔNG được hoàn tiền</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bạn đã sử dụng sản phẩm (đăng nhập, thay đổi mật khẩu, sử dụng giấy phép).</li>
            <li>Bạn đổi ý sau khi mua mà sản phẩm vẫn hoạt động bình thường.</li>
            <li>Sản phẩm bị khóa do vi phạm điều khoản của nhà cung cấp gốc.</li>
            <li>Yêu cầu hoàn tiền sau 48 giờ kể từ khi giao sản phẩm.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Quy trình hoàn tiền</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Gửi yêu cầu hoàn tiền qua <a href="/contact" className="text-primary hover:underline">trang Liên hệ</a> trong vòng 48 giờ sau khi nhận sản phẩm.</li>
            <li>Cung cấp mã đơn hàng và mô tả chi tiết vấn đề gặp phải.</li>
            <li>Đội ngũ hỗ trợ sẽ xem xét và phản hồi trong vòng 24 giờ làm việc.</li>
            <li>Nếu yêu cầu được chấp nhận, hoàn tiền sẽ được thực hiện trong 3-5 ngày làm việc.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Phương thức hoàn tiền</h2>
          <p className="mt-2">
            Hoàn tiền được chuyển khoản trực tiếp về tài khoản ngân hàng bạn cung cấp. Bạn cần cung cấp thông tin
            ngân hàng chính xác (tên ngân hàng, số tài khoản, tên chủ tài khoản) khi gửi yêu cầu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Đổi sản phẩm</h2>
          <p className="mt-2">
            Trong một số trường hợp, thay vì hoàn tiền, chúng tôi có thể đề xuất đổi sang sản phẩm tương đương nếu
            còn hàng. Quyết định cuối cùng thuộc về DigitalStore.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Liên hệ</h2>
          <p className="mt-2">
            Mọi thắc mắc về chính sách hoàn tiền, vui lòng liên hệ qua{" "}
            <a href="/contact" className="text-primary hover:underline">trang Liên hệ</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
