import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BrandingProvider } from "@/contexts/BrandingContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "The Property Gateway | Property Transaction Tracking Software",
    template: "%s | The Property Gateway"
  },
  description: "Streamline property transactions with multilingual communication, automated progress tracking, and real-time notifications for estate agents and buyers across Europe.",
  keywords: ["property transaction management", "estate agent software", "multilingual property portal", "buyer communication platform", "property purchase tracking"],
  authors: [{ name: "The Property Gateway" }],
  creator: "The Property Gateway",
  publisher: "The Property Gateway",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://mail.thepropertygateway.com",
    title: "The Property Gateway | Property Transaction Tracking",
    description: "Streamline property transactions with multilingual communication and automated tracking",
    siteName: "The Property Gateway",
    images: [{
      url: "https://mail.thepropertygateway.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The Property Gateway - Property Transaction Tracking Platform",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Property Gateway | Property Transaction Tracking",
    description: "Streamline property transactions with multilingual communication",
    images: ["https://mail.thepropertygateway.com/twitter-image.png"],
  },
  alternates: {
    canonical: "https://mail.thepropertygateway.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <BrandingProvider>
            <LanguageProvider>
              <ConditionalHeader />
              <main id="main-content">
                {children}
              </main>
            </LanguageProvider>
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
