import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fptnovel.vercel.app";
const DESCRIPTION = "누구나 자유롭게 상상의 나래를 펼치고, 소중한 작품을 세상에 선보일 수 있습니다.";

export const metadata: Metadata = {
  title: "FPT 소설 플랫폼",
  description: DESCRIPTION,
  openGraph: {
    title: "FPT 소설 플랫폼",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "FPT 소설 플랫폼",
    type: "website",
    images: [
      {
        url: "/header.png",
        width: 1200,
        height: 630,
        alt: "FPT 소설 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FPT 소설 플랫폼",
    description: DESCRIPTION,
    images: ["/header.png"],
  },
};

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen flex flex-col bg-canvas text-foreground antialiased`}>
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="bg-ink text-canvas/90 py-8 text-center text-sm">
          <p>© 2026 FPT 소설 플랫폼</p>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
