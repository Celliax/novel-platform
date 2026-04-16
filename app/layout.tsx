import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FPT 소설 플랫폼",
  description: "FPT 소설 플랫폼은 소설을 작성하고 관리하는 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-canvas text-foreground antialiased font-sans">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="bg-ink text-canvas/90 py-8 text-center text-sm">
          <p>© 2026 FPT 소설 플랫폼</p>
        </footer>
      </body>
    </html>
  );
}
