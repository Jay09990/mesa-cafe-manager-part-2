// Sends customer email only when email delivery is configured and an address exists.
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendBookingEmail(input: { to: string; cafeName: string; date: string; time: string; status: "pending" | "confirmed" }) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) return false;
  const message = input.status === "pending" ? "Request received — the café will confirm shortly" : "Booking confirmed";
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: `${input.cafeName}: ${message}`,
    text: `${message}\n${input.date} at ${input.time}`,
  });
  return true;
}
