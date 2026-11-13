import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "미소치과 어드민", description: "예약 · 문의 · 검진 · 자료 관리" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
