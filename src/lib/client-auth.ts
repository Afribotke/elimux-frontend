// Drop-in replacement for supabase.auth.getUser() with 8s client-side timeout
// Use this in EVERY 'use client' page that checks auth state

import { createClient, hasValidSessionMarkers } from "@/lib/supabase/client";

const AUTH_TIMEOUT_MS = 8000;

export async function getUserWithTimeout() {
  const supabase = createClient();

  try {
    const result = (await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("AUTH_TIMEOUT")),
          AUTH_TIMEOUT_MS
        )
      ),
    ])) as { data: { user: any }; error: any };

    if (result.data.user && !hasValidSessionMarkers()) {
      return {
        data: { user: null },
        error: { message: "Session expired. Please sign in again.", status: 401 },
      };
    }

    return result;
  } catch (err: any) {
    if (err?.message === "AUTH_TIMEOUT") {
      console.error("[Client Auth] Timeout after", AUTH_TIMEOUT_MS, "ms");
      return {
        data: { user: null },
        error: {
          message: "Authentication service temporarily unavailable. Please refresh.",
          status: 503,
        },
      };
    }
    throw err;
  }
}
