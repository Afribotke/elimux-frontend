"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface AwardResult {
  success: boolean;
  points_awarded?: number;
  error?: string;
}

export function useGamification() {
  const supabase = createClient();
  const [lastAward, setLastAward] = useState<{ points: number; reason: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const awardPoints = useCallback(
    async (actionKey: string, referenceType?: string, referenceId?: string): Promise<AwardResult> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const { data: profile } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) return { success: false, error: "Profile not found" };

        const { data, error } = await supabase.rpc("award_points", {
          p_student_id: profile.id,
          p_action_key: actionKey,
          p_reference_type: referenceType || null,
          p_reference_id: referenceId || null,
        });

        if (error) throw error;

        const result = data as AwardResult;
        if (result.success && result.points_awarded) {
          setLastAward({
            points: result.points_awarded,
            reason: actionKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          });
          setShowToast(true);
        }
        return result;
      } catch (err) {
        console.error("Gamification error:", err);
        return { success: false, error: "Failed to award points" };
      }
    },
    [supabase]
  );

  const dismissToast = useCallback(() => setShowToast(false), []);
  return { awardPoints, lastAward, showToast, dismissToast };
}
