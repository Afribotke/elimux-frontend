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
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
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
    default: "ElimuX — AI-Powered Education & Career Discovery",
    template: "%s | ElimuX",
  },
  description: "Discover universities, colleges, TVET institutes, scholarships, internships, industrial attachments, and bursaries worldwide. AI-powered matching for every student.",
  keywords: ["education", "university", "college", "TVET", "scholarship", "internship", "attachment", "bursary", "Kenya", "Africa", "study abroad"],
  authors: [{ name: "ElimuX" }],
  creator: "ElimuX",
  metadataBase: new URL("https://www.elimux.ke"),
  alternates: {
    canonical: "https://www.elimux.ke",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.elimux.ke",
    siteName: "ElimuX",
    title: "ElimuX — AI-Powered Education & Career Discovery",
    description: "Find your perfect education path with AI. Universities, TVET, scholarships, internships & more.",
    images: [{
      url: "https://www.elimux.ke/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "ElimuX - AI-Powered Education & Career Discovery",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElimuX — AI-Powered Education & Career Discovery",
    description: "Find your perfect education path with AI.",
    images: ["https://www.elimux.ke/og-image.jpg"],
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

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ElimuX",
  url: "https://www.elimux.ke",
  logo: "https://www.elimux.ke/icon-512x512.png",
  description: "AI-powered global education and career discovery platform",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@elimux.ke",
    availableLanguage: ["English", "Swahili"],
  },
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ElimuX",
  url: "https://www.elimux.ke",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.elimux.ke/programs?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
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
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
        <Suspense fallback={null}>
          <BreadcrumbJsonLd />
        </Suspense>
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


