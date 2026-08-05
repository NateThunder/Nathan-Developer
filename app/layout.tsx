import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const brandSans = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const accentMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nathansomevi.dev"),
  title: "Somevi Labs | Professional Websites for UK Businesses",
  description:
    "Professional websites for UK service businesses, with optional booking, ecommerce, dashboards, and ongoing support.",
  openGraph: {
    title: "Somevi Labs | Professional Websites for UK Businesses",
    description:
      "Professional websites for UK service businesses, with optional booking, ecommerce, dashboards, and ongoing support.",
    url: "https://nathansomevi.dev",
    siteName: "Somevi Labs",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Somevi Labs marketing landing page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Somevi Labs | Professional Websites for UK Businesses",
    description:
      "Professional websites for UK service businesses, with optional booking, ecommerce, dashboards, and ongoing support.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${brandSans.variable} ${accentMono.variable} antialiased`}>
        <div className="relative min-h-screen bg-[var(--color-bg)]">
          <GoogleAnalytics />
          <div className="relative">{children}</div>
        </div>
      </body>
    </html>
  );
}
