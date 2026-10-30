// Shows the four Today KPIs and the three trial dashboard charts.
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { readApiResponse } from "@/lib/read-api-response";

type DashboardData = { date: string; sales: { value: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; orders: { value: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; avgOrderValue: { value: number | null; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; bookings: { count: number; covers: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; salesLogged: boolean };
type TrendsData = { paymentMix: Record<string, number>; daily: Array<Record<string, string | number>>; bookingsByHour: Array<{ hour: string; count: number }> };

export function TodayDashboard({ tenant, currency }: { tenant: string; currency: string }) {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const today = useQuery({ queryKey: ["dashboard-today", tenant], queryFn: async () => { const r = await fetch(`/api/admin/dashboard/today?tenant=${encodeURIComponent(tenant)}`); const j = await readApiResponse<DashboardData>(r); if (!j.success) throw new Error(j.errormsg); return j.data; } });
  const trends = useQuery({ queryKey: ["dashboard-trends", tenant, range], queryFn: async () => { const r = await fetch(`/api/admin/dashboard/trends?tenant=${encodeURIComponent(tenant)}&range=${range}`); const j = await readApiResponse<TrendsData>(r); if (!j.success) throw new Error(j.errormsg); return j.data; } });
  if (today.isLoading) return <p>Loading today’s numbers…</p>;
  if (today.isError) return <p role="alert">Could not load today’s dashboard. Refresh the page to try again.</p>;
  const data = today.data!;
  const money = new Intl.NumberFormat("en", { style: "currency", currency });
  const change = (yesterday: number | null, week: number | null) => `Yesterday ${yesterday === null ? "—" : `${yesterday}%`} · Last week ${week === null ? "—" : `${week}%`}`;
  const cards = [["Sales", money.format(data.sales.value), change(data.sales.vsYesterdayPct, data.sales.vsLastWeekPct)], ["Orders", data.orders.value, change(data.orders.vsYesterdayPct, data.orders.vsLastWeekPct)], ["Average order value", data.avgOrderValue.value === null ? "—" : money.format(Number(data.avgOrderValue.value)), change(data.avgOrderValue.vsYesterdayPct, data.avgOrderValue.vsLastWeekPct)], ["Bookings today", `${data.bookings.count} · ${data.bookings.covers} seats`, change(data.bookings.vsYesterdayPct, data.bookings.vsLastWeekPct)]];
  const mix = trends.data?.paymentMix ? Object.entries(trends.data.paymentMix).map(([name, value]) => ({ name, value })) : [];
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">Today</h1><p className="mt-1 text-sm text-neutral-600">{data.date}</p></header>
    {!data.salesLogged && <a href={`/admin/${tenant}/sales`} className="block rounded-lg border border-neutral-300 bg-white p-4 font-medium underline">Log today’s sales</a>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, comparison]) => <article key={String(label)} className="rounded-lg border border-neutral-200 bg-white p-4"><p className="text-sm text-neutral-600">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-neutral-600">{comparison}</p></article>)}</section>
    <div className="flex items-center gap-2"><label htmlFor="trend-range" className="text-sm font-medium">Sales range</label><select id="trend-range" value={range} onChange={(e) => setRange(e.target.value as "7d" | "30d")} className="h-11 rounded border border-neutral-300 bg-white px-3"><option value="7d">7 days</option><option value="30d">30 days</option></select></div>
    {trends.isFetching && <p role="status" aria-live="polite" className="text-sm text-neutral-600">Loading {range === "7d" ? "7-day" : "30-day"} charts…</p>}
    {trends.isError && <p role="alert">Could not load trend charts. Refresh the page to try again.</p>}
    {trends.data && <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-lg border border-neutral-200 bg-white p-4"><h2 className="font-semibold">Sales and orders</h2><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends.data.daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="totalSales" stroke="#171717" /><Line dataKey="ordersCount" stroke="#737373" /></LineChart></ResponsiveContainer></div></article>
      <article className="rounded-lg border border-neutral-200 bg-white p-4"><h2 className="font-semibold">Payment mode</h2><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" label /><Tooltip /></PieChart></ResponsiveContainer></div></article>
      <article className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-2"><h2 className="font-semibold">Bookings by hour</h2><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={trends.data.bookingsByHour}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#525252" /></BarChart></ResponsiveContainer></div></article></section>}
  </div>;
}
