import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import { CookieConsent } from "@/components/legal/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: '/manifest.json',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          value={{ light: "light", dark: "dark" }}
          disableTransitionOnChange
        >
          <AuthProvider>
            <DesktopNav />
            <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
            <MobileNav />
            <Toaster position="top-right" richColors />
            <CookieConsent />
            <ServiceWorkerRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


