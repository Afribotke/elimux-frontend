"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserRole, Permission, hasPermission, getRolePermissions } from "./rbac";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  full_name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch user role from database
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, full_name")
        .eq("user_id", authUser.id)
        .single();

      const role = (roleData?.role as UserRole) || "student";
      const permissions = getRolePermissions(role);

      setUser({
        id: authUser.id,
        email: authUser.email!,
        role,
        permissions,
        full_name: roleData?.full_name,
      });
    } catch (error) {
      console.error("Auth error:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, isLoading, signOut, refresh: fetchUser };
}

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role || null,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isPartner: user?.role === "partner" || user?.role === "admin" || user?.role === "super_admin",
    isAdvertiser: user?.role === "advertiser" || user?.role === "admin" || user?.role === "super_admin",
    isInstitution: user?.role === "institution" || user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
  };
}

export function usePermission(permission: Permission) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(hasPermission(user.role, permission));
    }
  }, [user, permission]);

  return hasAccess;
}
