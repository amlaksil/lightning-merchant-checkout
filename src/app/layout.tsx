import type { Metadata } from "next";
import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

import { AppSidebar } from "./components/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lightning Merchant Checkout",
  description:
    "Merchant checkout demo for Bitcoin Core regtest and Lightning Network payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
  className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 text-slate-900`}
>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1">{children}</main>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
