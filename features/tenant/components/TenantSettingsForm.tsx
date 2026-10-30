// Updates owner-only café details, booking capacity, and opening hours.
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";

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
  const [saving, setSaving] = useState<"settings" | "capacity" | "hours" | null>(null);
  const [hours, setHours] = useState<OpeningHours>(() => readHours(initial.openingHours));
  async function saveSettings(form: FormData, element: HTMLFormElement) {
    setSaving("settings");
    try { const response = await fetch("/api/admin/tenant/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, timezone: String(form.get("timezone")), currency: String(form.get("currency")).toUpperCase(), autoConfirmBookings: form.get("autoConfirmBookings") === "on", slotIntervalMinutes: Number(form.get("slotIntervalMinutes")), businessCategory: String(form.get("businessCategory") || "") || null, gstin: String(form.get("gstin") || "") || null, fssaiLicense: String(form.get("fssaiLicense") || "") || null, businessInfo: { phone: String(form.get("phone") || ""), address: String(form.get("address") || ""), city: String(form.get("city") || ""), mapUrl: String(form.get("mapUrl") || "") || null, instagramUrl: String(form.get("instagramUrl") || "") || null } }) });
      const result = await readApiResponse<unknown>(response); if (result.success) toast.success("Settings saved."); else { toast.error(result.errormsg); focusFormField(element, result.errormsg); }
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
      const result = await readApiResponse<unknown>(response); if (result.success) toast.success("Opening hours saved."); else toast.error(result.errormsg);
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
      <label className="text-xs text-neutral-600">Opens<input aria-label={`Opening time ${index + 1}`} type="time" value={window.startTime} onChange={(event) => onChange(updateWindow(list, index, "startTime", event.target.value))} className="mt-1 block h-10 rounded border border-neutral-300 px-2 text-sm" /></label>
      <span className="pb-2 text-neutral-500">to</span>
      <label className="text-xs text-neutral-600">Closes<input aria-label={`Closing time ${index + 1}`} type="time" value={window.endTime} onChange={(event) => onChange(updateWindow(list, index, "endTime", event.target.value))} className="mt-1 block h-10 rounded border border-neutral-300 px-2 text-sm" /></label>
      <button type="button" onClick={() => onChange(list.filter((_, i) => i !== index))} className="min-h-10 rounded border border-neutral-300 px-3 text-sm">Remove</button>
    </div>)}
      <button type="button" onClick={() => onChange([...list, { startTime: "09:00", endTime: "17:00" }])} className="min-h-10 rounded border border-neutral-300 px-3 text-sm font-medium">+ Add hours</button>
    </div>;
  }
  function setDay(day: string, update: (current: DayOverride) => DayOverride) {
    setHours((current) => ({ ...current, weeklyOverrides: { ...current.weeklyOverrides, [day]: update(current.weeklyOverrides[day] ?? {}) } }));
  }
  const field = "mt-1.5 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-base outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2";
  const label = "block text-sm font-medium text-neutral-800";
  const card = "rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6";
  const sectionTitle = "text-base font-semibold text-neutral-900";
  const primaryButton = "min-h-11 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";
  const secondaryButton = "min-h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2";
  return <div className="max-w-7xl space-y-5">
    <div className="mb-6"><p className="text-sm font-medium text-neutral-500">Café profile</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Settings</h1><p className="mt-1 text-sm text-neutral-600">Keep your public details and booking preferences up to date.</p></div>
    <form onSubmit={(event) => { event.preventDefault(); void saveSettings(new FormData(event.currentTarget), event.currentTarget); }} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <section className={`${card} md:col-span-2`} aria-labelledby="business-profile-heading">
        <div className="mb-5"><h2 id="business-profile-heading" className={sectionTitle}>Business profile</h2><p className="mt-1 text-sm text-neutral-600">These details appear on your public café page.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <label className={label}>Phone<input name="phone" type="tel" autoComplete="tel" defaultValue={initial.businessInfo.phone ?? ""} className={field} /></label>
          <label className={label}>Business category<select name="businessCategory" defaultValue={initial.businessCategory ?? ""} className={field}><option value="">Choose later</option><option value="cafe">Café</option><option value="qsr">Quick service restaurant</option><option value="casual_dining">Casual dining</option><option value="cloud_kitchen">Cloud kitchen</option></select></label>
          <label className={`${label} sm:col-span-2`}>Street address<input name="address" autoComplete="street-address" defaultValue={initial.businessInfo.address ?? ""} className={field} /></label>
          <label className={label}>City<input name="city" autoComplete="address-level2" defaultValue={initial.businessInfo.city ?? ""} className={field} /></label>
          <label className={label}>Map link<input name="mapUrl" type="url" inputMode="url" autoComplete="url" defaultValue={initial.businessInfo.mapUrl ?? ""} className={field} /></label>
          <label className="block text-sm font-medium text-neutral-800 sm:col-span-2">Instagram link<input name="instagramUrl" type="url" inputMode="url" defaultValue={initial.businessInfo.instagramUrl ?? ""} className={field} /></label>
        </div>
      </section>

      <section className={card} aria-labelledby="tax-details-heading">
        <div className="mb-5"><h2 id="tax-details-heading" className={sectionTitle}>Tax details <span className="ml-1 text-xs font-normal text-neutral-500">Optional</span></h2><p className="mt-1 text-sm text-neutral-600">Save these for future invoicing. You can leave them blank.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2"><label className={label}>GSTIN<input name="gstin" autoComplete="off" defaultValue={initial.gstin ?? ""} className={field} /></label><label className={label}>FSSAI license<input name="fssaiLicense" autoComplete="off" defaultValue={initial.fssaiLicense ?? ""} className={field} /></label></div>
      </section>

      <section className={`${card} xl:col-span-2`} aria-labelledby="booking-preferences-heading">
        <div className="mb-5"><h2 id="booking-preferences-heading" className={sectionTitle}>Regional and booking preferences</h2><p className="mt-1 text-sm text-neutral-600">Times and dates use your café’s local timezone.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <label className={label}>Timezone<select name="timezone" required defaultValue={initial.timezone} className={field}>
            {!timezoneOptions.some((option) => option.value === initial.timezone) && <option value={initial.timezone}>Current setting — {initial.timezone}</option>}
            {[...new Set(timezoneOptions.map((option) => option.group))].map((group) => <optgroup key={group} label={group}>{timezoneOptions.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>)}
          </select></label>
          <label className={label}>Currency<select name="currency" required defaultValue={initial.currency.toUpperCase()} className={field}>
            {!currencyOptions.some((option) => option.value === initial.currency.toUpperCase()) && <option value={initial.currency.toUpperCase()}>Current setting — {initial.currency.toUpperCase()}</option>}
            {[...new Set(currencyOptions.map((option) => option.group))].map((group) => <optgroup key={group} label={group}>{currencyOptions.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>)}
          </select></label>
          <label className={label}>Booking slot interval<select name="slotIntervalMinutes" defaultValue={initial.slotIntervalMinutes} className={field}>{[15, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select></label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-800"><input className="size-4 accent-neutral-900" type="checkbox" name="autoConfirmBookings" defaultChecked={initial.autoConfirmBookings} />Automatically confirm online bookings</label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4"><button disabled={saving !== null} className={primaryButton}>{saving === "settings" ? "Saving…" : "Save profile and preferences"}</button>{saving === "settings" && <span className="text-sm text-neutral-600" role="status">Saving your changes</span>}</div>
      </section>
    </form>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <form onSubmit={(event) => { event.preventDefault(); void saveCapacity(new FormData(event.currentTarget), event.currentTarget); }} className={`${card} md:col-span-2 xl:col-span-1`}>
        <div className="mb-5"><h2 className={sectionTitle}>Booking capacity</h2><p className="mt-1 text-sm text-neutral-600">Set how many guests you can accommodate at one time.</p></div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-1"><label className={label}>Total seats<input name="seatCapacity" type="number" inputMode="numeric" min="1" max="1000" required defaultValue={initial.seatCapacity} className={field} /></label><label className={label}>Maximum party size<input name="maxPartySize" type="number" inputMode="numeric" min="1" max={initial.seatCapacity} required defaultValue={initial.maxPartySize} className={field} /></label></div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4"><button disabled={saving !== null} className={primaryButton}>{saving === "capacity" ? "Saving…" : "Save capacity"}</button>{saving === "capacity" && <span className="text-sm text-neutral-600" role="status">Saving capacity</span>}</div>
      </form>

    <section className={`${card} md:col-span-2 xl:col-span-2`} aria-labelledby="opening-hours-heading"><div className="mb-6"><h2 id="opening-hours-heading" className={sectionTitle}>Opening hours</h2><p className="mt-1 text-sm text-neutral-600">Set your usual hours, then add weekly or date-specific exceptions.</p></div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"><div className="mb-4"><h3 className="text-sm font-semibold text-neutral-900">Routine hours</h3><p className="mt-1 text-sm text-neutral-600">These apply on days without a weekly or date override.</p></div>{renderWindows(hours.routine, (routine) => setHours((current) => ({ ...current, routine })))}</div>
      <div className="mt-6"><div className="mb-3"><h3 className="text-sm font-semibold text-neutral-900">Weekly schedule</h3><p className="mt-1 text-sm text-neutral-600">Change a day to set custom hours or mark it closed.</p></div>
        <div className="grid gap-3 md:grid-cols-2">{weekdays.map(([day, name]) => { const override = hours.weeklyOverrides[day]; const mode = !override ? "routine" : override.isClosed ? "closed" : "custom"; return <div key={day} className="rounded-lg border border-neutral-200 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-medium text-neutral-900">{name}</span><select aria-label={`${name} hours`} value={mode} onChange={(event) => { const value = event.target.value; setHours((current) => { const weeklyOverrides = { ...current.weeklyOverrides }; if (value === "routine") delete weeklyOverrides[day]; else weeklyOverrides[day] = value === "closed" ? { isClosed: true } : { slots: override?.slots ?? current.routine.map((slot) => ({ ...slot })) }; return { ...current, weeklyOverrides }; }); }} className="min-h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"><option value="routine">Use routine hours</option><option value="custom">Set custom hours</option><option value="closed">Closed</option></select></div>{mode === "custom" && <div className="mt-3">{renderWindows(override.slots ?? [], (slots) => setDay(day, (current) => ({ ...current, isClosed: false, slots })))}</div>}</div>; })}</div>
      </div>
      <div className="mt-6 border-t border-neutral-200 pt-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-neutral-900">Date overrides</h3><p className="mt-1 text-sm text-neutral-600">Add special hours or close for a specific date.</p></div><button type="button" onClick={() => setHours((current) => ({ ...current, dateOverrides: [...current.dateOverrides, { date: "", slots: current.routine.map((slot) => ({ ...slot })) }] }))} className={secondaryButton}>+ Add date</button></div>
        {hours.dateOverrides.length === 0 && <p className="rounded-md bg-neutral-50 px-3 py-4 text-sm text-neutral-600">No date overrides. Your routine and weekly hours will apply.</p>}
        <div className="space-y-3">{hours.dateOverrides.map((entry, index) => <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"><div className="flex flex-wrap items-end gap-3"><label className="text-sm font-medium text-neutral-800">Date<input aria-label="Override date" type="date" value={entry.date} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, date: event.target.value } : item) }))} className="mt-1.5 block min-h-10 rounded-md border border-neutral-300 bg-white px-2 text-base" /></label><label className="flex min-h-10 items-center gap-2 text-sm font-medium text-neutral-800"><input type="checkbox" className="size-4 accent-neutral-900" checked={Boolean(entry.isClosed)} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, isClosed: event.target.checked } : item) }))} />Closed</label><label className="min-w-48 flex-1 text-sm font-medium text-neutral-800">Reason (optional)<input value={entry.reason ?? ""} onChange={(event) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, reason: event.target.value } : item) }))} maxLength={200} className="mt-1.5 block h-10 w-full rounded-md border border-neutral-300 bg-white px-2 text-base" /></label><button type="button" onClick={() => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.filter((_, i) => i !== index) }))} className={secondaryButton}>Remove date</button></div>{!entry.isClosed && <div className="mt-3">{renderWindows(entry.slots ?? [], (slots) => setHours((current) => ({ ...current, dateOverrides: current.dateOverrides.map((item, i) => i === index ? { ...item, slots } : item)})))}</div>}</div>)}</div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4"><button type="button" disabled={saving !== null} onClick={saveHours} className={primaryButton}>{saving === "hours" ? "Saving…" : "Save opening hours"}</button>{saving === "hours" && <span className="text-sm text-neutral-600" role="status">Saving opening hours</span>}</div>
    </section>
    </div>
  </div>;
}
