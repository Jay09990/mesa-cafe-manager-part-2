// Defines the menu image upload route and checks Mesa's own tenant staff role.
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const upload = createUploadthing();

export const uploadRouter = {
  menuImage: upload({ image: { maxFileSize: "4MB", maxFileCount: 1, minFileCount: 1 } })
    .input(z.object({ tenant: z.string().min(1) }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) throw new UploadThingError("Please sign in before uploading a menu photo.");
      const staff = await prisma.staffMember.findFirst({ where: { userId: session.user.id, tenant: { slug: input.tenant }, role: { in: ["owner", "manager"] } }, select: { tenantId: true } });
      if (!staff) throw new UploadThingError("You do not have permission to update this menu.");
      return { userId: session.user.id, tenantId: staff.tenantId };
    })
    .onUploadComplete(async ({ file, metadata }) => ({ url: file.ufsUrl, tenantId: metadata.tenantId })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
