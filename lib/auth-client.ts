// Provides Better Auth's browser client with organization actions enabled.
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { dashClient, sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  plugins: [organizationClient(), dashClient(), sentinelClient({ autoSolveChallenge: true })],
});
