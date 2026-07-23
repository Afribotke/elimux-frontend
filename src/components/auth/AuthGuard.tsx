"use client";

import { ReactNode } from "react";
import { AuthGuard as BaseAuthGuard } from "@/lib/auth/guards";

export function AuthGuard({ children }: { children: ReactNode }) {
  return (
    <BaseAuthGuard>
      {children}
    </BaseAuthGuard>
  );
}
