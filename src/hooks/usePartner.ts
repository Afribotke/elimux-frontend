"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Referral {
  id: string;
  student_name: string;
  status: string;
  created_at: string;
  commission_amount: number | null;
}

interface Commission {
  id: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  created_at: string;
  description: string;
}

export function usePartner() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartnerData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [referralsRes, commissionsRes] = await Promise.all([
        fetch(`/api/referrals?partner_user_id=${user.id}`),
        fetch(`/api/commissions?partner_user_id=${user.id}`),
      ]);

      if (referralsRes.ok) {
        const refs = await referralsRes.json();
        setReferrals(refs);
      }
      if (commissionsRes.ok) {
        const comms = await commissionsRes.json();
        setCommissions(comms);
      }
    } catch (error) {
      console.error("Failed to fetch partner data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  return {
    referrals,
    commissions,
    isLoading,
    refresh: fetchPartnerData,
  };
}
