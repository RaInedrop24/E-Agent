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
  title: "The Property Gateway",
  description: "The Property Gateway - Multilingual property transaction tracking platform",
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
        <AuthProvider>
          <BrandingProvider>
            <LanguageProvider>
              <ConditionalHeader />
              {children}
            </LanguageProvider>
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
