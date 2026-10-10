import type { Metadata, Viewport } from "next";
import { Karantina, Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

const karantina = Karantina({
  variable: "--font-karantina",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "LiveTime — המוזיקה החיה של העיר",
    template: "%s · LiveTime",
  },
  description: "הרשת שמחברת אמנים, מקומות וקהל — להופעות חיות קטנות וגדולות.",
  applicationName: "LiveTime",
  appleWebApp: { capable: true, title: "LiveTime", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#09080d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${karantina.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
