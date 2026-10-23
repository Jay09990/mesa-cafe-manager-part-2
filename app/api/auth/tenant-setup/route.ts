// Creates an authenticated owner's tenant and starts its 30-day trial.
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { TRIAL_DAYS } from "@/features/billing/tier-config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  tenantName: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(50),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ success: false, data: null, statusCode: 401, errormsg: "Please sign in before setting up your café." }, { status: 401 });

  const parsed = setupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, data: null, statusCode: 400, errormsg: "Enter a café name and a web address using letters, numbers, and hyphens." }, { status: 400 });

  const existing = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) return NextResponse.json({ success: false, data: null, statusCode: 409, errormsg: "That web address is already in use. Choose another." }, { status: 409 });

  try {
    const organization = await auth.api.createOrganization({
      body: { name: parsed.data.tenantName, slug: parsed.data.slug },
      headers: await headers(),
    });
    if (!organization) throw new Error("organization-create-failed");

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          name: parsed.data.tenantName,
          slug: parsed.data.slug,
          authOrganizationId: organization.id,
          trialEndsAt,
          theme: { themeId: "mesa-monochrome", colors: { primary: "#171717", secondary: "#525252", background: "#F7F7F5", surface: "#FFFFFF", text: "#171717", textMuted: "#666666", border: "#E5E5E5" }, fonts: {} },
          businessInfo: {},
          openingHours: {},
        },
      });
      await tx.staffMember.create({ data: { tenantId: created.id, userId: session.user.id, role: "owner" } });
      return created;
    });
    return NextResponse.json({ success: true, data: { id: tenant.id, slug: tenant.slug, trialEndsAt }, statusCode: 201, errormsg: null }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, data: null, statusCode: 500, errormsg: "We could not set up your café. Please try again." }, { status: 500 });
  }
}
