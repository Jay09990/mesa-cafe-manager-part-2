// Explains Mesa's café tools, trial, and product workflow on the platform home page.
import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarCheck2, ChartNoAxesCombined, Check, CircleHelp, Clock3, Globe2, UsersRound, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedSection } from "@/features/marketing/components/AnimatedSection";
import { ProductPreview } from "@/features/marketing/components/ProductPreview";

const productFeatures: Array<{ title: string; description: string; details: string[]; Icon: LucideIcon }> = [
  {
    title: "A clear home for your café online",
    description: "Give guests one simple place to see your café, menu, opening hours, location, and booking link.",
    details: ["Share one café page", "Show your contact details and hours", "Link guests straight to bookings"],
    Icon: Globe2,
  },
  {
    title: "Bookings your team can manage",
    description: "Online requests and phone or walk-in bookings stay together in the same list.",
    details: ["Choose pending requests or auto-confirm", "Set opening hours and seat capacity", "See customer details from booking history"],
    Icon: CalendarCheck2,
  },
  {
    title: "Menu updates without the back and forth",
    description: "Keep dish names, prices, photos, and dietary types current on your public menu.",
    details: ["Mark an item sold out in one tap", "Keep sold-out items visible to guests", "Feature items on your café page"],
    Icon: UtensilsCrossed,
  },
  {
    title: "A simple record of the day's sales",
    description: "Enter totals by payment type and review the day in a straightforward dashboard.",
    details: ["Record cash, UPI, card, and other", "Review sales, orders, and bookings", "See daily and weekly trends"],
    Icon: ChartNoAxesCombined,
  },
  {
    title: "Customer history from bookings",
    description: "Mesa builds a read-only customer list from the bookings your café already receives.",
    details: ["Find a guest by name or phone", "See booking and no-show counts", "Keep customer information in one place"],
    Icon: UsersRound,
  },
];

const workflow = [
  { number: "01", title: "Set up your café", description: "Add your café name, hours, menu, and booking capacity." },
  { number: "02", title: "Share your page", description: "Send guests one link to your café details, menu, and booking form." },
  { number: "03", title: "Run the day", description: "Manage bookings, update sold-out items, and log daily sales." },
];

const questions = [
  { question: "How long is the trial?", answer: "The trial lasts 30 days. You can explore bookings, menu management, and the sales dashboard during the trial." },
  { question: "Do I need to connect a POS system?", answer: "No. Mesa does not replace a POS. Sales are entered manually by payment type, so your café can keep its current counter workflow." },
  { question: "Can my team add phone and walk-in bookings?", answer: "Yes. Owners, managers, and booking staff can add a booking to the same calendar used for online requests." },
  { question: "Do guests need an account to book?", answer: "No. Guests choose a date and time and provide their name and phone number. Email is optional." },
  { question: "What happens after the trial?", answer: "Trial pricing and paid plans are still being shaped from pilot feedback. Mesa does not ask you to check out during the trial." },
];

function MarketingLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const style = variant === "primary"
    ? "bg-[var(--public-accent)] text-[var(--public-accent-foreground)] hover:bg-[var(--public-accent-hover)]"
    : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100";
  return <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${style}`}>{children}</Link>;
}

function SectionHeading({ eyebrow, title, description, align = "center" }: { eyebrow: string; title: string; description: string; align?: "center" | "left" }) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return <div className={`max-w-2xl ${alignment}`}><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl">{title}</h2><p className="mt-4 text-base leading-7 text-neutral-600 sm:text-lg">{description}</p></div>;
}

function FeatureCard({ title, description, details, Icon }: (typeof productFeatures)[number]) {
  return <article className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow duration-150 hover:shadow-md sm:p-7"><div className="grid size-11 place-items-center rounded-xl bg-[var(--public-accent-tint)] text-[var(--public-accent-tint-foreground)]"><Icon aria-hidden="true" className="size-5" /></div><h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 min-h-14 text-sm leading-6 text-neutral-600">{description}</p><ul className="mt-5 space-y-3">{details.map((detail) => <li key={detail} className="flex gap-2.5 text-sm leading-5 text-neutral-700"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-neutral-500" />{detail}</li>)}</ul></article>;
}

function TrialPlanCard() {
  return <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow duration-150 hover:shadow-md sm:p-9"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--public-accent)]">Pilot café trial</p><h3 className="mt-3 text-2xl font-semibold tracking-tight">Try Mesa for 30 days</h3></div><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium">No checkout during trial</span></div><p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">Use the core café tools and tell us what helps your team. The trial is designed to learn from real café routines before paid plans are set.</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{["Café website and menu", "Online and staff-added bookings", "Customer list from bookings", "Sales log and daily dashboard"].map((item) => <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-neutral-800"><Check aria-hidden="true" className="size-4 text-neutral-500" />{item}</li>)}</ul><div className="mt-8 flex flex-wrap gap-3"><MarketingLink href="/sign-up">Start your trial <ArrowRight aria-hidden="true" className="size-4" /></MarketingLink><p className="self-center text-sm text-neutral-500">Create an account, then add your café.</p></div></div>;
}

function QuestionItem({ question, answer }: { question: string; answer: string }) {
  return <details className="group -mx-4 rounded-xl border-b border-neutral-200 px-4 py-5 transition-shadow duration-150 hover:shadow-md"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">{question}<span className="grid size-8 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-600 transition-transform duration-150 group-open:rotate-45"><span aria-hidden="true" className="text-xl font-normal leading-none">+</span></span></summary><p className="max-w-3xl pr-10 pt-3 text-sm leading-6 text-neutral-600">{answer}</p></details>;
}

export function MarketingLandingPage() {
  return (
    <main id="top" className="overflow-hidden bg-[var(--public-background)] text-neutral-950">
      <header className="border-b border-neutral-200/80 bg-[var(--public-background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Mesa home" className="flex min-h-11 items-center gap-2.5 text-xl font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-lg bg-neutral-900 text-sm font-bold text-white">M</span>Mesa</Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex"><Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">What Mesa does</Link><Link href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">How it works</Link><Link href="#trial" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">Free trial</Link><Link href="#faq" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">FAQs</Link></nav>
          <div className="flex items-center gap-1 sm:gap-2"><Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-neutral-700 transition-colors duration-150 hover:bg-neutral-100">Sign in</Link><Link href="/sign-up" className="inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-neutral-800">Get started</Link></div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-neutral-200/70">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-0 h-[500px] w-[500px] rounded-full bg-[var(--public-accent-tint)] opacity-60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-28">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-neutral-700"><span className="size-2 rounded-full bg-neutral-800" />A clear workspace for independent cafés</div><h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">Your café online, your bookings in order, <span className="text-[var(--public-accent)]">your day in view.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">Mesa brings your café page, menu, table bookings, and daily sales summary into one straightforward place.</p><div className="mt-8 flex flex-wrap gap-3"><MarketingLink href="/sign-up">Start your 30-day trial <ArrowRight aria-hidden="true" className="size-4" /></MarketingLink><MarketingLink href="#features" variant="secondary">Explore Mesa</MarketingLink></div><p className="mt-4 text-sm text-neutral-500">No checkout during the trial. Set up your café after creating an account.</p><div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-200 pt-5 text-sm text-neutral-600"><span className="inline-flex items-center gap-2"><Check aria-hidden="true" className="size-4" />Built for café routines</span><span className="inline-flex items-center gap-2"><Check aria-hidden="true" className="size-4" />One simple public link</span></div></div>
          <ProductPreview />
        </div>
      </section>

      <AnimatedSection aria-label="Mesa at a glance" className="border-b border-neutral-200 bg-white"><div className="mx-auto grid max-w-7xl gap-0 px-5 py-4 sm:grid-cols-3 sm:px-8">{[{ number: "01", title: "Show your café", text: "Website, hours, and menu" }, { number: "02", title: "Keep bookings together", text: "Online, phone, and walk-in" }, { number: "03", title: "Review the day", text: "Sales log and dashboard" }].map((item) => <div key={item.number} className="flex items-center gap-4 border-b border-neutral-100 py-4 last:border-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"><span className="text-xs font-semibold tracking-widest text-neutral-400">{item.number}</span><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-neutral-500">{item.text}</p></div></div>)}</div></AnimatedSection>

      <AnimatedSection id="features" className="scroll-mt-8 bg-[var(--public-accent-tint)]/40 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="One place for the essentials" title="The everyday café tools, working together." description="Keep the information guests need and the tasks your team handles connected, without changing how the counter runs." /><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{productFeatures.map((feature) => <FeatureCard key={feature.title} {...feature} />)}<article className="flex flex-col justify-between rounded-2xl bg-neutral-900 p-6 text-white sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Made for the trial</p><h3 className="mt-4 text-2xl font-semibold tracking-tight">Start simple. Learn what works.</h3><p className="mt-3 text-sm leading-6 text-neutral-300">Use the core tools with your team, then share what would make Mesa more useful for your café.</p></div><Link href="#trial" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline underline-offset-4">See the trial details <ArrowRight aria-hidden="true" className="size-4" /></Link></article></div></div></AnimatedSection>

      <AnimatedSection id="how-it-works" className="scroll-mt-8 border-y border-neutral-200 bg-white px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]"><SectionHeading eyebrow="A simple start" title="From setup to your first booking." description="Get the basics in place, share your café link, and manage the work from one admin page." align="left" /><div className="grid gap-0 sm:grid-cols-3">{workflow.map((step, index) => <article key={step.number} className={`relative border-t border-neutral-200 py-5 sm:border-l sm:border-t-0 sm:px-5 sm:py-0 ${index === 0 ? "sm:pl-0 sm:border-l-0" : ""}`}><span className="text-xs font-semibold tracking-widest text-neutral-400">{step.number}</span><h3 className="mt-3 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-600">{step.description}</p>{index < workflow.length - 1 && <ArrowDown aria-hidden="true" className="absolute -bottom-2 left-5 size-4 text-neutral-400 sm:-right-2 sm:left-auto sm:top-1 sm:rotate-[-90deg]" />}</article>)}</div></div></AnimatedSection>

      <AnimatedSection className="bg-[var(--public-accent-tint)]/40 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2"><div><SectionHeading eyebrow="Bookings that fit your day" title="Guests can request a time. Your team stays in control." description="Set the hours and seat capacity that work for your café. Guests see available times, and your staff can add phone or walk-in bookings from the same place." align="left" /><ul className="mt-7 space-y-4">{["Choose whether online requests need confirmation", "Keep pending and confirmed bookings on one list", "See party size, contact details, and customer history"].map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-700"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-neutral-500" />{item}</li>)}</ul><Link href="/sign-up" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">See how it works in your trial <ArrowRight aria-hidden="true" className="size-4" /></Link></div><div className="rounded-3xl border border-neutral-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md sm:p-7"><div className="flex items-center justify-between border-b border-neutral-200 pb-4"><div><p className="text-sm font-semibold">Today’s bookings</p><p className="mt-1 text-xs text-neutral-500">A sample of the staff view</p></div><CalendarCheck2 aria-hidden="true" className="size-5 text-neutral-500" /></div><div className="mt-2 divide-y divide-neutral-100">{[{ name: "M. Patel", party: "2 seats", time: "12:30 PM", status: "Confirmed" }, { name: "S. Rao", party: "4 seats", time: "1:00 PM", status: "Request" }, { name: "Walk-in", party: "3 seats", time: "1:15 PM", status: "Confirmed" }].map((booking) => <div key={`${booking.name}-${booking.time}`} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-sm font-semibold">{booking.name}</p><p className="mt-1 text-xs text-neutral-500">{booking.party} · {booking.time}</p></div><span className={booking.status === "Confirmed" ? "rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700" : "rounded-full bg-[var(--public-accent-tint)] px-3 py-1.5 text-xs font-medium text-[var(--public-accent-tint-foreground)]"}>{booking.status}</span></div>)}</div><div className="mt-2 rounded-xl bg-neutral-50 p-4"><p className="text-xs leading-5 text-neutral-600">Example only. Mesa shows the status of each booking clearly so staff know what needs attention.</p></div></div></div></AnimatedSection>

      <AnimatedSection id="trial" className="scroll-mt-8 border-y border-neutral-200 bg-white px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center"><div><SectionHeading eyebrow="Pilot release" title="Thirty days to see if Mesa fits your café." description="The trial is for learning from real use. Try the booking, menu, and daily sales tools without committing to a paid plan." align="left" /><div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-700"><Clock3 aria-hidden="true" className="size-4" />30-day trial</div></div><TrialPlanCard /></div></div></AnimatedSection>

      <AnimatedSection id="faq" className="scroll-mt-8 bg-[var(--public-accent-tint)]/40 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]"><div><div className="grid size-11 place-items-center rounded-xl border border-neutral-200 bg-white"><CircleHelp aria-hidden="true" className="size-5 text-neutral-600" /></div><h2 className="mt-5 text-3xl font-semibold tracking-tight">A few useful details.</h2><p className="mt-3 max-w-sm text-base leading-7 text-neutral-600">Straight answers about the trial and what Mesa does today.</p></div><div>{questions.map((item) => <QuestionItem key={item.question} {...item} />)}</div></div></AnimatedSection>

      <AnimatedSection className="px-5 pb-20 sm:px-8 sm:pb-28"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-[#171717] via-[#171717] to-[#3a2515] px-6 py-9 text-white sm:flex-row sm:items-center sm:px-10 sm:py-11"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Ready when you are</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Give your café one clear place to start.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300">Create your account, add your café, and try Mesa with your team for 30 days.</p></div><Link href="/sign-up" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--public-accent)] px-5 text-sm font-semibold text-[var(--public-accent-foreground)] transition-colors duration-150 hover:bg-[var(--public-accent-hover)]">Start your trial <ArrowRight aria-hidden="true" className="size-4" /></Link></div></AnimatedSection>

      <footer className="border-t border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8"><Link href="#top" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><span className="grid size-7 place-items-center rounded-md bg-neutral-900 text-[11px] font-bold text-white">M</span>Mesa</Link><p className="text-sm text-neutral-500">Café website, bookings, and daily sales tools in one place.</p><div className="flex items-center gap-4 text-sm"><Link href="/sign-in" className="min-h-11 py-3 font-medium text-neutral-600 hover:text-neutral-950">Sign in</Link><Link href="/sign-up" className="min-h-11 py-3 font-medium text-neutral-600 hover:text-neutral-950">Get started</Link></div></div></footer>
    </main>
  );
}
