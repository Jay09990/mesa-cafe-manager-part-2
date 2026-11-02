// Routes the platform root to Mesa's product landing page.
import type { Metadata } from "next";
import { MarketingLandingPage } from "@/features/marketing/components/MarketingLandingPage";

export const metadata: Metadata = {
  title: "Mesa for Cafés | Website, Bookings, and Daily Sales",
  description: "Give guests one simple café page and manage bookings, menu updates, customers, and daily sales in Mesa.",
};

export default function HomePage() {
  return <MarketingLandingPage />;
}
