"use client";
import { SettingsProvider } from "@/context/SettingsContext";
import { SessionProvider } from "next-auth/react";

export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </SessionProvider>
  );
} 