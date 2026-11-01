// Shares one TanStack Query cache across client-side feature screens.
"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AdminThemeProvider, useAdminTheme } from "@/features/admin-panel/components/AdminThemeProvider";
import "@/bones/registry.js";

function MesaToaster() {
  const { theme } = useAdminTheme();
  return <Toaster position="bottom-right" theme={theme} richColors closeButton visibleToasts={4} toastOptions={{ duration: 4000, classNames: { toast: "!rounded-xl !shadow-lg", title: "!text-sm !font-semibold", description: "!text-sm", success: "!border-emerald-200 !bg-emerald-50 !text-emerald-950", warning: "!border-amber-200 !bg-amber-50 !text-amber-950", error: "!border-red-200 !bg-red-50 !text-red-950" } }} />;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: (failureCount, error) => failureCount < 1 && error instanceof TypeError } } }));
  return <QueryClientProvider client={queryClient}><AdminThemeProvider>{children}<MesaToaster /></AdminThemeProvider></QueryClientProvider>;
}
