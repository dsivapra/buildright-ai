import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUILDRIGHT // AI BUILDER'S CO-PILOT",
  description:
    "Stop wasting context. Start every AI session with the perfect prompt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
