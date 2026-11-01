// Lets owners and managers maintain menu details and toggle sold-out items.
"use client";

import { useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { BoneyardSkeleton, ListSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const { useUploadThing } = generateReactHelpers<UploadRouter>();
type MenuItem = { id: string; name: string; description: string | null; price: string | number; category: string; dietaryType: string | null; imageUrl: string | null; available: boolean; sortOrder: number; isFeatured: boolean };

export function MenuEditor({ tenant }: { tenant: string }) {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const menuQuery = useQuery({
    queryKey: ["menu-admin", tenant],
    queryFn: async () => {
      const response = await fetch(`/api/admin/menu?tenant=${encodeURIComponent(tenant)}`);
      const result = await readApiResponse<MenuItem[]>(response);
      if (!result.success) throw new Error(result.errormsg);
      return result.data as MenuItem[];
    },
  });
  const itemMutation = useMutation({
    mutationFn: async (values: Record<string, string | number | boolean>) => {
      const response = await fetch("/api/admin/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, tenant, imageUrl }) });
      const result = await readApiResponse<MenuItem>(response);
      if (!result.success) throw new Error(result.errormsg);
      return result.data;
    },
    onSuccess: () => { setImageUrl(""); toast.success("Menu item added."); void queryClient.invalidateQueries({ queryKey: ["menu-admin", tenant] }); },
  });
  const toggleMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const response = await fetch(`/api/admin/menu/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tenant, available }) });
      const result = await readApiResponse<null>(response);
      if (!result.success) throw new Error(result.errormsg);
    },
    onSuccess: () => { toast.success("Availability updated."); void queryClient.invalidateQueries({ queryKey: ["menu-admin", tenant] }); },
    onError: (error) => toast.error(error.message || "Could not update availability. Please try again."),
  });
  const { startUpload, isUploading } = useUploadThing("menuImage", { onClientUploadComplete: (files) => { setImageUrl(files[0]?.url ?? ""); toast.success("Photo uploaded."); } });

  async function submit(formData: FormData, form: HTMLFormElement) {
    try {
      await itemMutation.mutateAsync({
        name: String(formData.get("name")), description: String(formData.get("description") || ""), price: Number(formData.get("price")),
        category: String(formData.get("category")), dietaryType: String(formData.get("dietaryType")),
        available: true, sortOrder: Number(formData.get("sortOrder") || 0), isFeatured: formData.get("isFeatured") === "on",
      });
      (document.getElementById("menu-item-form") as HTMLFormElement | null)?.reset();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "We could not save this menu item."; toast.error(message); focusFormField(form, message); }
  }

  return <div className="w-full space-y-6">
    <Card><CardHeader><CardTitle>Add menu item</CardTitle></CardHeader><CardContent>
      <form id="menu-item-form" onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="menu-name">Name</Label><Input id="menu-name" name="name" required maxLength={100} /></div>
        <div className="space-y-1.5"><Label htmlFor="menu-category">Category</Label><Input id="menu-category" name="category" required maxLength={80} /></div>
        <div className="space-y-1.5"><Label htmlFor="menu-price">Price</Label><Input id="menu-price" name="price" type="number" min="0" step="0.01" inputMode="decimal" required /></div>
        <div className="space-y-1.5"><Label htmlFor="menu-dietary">Dietary type</Label><Select name="dietaryType" defaultValue="veg" required><SelectTrigger id="menu-dietary"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="veg">Vegetarian</SelectItem><SelectItem value="non_veg">Non-vegetarian</SelectItem><SelectItem value="egg">Contains egg</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="menu-description">Description (optional)</Label><textarea id="menu-description" name="description" maxLength={1000} rows={2} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm" /></div>
        <div className="space-y-1.5"><Label htmlFor="menu-sort-order">Sort order</Label><Input id="menu-sort-order" name="sortOrder" type="number" min="0" defaultValue="0" inputMode="numeric" /></div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input name="isFeatured" type="checkbox" />Feature on the home page</label>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="menu-photo">Photo (optional, up to 4 MB)</Label><Input id="menu-photo" type="file" accept="image/*" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) { void startUpload([file], { tenant }).then((uploaded) => { if (!uploaded) toast.error("Photo upload failed. Please try again."); }).catch(() => toast.error("Photo upload failed. Please try again.")); } }} />{isUploading && <p role="status" className="text-sm text-muted-foreground"><LoadingSpinner label="Uploading photo…" /></p>}</div>
        <CardFooter className="justify-end p-0 sm:col-span-2"><Button type="submit" disabled={itemMutation.isPending || isUploading}>{itemMutation.isPending ? <LoadingSpinner label="Saving…" /> : "Add item"}</Button></CardFooter>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Menu items</CardTitle></CardHeader><CardContent>{menuQuery.isError && <p role="alert">We could not load the menu. Refresh the page to try again.</p>}
      <BoneyardSkeleton name="menu-items" loading={menuQuery.isLoading} fallback={<ListSkeleton label="Loading menu items" />} fixture={<ListSkeleton label="Loading menu items" />}>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow>{["Item", "Category", "Price", "Dietary type", "Availability", "Action"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{menuQuery.data?.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{Number(item.price).toFixed(2)}</TableCell><TableCell>{item.dietaryType ?? "Set type"}</TableCell><TableCell>{item.available ? "Available" : "Sold out"}</TableCell><TableCell><Button type="button" variant="outline" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate({ id: item.id, available: !item.available })}>{toggleMutation.isPending ? <LoadingSpinner label="Updating…" /> : item.available ? "Mark sold out" : "Mark available"}</Button></TableCell></TableRow>)}
        {menuQuery.data?.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No menu items yet — add your first item above.</TableCell></TableRow>}
      </TableBody></Table></div>
      </BoneyardSkeleton>
    </CardContent></Card>
  </div>;
}
