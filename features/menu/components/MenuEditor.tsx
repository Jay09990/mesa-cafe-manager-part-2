// Lets owners and managers maintain menu details and toggle sold-out items.
"use client";

import { useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const { useUploadThing } = generateReactHelpers<UploadRouter>();
type MenuItem = { id: string; name: string; description: string | null; price: string | number; category: string; dietaryType: string | null; imageUrl: string | null; available: boolean; sortOrder: number; isFeatured: boolean };

export function MenuEditor({ tenant }: { tenant: string }) {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const menuQuery = useQuery({
    queryKey: ["menu-admin", tenant],
    queryFn: async () => {
      const result = await fetch(`/api/admin/menu?tenant=${encodeURIComponent(tenant)}`).then((response) => response.json());
      if (!result.success) throw new Error(result.errormsg);
      return result.data as MenuItem[];
    },
  });
  const itemMutation = useMutation({
    mutationFn: async (values: Record<string, string | number | boolean>) => {
      const response = await fetch("/api/admin/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, tenant, imageUrl }) });
      const result = await response.json();
      if (!result.success) throw new Error(result.errormsg);
      return result.data;
    },
    onSuccess: async () => { setImageUrl(""); await queryClient.invalidateQueries({ queryKey: ["menu-admin", tenant] }); },
  });
  const toggleMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const response = await fetch(`/api/admin/menu/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, available }) });
      const result = await response.json();
      if (!result.success) throw new Error(result.errormsg);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-admin", tenant] }),
  });
  const { startUpload, isUploading } = useUploadThing("menuImage", { onClientUploadComplete: (files) => setImageUrl(files[0]?.url ?? "") });

  async function submit(formData: FormData) {
    setError("");
    try {
      await itemMutation.mutateAsync({
        name: String(formData.get("name")), description: String(formData.get("description") || ""), price: Number(formData.get("price")),
        category: String(formData.get("category")), dietaryType: String(formData.get("dietaryType")),
        available: true, sortOrder: Number(formData.get("sortOrder") || 0), isFeatured: formData.get("isFeatured") === "on",
      });
      (document.getElementById("menu-item-form") as HTMLFormElement | null)?.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save this menu item."); }
  }

  return <div className="space-y-7">
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Add menu item</h2>
      <form id="menu-item-form" action={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Name<input name="name" required maxLength={100} className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Category<input name="category" required maxLength={80} className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Price<input name="price" type="number" min="0" step="0.01" inputMode="decimal" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Dietary type<select name="dietaryType" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3"><option value="veg">Vegetarian</option><option value="non_veg">Non-vegetarian</option><option value="egg">Contains egg</option></select></label>
        <label className="text-sm font-medium sm:col-span-2">Description (optional)<textarea name="description" maxLength={1000} rows={2} className="mt-1 w-full rounded border border-neutral-300 p-3" /></label>
        <label className="text-sm font-medium">Sort order<input name="sortOrder" type="number" min="0" defaultValue="0" inputMode="numeric" className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input name="isFeatured" type="checkbox" />Feature on the home page</label>
        <div className="sm:col-span-2"><span className="block text-sm font-medium">Photo (optional, up to 4 MB)</span><input type="file" accept="image/*" disabled={isUploading} className="mt-2 block min-h-11" onChange={(event) => { const file = event.target.files?.[0]; if (file) void startUpload([file], { tenant }).then((uploaded) => { if (!uploaded) setError("Photo upload failed. Please try again."); }); }} />{imageUrl && <p className="mt-1 text-sm text-green-800">Photo uploaded.</p>}</div>
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <button disabled={itemMutation.isPending || isUploading} className="min-h-11 rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50 sm:col-span-2">{itemMutation.isPending ? "Saving…" : "Add item"}</button>
      </form>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Menu items</h2>{menuQuery.isLoading && <p>Loading menu…</p>}{menuQuery.isError && <p role="alert">We could not load the menu. Refresh the page to try again.</p>}
      <ul className="space-y-3">{menuQuery.data?.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-neutral-600">{item.category} · {Number(item.price).toFixed(2)} · {item.dietaryType ?? "Set type"}</p></div><button type="button" onClick={() => toggleMutation.mutate({ id: item.id, available: !item.available })} className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm font-medium">{item.available ? "Mark sold out" : "Mark available"}</button></li>)}</ul>
    </section>
  </div>;
}
