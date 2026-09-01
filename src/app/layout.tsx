import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CÔNG CỤ TẠO MA TRẬN - ĐỀ KIỂM TRA MÔN VĂN",
  description: "Ứng dụng tự động tạo Ma trận và Bảng đặc tả 100% Tự luận dựa trên AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
