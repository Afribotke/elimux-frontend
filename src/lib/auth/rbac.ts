// ============================================================
// Core RBAC Engine
// ============================================================

export type UserRole = "student" | "partner" | "advertiser" | "institution" | "admin" | "super_admin";

export type Permission =
  // Student permissions
  | "search:read"
  | "program:read"
  | "institution:read"
  | "review:create"
  | "review:read"
  | "application:create"
  | "profile:manage"
  // Partner permissions
  | "partner:dashboard"
  | "partner:referrals"
  | "partner:earnings"
  | "partner:analytics"
  // Advertiser permissions
  | "ads:create"
  | "ads:manage"
  | "ads:analytics"
  | "ads:billing"
  // Institution permissions
  | "institution:dashboard"
  | "institution:programs"
  | "institution:applications"
  | "institution:analytics"
  // Admin permissions
  | "admin:dashboard"
  | "admin:users"
  | "admin:partners"
  | "admin:advertisers"
  | "admin:institutions"
  | "admin:programs"
  | "admin:ads"
  | "admin:analytics"
  | "admin:settings"
  | "admin:payments"
  // Super admin
  | "super_admin:all";

interface RoleDefinition {
  name: UserRole;
  displayName: string;
  permissions: Permission[];
  inherits?: UserRole[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  student: {
    name: "student",
    displayName: "Student",
    permissions: [
      "search:read",
      "program:read",
      "institution:read",
      "review:create",
      "review:read",
      "application:create",
      "profile:manage",
    ],
  },
  partner: {
    name: "partner",
    displayName: "Partner",
    permissions: [
      "search:read",
      "program:read",
      "institution:read",
      "profile:manage",
      "partner:dashboard",
      "partner:referrals",
      "partner:earnings",
      "partner:analytics",
    ],
  },
  advertiser: {
    name: "advertiser",
    displayName: "Advertiser",
    permissions: [
      "search:read",
      "program:read",
      "institution:read",
      "profile:manage",
      "ads:create",
      "ads:manage",
      "ads:analytics",
      "ads:billing",
    ],
  },
  institution: {
    name: "institution",
    displayName: "Institution",
    permissions: [
      "search:read",
      "program:read",
      "institution:read",
      "profile:manage",
      "institution:dashboard",
      "institution:programs",
      "institution:applications",
      "institution:analytics",
    ],
  },
  admin: {
    name: "admin",
    displayName: "Admin",
    permissions: [
      "admin:dashboard",
      "admin:users",
      "admin:partners",
      "admin:advertisers",
      "admin:institutions",
      "admin:programs",
      "admin:ads",
      "admin:analytics",
      "admin:settings",
      "admin:payments",
    ],
    inherits: ["student"],
  },
  super_admin: {
    name: "super_admin",
    displayName: "Super Admin",
    permissions: ["super_admin:all"],
    inherits: ["admin", "student"],
  },
};

export function getRolePermissions(role: UserRole): Permission[] {
  const definition = ROLE_DEFINITIONS[role];
  if (!definition) return [];

  let permissions = new Set(definition.permissions);

  // Inherit from parent roles
  if (definition.inherits) {
    for (const parentRole of definition.inherits) {
      const parentPermissions = getRolePermissions(parentRole);
      parentPermissions.forEach((p) => permissions.add(p));
    }
  }

  return Array.from(permissions);
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission) || permissions.includes("super_admin:all");
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DEFINITIONS[role]?.displayName || role;
}

export function getAvailableRoles(): { value: UserRole; label: string }[] {
  return Object.values(ROLE_DEFINITIONS).map((r) => ({
    value: r.name,
    label: r.displayName,
  }));
}
