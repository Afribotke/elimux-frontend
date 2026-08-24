import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import { UnifiedNavBar } from "@/components/layout/UnifiedNavBar";
import { CookieConsent } from "@/components/legal/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BackgroundSyncManager from "@/components/BackgroundSyncManager";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

import InstallPrompt from '@/components/InstallPrompt';
import SiteVisitTracker from '@/components/SiteVisitTracker';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ElimuX',
  },
  title: {
    default: "ElimuX â€” Discover Global Education & Career Opportunities",
    template: "%s | ElimuX",
  },
  description: "ElimuX is an AI-powered platform matching students with universities, colleges, TVET institutes, scholarships, internships, attachments, and bursaries.",
  keywords: ["education", "courses", "internships", "attachments", "Kenya", "Africa", "university", "college", "TVET"],
  authors: [{ name: "ElimuX" }],
  creator: "ElimuX",
  metadataBase: new URL("https://www.elimux.ke"),
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.elimux.ke",
    siteName: "ElimuX",
    title: "ElimuX â€” Discover Global Education & Career Opportunities",
    description: "AI-powered matching for universities, colleges, TVET, scholarships, internships, attachments, and bursaries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElimuX â€” Discover Global Education & Career Opportunities",
    description: "AI-powered matching for universities, colleges, TVET, scholarships, internships, attachments, and bursaries.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: '#1e40af',
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
          defaultTheme="dark"
          enableSystem
          value={{ light: "light", dark: "dark" }}
          disableTransitionOnChange
        >
          <AuthProvider>
            <DesktopNav />
            <Suspense fallback={null}>
              <UnifiedNavBar />
            </Suspense>
            <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
            <MobileNav />
            <Toaster position="top-right" richColors />
            <CookieConsent />
            <ServiceWorkerRegister />
            <BackgroundSyncManager />
            <OfflineIndicator />
            <SiteVisitTracker />
          </AuthProvider>
        </ThemeProvider>
            <InstallPrompt />
      <Analytics />
    </body>
    </html>
  );
}


