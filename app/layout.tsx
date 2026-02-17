import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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
  metadataBase: new URL("https://example.com"),
  title: "<STUDIO_NAME> | Web Design Studio",
  description:
    "Modern web design studio crafting high-performance websites with vector clarity and subtle pixel accents.",
  openGraph: {
    title: "<STUDIO_NAME> | Web Design Studio",
    description:
      "Modern web design studio crafting high-performance websites with vector clarity and subtle pixel accents.",
    url: "https://example.com",
    siteName: "<STUDIO_NAME>",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "<STUDIO_NAME> marketing landing page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "<STUDIO_NAME> | Web Design Studio",
    description:
      "Modern web design studio crafting high-performance websites with vector clarity and subtle pixel accents.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
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
        {children}
      </body>
    </html>
  );
}
