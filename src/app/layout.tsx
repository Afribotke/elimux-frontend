import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import { CookieConsent } from "@/components/legal/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BackgroundSyncManager from "@/components/BackgroundSyncManager";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: {
    default: "ElimuX — Discover Global Education & Career Opportunities",
    template: "%s | ElimuX",
  },
  description: "ElimuX is the global education discovery platform. Find courses, internships, and attachments across Kenya, Africa, and worldwide institutions.",
  keywords: ["education", "courses", "internships", "attachments", "Kenya", "Africa", "university", "college", "TVET"],
  authors: [{ name: "ElimuX" }],
  creator: "ElimuX",
  metadataBase: new URL("https://www.elimux.ke"),
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.elimux.ke",
    siteName: "ElimuX",
    title: "ElimuX — Discover Global Education & Career Opportunities",
    description: "Find courses, internships, and attachments across Kenya, Africa, and worldwide institutions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElimuX — Discover Global Education & Career Opportunities",
    description: "Find courses, internships, and attachments across Kenya, Africa, and worldwide institutions.",
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
            <BackgroundSyncManager />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


