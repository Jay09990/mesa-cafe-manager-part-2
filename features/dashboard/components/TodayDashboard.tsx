// Shows the four Today KPIs and the three trial dashboard charts.
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { readApiResponse } from "@/lib/read-api-response";
import { BoneyardSkeleton, DashboardSkeleton, TableSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DashboardData = { date: string; sales: { value: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; orders: { value: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; avgOrderValue: { value: number | null; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; bookings: { count: number; covers: number; vsYesterdayPct: number | null; vsLastWeekPct: number | null }; salesLogged: boolean };
type TrendsData = { paymentMix: Record<string, number>; daily: Array<Record<string, string | number>>; bookingsByHour: Array<{ hour: string; count: number }> };
const paymentColors = ["#171717", "#52525b", "#a1a1aa", "#d4d4d8"];

export function TodayDashboard({ tenant, currency }: { tenant: string; currency: string }) {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const today = useQuery({ queryKey: ["dashboard-today", tenant], queryFn: async () => { const r = await fetch(`/api/admin/dashboard/today?tenant=${encodeURIComponent(tenant)}`); const j = await readApiResponse<DashboardData>(r); if (!j.success) throw new Error(j.errormsg); return j.data; } });
  const trends = useQuery({ queryKey: ["dashboard-trends", tenant, range], queryFn: async () => { const r = await fetch(`/api/admin/dashboard/trends?tenant=${encodeURIComponent(tenant)}&range=${range}`); const j = await readApiResponse<TrendsData>(r); if (!j.success) throw new Error(j.errormsg); return j.data; } });
  if (today.isLoading) return <BoneyardSkeleton name="today-dashboard" loading fallback={<DashboardSkeleton />} fixture={<DashboardSkeleton />}><DashboardSkeleton /></BoneyardSkeleton>;
  if (today.isError) return <p role="alert">Could not load today’s dashboard. Refresh the page to try again.</p>;
  const data = today.data!;
  const money = new Intl.NumberFormat("en", { style: "currency", currency });
  const change = (yesterday: number | null, week: number | null) => `Yesterday ${yesterday === null ? "—" : `${yesterday}%`} · Last week ${week === null ? "—" : `${week}%`}`;
  const cards = [["Sales", money.format(data.sales.value), change(data.sales.vsYesterdayPct, data.sales.vsLastWeekPct)], ["Orders", data.orders.value, change(data.orders.vsYesterdayPct, data.orders.vsLastWeekPct)], ["Average order value", data.avgOrderValue.value === null ? "—" : money.format(Number(data.avgOrderValue.value)), change(data.avgOrderValue.vsYesterdayPct, data.avgOrderValue.vsLastWeekPct)], ["Bookings today", `${data.bookings.count} · ${data.bookings.covers} seats`, change(data.bookings.vsYesterdayPct, data.bookings.vsLastWeekPct)]];
  const mix = trends.data?.paymentMix ? Object.entries(trends.data.paymentMix).map(([name, value]) => ({ name, value })) : [];
  return <div className="w-full space-y-6">
    <header><h1 className="text-2xl font-semibold">Today</h1><p className="mt-1 text-sm text-muted-foreground">{data.date}</p></header>
    {!data.salesLogged && <Button variant="outline" asChild><a href={`/admin/${tenant}/sales`}>Log today’s sales</a></Button>}
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, comparison]) => <Card key={String(label)}>
      <CardHeader className="pb-0"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{comparison}</p></CardContent>
    </Card>)}</section>
    <div className="flex items-center gap-2"><Label htmlFor="trend-range">Sales range</Label><Select value={range} onValueChange={(value) => setRange(value as "7d" | "30d")}><SelectTrigger id="trend-range" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">7 days</SelectItem><SelectItem value="30d">30 days</SelectItem></SelectContent></Select></div>
    {trends.isError && <p role="alert">Could not load trend charts. Refresh the page to try again.</p>}
    <BoneyardSkeleton name="dashboard-trends" loading={trends.isLoading} fallback={<div role="status" aria-label="Loading dashboard charts" className="grid gap-6 lg:grid-cols-2"><TableSkeleton columns={4} rows={4} label="Loading sales chart" /><TableSkeleton columns={4} rows={4} label="Loading payment chart" /><div className="lg:col-span-2"><TableSkeleton columns={6} rows={4} label="Loading bookings chart" /></div></div>} fixture={<div className="grid gap-6 lg:grid-cols-2"><TableSkeleton columns={4} rows={4} /><TableSkeleton columns={4} rows={4} /><div className="lg:col-span-2"><TableSkeleton columns={6} rows={4} /></div></div>}>
    {trends.data && <section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Sales and orders</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends.data.daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line dataKey="totalSales" name="Sales" stroke="#171717" strokeWidth={2} /><Line dataKey="ordersCount" name="Orders" stroke="#2563eb" strokeWidth={2} /></LineChart></ResponsiveContainer></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Payment mode</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" label>{mix.map((entry, index) => <Cell key={entry.name} fill={paymentColors[index % paymentColors.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Bookings by hour</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={trends.data.bookingsByHour}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#525252" /></BarChart></ResponsiveContainer></div></CardContent></Card>
    </section>}
    </BoneyardSkeleton>
  </div>;
}
