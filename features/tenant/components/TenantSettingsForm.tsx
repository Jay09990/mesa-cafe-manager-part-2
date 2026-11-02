// Updates owner-only café details, booking capacity, and opening hours.
"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Settings = { timezone: string; currency: string; autoConfirmBookings: boolean; slotIntervalMinutes: number; seatCapacity: number; maxPartySize: number; businessInfo: Record<string, string | null>; openingHours: Record<string, unknown>; businessCategory: string | null; gstin: string | null; fssaiLicense: string | null };
type TimeWindow = { startTime: string; endTime: string };
type DayOverride = { isClosed?: boolean; slots?: TimeWindow[] };
type DateOverride = DayOverride & { date: string; reason?: string };
type OpeningHours = { routine: TimeWindow[]; weeklyOverrides: Record<string, DayOverride>; dateOverrides: DateOverride[] };
const weekdays = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
const timezoneOptions = [
  { group: "India", value: "Asia/Kolkata", label: "India Standard Time — Kolkata" },
  { group: "Asia and Middle East", value: "Asia/Dubai", label: "Gulf Standard Time — Dubai" },
  { group: "Asia and Middle East", value: "Asia/Kathmandu", label: "Nepal Time — Kathmandu" },
  { group: "Asia and Middle East", value: "Asia/Singapore", label: "Singapore Time" },
  { group: "Asia and Middle East", value: "Asia/Tokyo", label: "Japan Standard Time — Tokyo" },
  { group: "Australia and Pacific", value: "Australia/Sydney", label: "Australian Eastern Time — Sydney" },
  { group: "Europe and Africa", value: "Europe/London", label: "UK Time — London" },
  { group: "Europe and Africa", value: "Europe/Paris", label: "Central European Time — Paris" },
  { group: "Americas", value: "America/New_York", label: "Eastern Time — New York" },
  { group: "Americas", value: "America/Chicago", label: "Central Time — Chicago" },
  { group: "Americas", value: "America/Denver", label: "Mountain Time — Denver" },
  { group: "Americas", value: "America/Los_Angeles", label: "Pacific Time — Los Angeles" },
  { group: "Global", value: "UTC", label: "Coordinated Universal Time" },
] as const;
const currencyOptions = [
  { group: "South Asia", value: "INR", label: "INR — Indian Rupee (₹)" },
  { group: "South Asia", value: "NPR", label: "NPR — Nepalese Rupee (रु)" },
  { group: "Asia and Middle East", value: "AED", label: "AED — UAE Dirham (د.إ)" },
  { group: "Asia and Middle East", value: "SGD", label: "SGD — Singapore Dollar (S$)" },
  { group: "Asia and Middle East", value: "JPY", label: "JPY — Japanese Yen (¥)" },
  { group: "Europe", value: "EUR", label: "EUR — Euro (€)" },
  { group: "Europe", value: "GBP", label: "GBP — British Pound (£)" },
  { group: "Americas", value: "USD", label: "USD — US Dollar ($)" },
  { group: "Americas", value: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { group: "Australia and Pacific", value: "AUD", label: "AUD — Australian Dollar (A$)" },
] as const;
function readHours(value: Record<string, unknown>): OpeningHours {
  const raw = value as Partial<OpeningHours>;
  const oldDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const oldNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  const legacySlots = oldNames.map((name) => {
    const entry = value[name] as { open?: unknown; close?: unknown } | undefined;
    return entry && typeof entry.open === "string" && typeof entry.close === "string" ? [{ startTime: entry.open, endTime: entry.close }] : null;
  });
  if (!Array.isArray(raw.routine) && legacySlots.some(Boolean)) {
    return {
      routine: legacySlots[0] ?? [],
      weeklyOverrides: Object.fromEntries(oldDays.slice(1).flatMap((day, index) => legacySlots[index + 1] ? [[day, { slots: legacySlots[index + 1] ?? [] }]] : [])),
      dateOverrides: [],
    };
  }
  return {
    routine: Array.isArray(raw.routine) ? raw.routine : [],
    weeklyOverrides: raw.weeklyOverrides && typeof raw.weeklyOverrides === "object" ? raw.weeklyOverrides : {},
    dateOverrides: Array.isArray(raw.dateOverrides) ? raw.dateOverrides : [],
  };
}

export function TenantSettingsForm({ tenant, initial }: { tenant: string; initial: Settings }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "hours" | "preferences" | "tax">("profile");
  const [saving, setSaving] = useState<"settings" | "capacity" | "hours" | null>(null);
  const [hours, setHours] = useState<OpeningHours>(() => readHours(initial.openingHours));
  async function saveSettings(form: FormData, element: HTMLFormElement) {
    setSaving("settings");
    try { const response = await fetch("/api/admin/tenant/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, timezone: String(form.get("timezone")), currency: String(form.get("currency")).toUpperCase(), autoConfirmBookings: form.get("autoConfirmBookings") === "on", slotIntervalMinutes: Number(form.get("slotIntervalMinutes")), businessCategory: String(form.get("businessCategory") || "") === "choose-later" ? null : String(form.get("businessCategory") || "") || null, gstin: String(form.get("gstin") || "") || null, fssaiLicense: String(form.get("fssaiLicense") || "") || null, businessInfo: { phone: String(form.get("phone") || ""), address: String(form.get("address") || ""), city: String(form.get("city") || ""), mapUrl: String(form.get("mapUrl") || "") || null, instagramUrl: String(form.get("instagramUrl") || "") || null } }) });
      const result = await readApiResponse<unknown>(response); if (result.success) {
        toast.success("Settings saved.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["dashboard-today", tenant] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-trends", tenant] }),
        ]);
      } else { toast.error(result.errormsg); focusFormField(element, result.errormsg); }
    } catch { const error = "Could not save settings. Please try again."; toast.error(error); focusFormField(element, error); } finally { setSaving(null); }
  }
  async function saveCapacity(form: FormData, element: HTMLFormElement) {
    setSaving("capacity");
    try { const response = await fetch("/api/admin/tenant/capacity", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, seatCapacity: Number(form.get("seatCapacity")), maxPartySize: Number(form.get("maxPartySize")) }) });
      const result = await readApiResponse<unknown>(response); if (result.success) toast.success("Capacity saved."); else { toast.error(result.errormsg); focusFormField(element, result.errormsg); }
    } catch { const error = "Could not save capacity. Please try again."; toast.error(error); focusFormField(element, error); } finally { setSaving(null); }
  }
  async function saveHours() {
    setSaving("hours");
    try {
      const response = await fetch("/api/admin/tenant/hours", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, openingHours: hours }) });
      const result = await readApiResponse<unknown>(response); if (result.success) {
        toast.success("Opening hours saved.");
        await queryClient.invalidateQueries({ queryKey: ["availability", tenant] });
      } else toast.error(result.errormsg);
      if (!result.success) {
        const emptyDate = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]')).find((input) => !input.value);
        (emptyDate ?? document.querySelector<HTMLInputElement>('input[type="time"]'))?.focus();
      }
    } catch { toast.error("Could not save opening hours. Please try again."); document.querySelector<HTMLInputElement>('input[type="time"]')?.focus(); } finally { setSaving(null); }
  }
  function updateWindow(list: TimeWindow[], index: number, field: keyof TimeWindow, value: string) {
    return list.map((window, i) => i === index ? { ...window, [field]: value } : window);
  }
  function renderWindows(list: TimeWindow[], onChange: (next: TimeWindow[]) => void) {
    return <div className="space-y-2">{list.map((window, index) => <div key={index} className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-muted-foreground">Opens<input aria-label={`Opening time ${index + 1}`} type="time" value={window.startTime} onChange={(event) => onChange(updateWindow(list, index, "startTime", event.target.value))} className="mt-1 block h-10 rounded border border-border px-2 text-sm" /></label>
      <span className="pb-2 text-muted-foreground">to</span>
      <label className="text-xs text-muted-foreground">Closes<input aria-label={`Closing time ${index + 1}`} type="time" value={window.endTime} onChange={(event) => onChange(updateWindow(list, index, "endTime", event.target.value))} className="mt-1 block h-10 rounded border border-border px-2 text-sm" /></label>
      <Button type="button" onClick={() => onChange(list.filter((_, i) => i !== index))} className="min-h-10 rounded border border-border px-3 text-sm">Remove</Button>
    </div>)}
      <Button type="button" onClick={() => onChange([...list, { startTime: "09:00", endTime: "17:00" }])} className="min-h-10 rounded border border-border px-3 text-sm font-medium">+ Add hours</Button>
    </div>;
  }
  function setDay(day: string, update: (current: DayOverride) => DayOverride) {
    setHours((current) => ({ ...current, weeklyOverrides: { ...current.weeklyOverrides, [day]: update(current.weeklyOverrides[day] ?? {}) } }));
  }
  const field = "mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const label = "grid gap-1.5 text-sm font-medium text-foreground";
  const card = "rounded-xl border border-border bg-card p-4";
  const sectionTitle = "text-base font-semibold text-foreground";
  return <div className="w-full space-y-2">
    <div><p className="text-xs font-medium text-muted-foreground">Café profile</p><h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1><p className="text-sm text-muted-foreground">Keep your public details and booking preferences up to date.</p></div>
    <div role="tablist" aria-label="Settings sections" onKeyDown={(event) => { const values = ["profile", "hours", "preferences", "tax"] as const; const index = values.indexOf(activeTab); const nextIndex = event.key === "ArrowRight" ? (index + 1) % values.length : event.key === "ArrowLeft" ? (index + values.length - 1) % values.length : event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : -1; if (nextIndex >= 0) { event.preventDefault(); const next = values[nextIndex]; setActiveTab(next); document.getElementById(`settings-tab-${next}`)?.focus(); } }} className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:w-fit">
      {([["profile", "Profile"], ["hours", "Hours & capacity"], ["preferences", "Preferences"], ["tax", "Tax details"]] as const).map(([value, title]) => <Button key={value} id={`settings-tab-${value}`} type="button" role="tab" aria-controls={`settings-panel-${value}`} aria-selected={activeTab === value} tabIndex={activeTab === value ? 0 : -1} variant={activeTab === value ? "secondary" : "ghost"} onClick={() => setActiveTab(value)} className="shrink-0">{title}</Button>)}
    </div>
    <form id="tenant-settings-form" onSubmit={(event) => { event.preventDefault(); void saveSettings(new FormData(event.currentTarget), event.currentTarget); }} className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      <Card id="settings-panel-profile" role="tabpanel" aria-labelledby="settings-tab-profile" hidden={activeTab !== "profile"} className={`${card} md:col-span-2 xl:col-span-3`}>
        <div className="mb-5"><h2 id="business-profile-heading" className={sectionTitle}>Business profile</h2><p className="mt-1 text-sm text-muted-foreground">These details appear on your public café page.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <label className={label}>Phone<Input name="phone" type="tel" autoComplete="tel" defaultValue={initial.businessInfo.phone ?? ""} className={field} /></label>
          <label className={label}>Business category<Select name="businessCategory" defaultValue={initial.businessCategory ?? "choose-later"}><SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Choose later" /></SelectTrigger><SelectContent><SelectItem value="choose-later">Choose later</SelectItem><SelectItem value="cafe">Café</SelectItem><SelectItem value="qsr">Quick service restaurant</SelectItem><SelectItem value="casual_dining">Casual dining</SelectItem><SelectItem value="cloud_kitchen">Cloud kitchen</SelectItem></SelectContent></Select></label>
          <label className={`${label} sm:col-span-2`}>Street address<Input name="address" autoComplete="street-address" defaultValue={initial.businessInfo.address ?? ""} className={field} /></label>
          <label className={label}>City<Input name="city" autoComplete="address-level2" defaultValue={initial.businessInfo.city ?? ""} className={field} /></label>
          <label className={label}>Map link<Input name="mapUrl" type="url" inputMode="url" autoComplete="url" defaultValue={initial.businessInfo.mapUrl ?? ""} className={field} /></label>
          <label className="block text-sm font-medium text-foreground sm:col-span-2">Instagram link<Input name="instagramUrl" type="url" inputMode="url" defaultValue={initial.businessInfo.instagramUrl ?? ""} className={field} /></label>
        </div>
      </Card>

      <Card id="settings-panel-tax" role="tabpanel" aria-labelledby="settings-tab-tax" hidden={activeTab !== "tax"} className={`${card} xl:col-span-3`}>
        <div className="mb-5"><h2 id="tax-details-heading" className={sectionTitle}>Tax details <span className="ml-1 text-xs font-normal text-muted-foreground">Optional</span></h2><p className="mt-1 text-sm text-muted-foreground">Save these for future invoicing. You can leave them blank.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2"><label className={label}>GSTIN<Input name="gstin" autoComplete="off" defaultValue={initial.gstin ?? ""} className={field} /></label><label className={label}>FSSAI license<Input name="fssaiLicense" autoComplete="off" defaultValue={initial.fssaiLicense ?? ""} className={field} /></label></div>
      </Card>

      <Card id="settings-panel-preferences" role="tabpanel" aria-labelledby="settings-tab-preferences" hidden={activeTab !== "preferences"} className={`${card} xl:col-span-3`}>
        <div className="mb-5"><h2 id="booking-preferences-heading" className={sectionTitle}>Regional and booking preferences</h2><p className="mt-1 text-sm text-muted-foreground">Times and dates use your café’s local timezone.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <label className={label}>Timezone<Select name="timezone" required defaultValue={initial.timezone}><SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{!timezoneOptions.some((option) => option.value === initial.timezone) && <SelectItem value={initial.timezone}>Current setting — {initial.timezone}</SelectItem>}{[...new Set(timezoneOptions.map((option) => option.group))].map((group) => <SelectGroup key={group}><SelectLabel>{group}</SelectLabel>{timezoneOptions.filter((option) => option.group === group).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup>)}</SelectContent></Select></label>
          <label className={label}>Currency<Select name="currency" required defaultValue={initial.currency.toUpperCase()}><SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{!currencyOptions.some((option) => option.value === initial.currency.toUpperCase()) && <SelectItem value={initial.currency.toUpperCase()}>Current setting — {initial.currency.toUpperCase()}</SelectItem>}{[...new Set(currencyOptions.map((option) => option.group))].map((group) => <SelectGroup key={group}><SelectLabel>{group}</SelectLabel>{currencyOptions.filter((option) => option.group === group).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup>)}</SelectContent></Select></label>
          <label className={label}>Booking slot interval<Select name="slotIntervalMinutes" defaultValue={String(initial.slotIntervalMinutes)}><SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 45, 60].map((n) => <SelectItem key={n} value={String(n)}>{n} minutes</SelectItem>)}</SelectContent></Select></label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground"><input className="size-4 accent-neutral-900" type="checkbox" name="autoConfirmBookings" defaultChecked={initial.autoConfirmBookings} />Automatically confirm online bookings</label>
        </div>
      </Card>
    </form>
    <div className="flex flex-wrap items-center gap-3" hidden={activeTab === "hours"}><Button type="submit" form="tenant-settings-form" disabled={saving !== null}>{saving === "settings" ? <LoadingSpinner label="Saving…" /> : "Save settings"}</Button>{saving === "settings" && <span className="text-sm text-muted-foreground" role="status">Saving your changes</span>}</div>

    <div id="settings-panel-hours" role="tabpanel" aria-labelledby="settings-tab-hours" hidden={activeTab !== "hours"} className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      <form onSubmit={(event) => { event.preventDefault(); void saveCapacity(new FormData(event.currentTarget), event.currentTarget); }} className={`${card} md:col-span-2 xl:col-span-1`}>
        <div className="mb-5"><h2 className={sectionTitle}>Booking capacity</h2><p className="mt-1 text-sm text-muted-foreground">Set how many guests you can accommodate at one time.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-1"><label className={label}>Total seats<Input name="seatCapacity" type="number" inputMode="numeric" min="1" max="1000" required defaultValue={initial.seatCapacity} className={field} /></label><label className={label}>Maximum party size<Input name="maxPartySize" type="number" inputMode="numeric" min="1" max={initial.seatCapacity} required defaultValue={initial.maxPartySize} className={field} /></label></div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4"><Button disabled={saving !== null}>{saving === "capacity" ? <LoadingSpinner label="Saving…" /> : "Save capacity"}</Button>{saving === "capacity" && <span className="text-sm text-muted-foreground" role="status">Saving capacity</span>}</div>
      </form>

    <Card className={`${card} md:col-span-2 xl:col-span-2`} aria-labelledby="opening-hours-heading"><div className="mb-6"><h2 id="opening-hours-heading" className={sectionTitle}>Opening hours</h2><p className="mt-1 text-sm text-muted-foreground">Set your usual hours, then add weekly or date-specific exceptions.</p></div>
      <div className="rounded-lg border border-border bg-background p-4"><div className="mb-4"><h3 className="text-sm font-semibold text-foreground">Routine hours</h3><p className="mt-1 text-sm text-muted-foreground">These apply on days without a weekly or date override.</p></div>{renderWindows(hours.routine, (routine) => setHours((current) => ({ ...current, routine })))}</div>
      <div className="mt-6"><div className="mb-3"><h3 className="text-sm font-semibold text-foreground">Weekly schedule</h3><p className="mt-1 text-sm text-muted-foreground">Change a day to set custom hours or mark it closed.</p></div>
        <div className="grid gap-3 md:grid-cols-2">{weekdays.map(([day, name]) => { const override = hours.weeklyOverrides[day]; const mode = !override ? "routine" : override.isClosed ? "closed" : "custom"; return <div key={day} className="rounded-lg border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-medium text-foreground">{name}</span><select aria-label={`${name} hours`} value={mode} onChange={(event) => { const value = event.target.value; setHours((current) => { const weeklyOverrides = { ...current.weeklyOverrides }; if (value === "routine") delete weeklyOverrides[day]; else weeklyOverrides[day] = value === "closed" ? { isClosed: true } : { slots: override?.slots ?? current.routine.map((slot) => ({ ...slot })) }; return { ...current, weeklyOverrides }; }); }} className="min-h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="routine">Use routine hours</option><option value="custom">Set custom hours</option><option value="closed">Closed</option></select></div>{mode === "custom" && <div className="mt-3">{renderWindows(override.slots ?? [], (slots) => setDay(day, (current) => ({ ...current, isClosed: false, slots })))}</div>}</div>; })}</div>
      </div>
      <div className="mt-6 border-t border-border pt-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Date overrides</h3><p className="mt-1 text-sm text-muted-foreground">Add special hours or close for a specific date.</p></div><Button type="button" onClick={() => setHours((current) => ({ ...current, dateOverrides: [...current.dateOverrides, { date: "", slots: current.routine.map((slot) => ({ ...slot })) }] }))} variant="outline">+ Add date</Button></div>
        {hours.dateOverrides.length === 0 && <p className="rounded-md bg-background px-3 py-4 text-sm text-muted-foreground">No date overrides. Your routine and weekly hours will apply.</p>}
        <div className="space-y-3">{hours.dateOverrides.map((entry, index) => <div key={index} className="rounded-lg border border-border bg-background p-3"><div className="flex flex-wrap items-end gap-3"><label className="text-sm font-medium text-foreground">Date<input aria-label="Override date" type="date" value={entry.date} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, date: event.target.value } : item) }))} className="mt-1.5 block min-h-10 rounded-md border border-border bg-card px-2 text-base" /></label><label className="flex min-h-10 items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 accent-neutral-900" checked={Boolean(entry.isClosed)} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, isClosed: event.target.checked } : item) }))} />Closed</label><label className="min-w-48 flex-1 text-sm font-medium text-foreground">Reason (optional)<Input value={entry.reason ?? ""} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, reason: event.target.value } : item) }))} maxLength={200} className="mt-1.5 block h-10 w-full rounded-md border border-border bg-card px-2 text-base" /></label><Button type="button" onClick={() => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.filter((_, i) => i !== index) }))} variant="outline">Remove date</Button></div>{!entry.isClosed && <div className="mt-3">{renderWindows(entry.slots ?? [], (slots) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, slots } : item)})))}</div>}</div>)}</div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4"><Button type="button" disabled={saving !== null} onClick={saveHours}>{saving === "hours" ? <LoadingSpinner label="Saving…" /> : "Save opening hours"}</Button>{saving === "hours" && <span className="text-sm text-muted-foreground" role="status">Saving opening hours</span>}</div>
    </Card>
    </div>
  </div>;
}




