import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElimuX — Discover Global Education",
  description: "Find universities, programs, internships, and career opportunities worldwide.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <DesktopNav />
          <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
          <MobileNav />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
