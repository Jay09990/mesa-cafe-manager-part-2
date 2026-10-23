import type { Metadata } from "next";
import { QueryProvider } from "@/features/admin-panel/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesa — Café bookings and management",
  description: "Manage café bookings, menu, and daily sales with Mesa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full"><QueryProvider>{children}</QueryProvider></body></html>;
}
