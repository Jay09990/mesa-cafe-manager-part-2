// Renders menu administration for owners and managers.
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { MenuEditor } from "@/features/menu/components/MenuEditor";

export default async function AdminMenuPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager"]);
  if (!access) redirect("/sign-in");
  return <><h1 className="mb-5 text-2xl font-semibold">Menu</h1><MenuEditor tenant={tenant} /></>;
}
