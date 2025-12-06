import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SafeGram",
  description: "A safe social media platform powered by AI",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`} suppressHydrationWarning>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
