// Sends customer email only when email delivery is configured and an address exists.
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendBookingEmail(input: { to: string; cafeName: string; date: string; time: string; status: "pending" | "confirmed" | "cancelled" | "no_show" }) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) return false;
  const message = input.status === "pending" ? "Request received — the café will confirm shortly"
    : input.status === "confirmed" ? "Booking confirmed"
    : input.status === "cancelled" ? "Booking cancelled"
    : "Booking marked as no-show";
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: `${input.cafeName}: ${message}`,
    text: `${message}\n${input.date} at ${input.time}`,
  });
  return true;
}

export async function sendDayEndEmail(input: { to: string; cafeName: string; date: string; currency: string; sales: number; orders: number; averageOrderValue: number | null; bookings: number; vsYesterdayPct: number | null; salesLogged: boolean }) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) return false;
  const money = new Intl.NumberFormat("en", { style: "currency", currency: input.currency });
  const text = input.salesLogged
    ? `${input.cafeName} — ${input.date}\nSales: ${money.format(input.sales)}\nOrders: ${input.orders}\nAverage order value: ${input.averageOrderValue === null ? "—" : money.format(input.averageOrderValue)}\nBookings: ${input.bookings}\nChange vs yesterday: ${input.vsYesterdayPct === null ? "—" : `${input.vsYesterdayPct}%`}`
    : `${input.cafeName} — ${input.date}\nToday's sales have not been logged yet. Open Mesa to add them.`;
  await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: input.to, subject: `${input.cafeName}: ${input.salesLogged ? "Daily summary" : "Log today's sales"}`, text });
  return true;
}
