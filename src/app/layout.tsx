import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import Toaster from "@/components/ui/Toaster";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "FlatBytes — Digital Showroom for Flats & Apartments",
    template: "%s | FlatBytes",
  },
  description:
    "Explore apartments in 3D, browse floor plans, track construction progress, and make smarter investment decisions.",
  keywords: "apartments, flats, real estate, 3D tour, floor plans, new projects India",
  metadataBase: new URL("https://flatbytes.in"),
  openGraph: {
    title: "FlatBytes — Digital Showroom for Flats",
    description: "The smartest way to explore and buy residential flats in India.",
    type: "website",
    siteName: "FlatBytes",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlatBytes",
    description: "Explore flats in 3D. Compare. Book with confidence.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`min-h-screen antialiased ${dmSans.className}`}>
        {children}
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
