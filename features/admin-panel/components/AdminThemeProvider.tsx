"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: "light", toggleTheme: () => {} });

function getThemeSnapshot(): Theme {
  return window.localStorage.getItem("mesa-admin-theme") === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("mesa-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("mesa-theme-change", onChange);
  };
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    window.localStorage.setItem("mesa-admin-theme", next);
    window.dispatchEvent(new Event("mesa-theme-change"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function AdminThemeRoot({ children }: { children: ReactNode }) {
  const { theme } = useAdminTheme();
  return <div id="admin-theme-root" data-theme={theme} className="min-h-screen bg-background text-foreground">{children}</div>;
}

export function useAdminTheme() {
  return useContext(ThemeContext);
}
