"use client";

import { ReactNode } from "react";
import { RoleGuard as BaseRoleGuard } from "@/lib/auth/guards";
import { UserRole } from "@/lib/auth/rbac";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  return (
    <BaseRoleGuard allowedRoles={allowedRoles}>
      {children}
    </BaseRoleGuard>
  );
}
