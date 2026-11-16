import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/shared/PwaRegister";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VR Street Karama | Sales Tracking & Management",
  description:
    "Real-time sales tracking, opening/closing management, and push notification system for VR Street Karama.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VR Karama",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5850EC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F4F5F9] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}>
        <ToastProvider>
          {children}
          <PwaRegister />
        </ToastProvider>
      </body>
    </html>
  );
}

