"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function PointsBadge() {
  const supabase = createClient();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;

      const { data: pointsData } = await supabase
        .from("gamification_points")
        .select("points")
        .eq("user_id", user.id);
      const total = (pointsData || []).reduce((sum: number, p: any) => sum + (p.points || 0), 0);
      setPoints(total);

      const { data: levelData } = await supabase
        .from("student_levels")
        .select("*")
        .lte("min_points", total)
        .order("min_points", { ascending: false })
        .limit(1)
        .single();
      setLevel(levelData);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  if (loading || points === 0) return null;

  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-200 transition-colors">
      <Zap className="w-3 h-3 mr-1 fill-current" />
      {points.toLocaleString()} pts
      {level && <span className="ml-1 opacity-75">&bull; L{level.level_number}</span>}
    </Badge>
  );
}
