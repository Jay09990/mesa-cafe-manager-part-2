// Configures Better Auth with PostgreSQL-backed sessions and tenant organizations.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // The live Neon `User` table contains legacy Clerk identities and tenant data.
  // Keep it intact and store Better Auth identities in the additive AuthUser table.
  user: { modelName: "AuthUser" },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: { enabled: true },
  plugins: [organization()],
});
