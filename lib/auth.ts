// Configures Better Auth with PostgreSQL-backed sessions and tenant organizations.
import { betterAuth } from "better-auth";
import { after } from "next/server";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { dash, sentinel } from "@better-auth/infra";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // The live Neon `User` table contains legacy Clerk identities and tenant data.
  // Keep it intact and store Better Auth identities in the additive AuthUser table.
  user: { modelName: "AuthUser" },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(async () => {
        try {
          await sendPasswordResetEmail({ to: user.email, url });
        } catch (error) {
          console.error("Failed to send password reset email", error);
        }
      });
    },
  },
  plugins: [
    organization(),
    dash({ apiKey: process.env.BETTER_AUTH_API_KEY }),
    sentinel({ apiKey: process.env.BETTER_AUTH_API_KEY }),
  ],
});
