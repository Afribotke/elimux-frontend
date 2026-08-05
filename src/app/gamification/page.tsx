"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, Star, TrendingUp } from "lucide-react";

export default function GamificationPage() {
  const supabase = createClient();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await getUserWithTimeout();
      if (user) {
        const { data: pts } = await supabase.from("gamification_points").select("points").eq("user_id", user.id);
        const total = (pts || []).reduce((sum: number, p: any) => sum + (p.points || 0), 0);
        setPoints(total);

        const { data: lvl } = await supabase.from("student_levels").select("*").lte("min_points", total).order("min_points", { ascending: false }).limit(1).single();
        setLevel(lvl);

        const { data: next } = await supabase.from("student_levels").select("*").gt("min_points", total).order("min_points", { ascending: true }).limit(1).single();
        setNextLevel(next);
      }

      const { data: lb } = await supabase
        .from("gamification_points")
        .select("user_id, student:student_profiles(full_name, university_name), points")
        .order("points", { ascending: false })
        .limit(20);
      setLeaderboard(lb || []);

      const { data: acts } = await supabase.from("gamification_actions").select("*").eq("is_active", true);
      setActions(acts || []);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const progressToNext = nextLevel ? Math.min(100, ((points - (level?.min_points || 0)) / ((nextLevel?.min_points || 1) - (level?.min_points || 0))) * 100) : 100;

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Achievements and Leaderboard</h1>
        <p className="text-muted-foreground mb-8">Earn points, unlock levels, and climb the ranks.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Zap className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{points}</p>
                  <p className="text-muted-foreground">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{level?.level_name || "Rookie"}</p>
                  <p className="text-muted-foreground">Current Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{nextLevel ? nextLevel.min_points - points : 0}</p>
                  <p className="text-muted-foreground">Points to Next Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5" />Leaderboard</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.student?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{entry.student?.university_name}</p>
                    </div>
                    <Badge variant="outline">{entry.points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5" />Ways to Earn</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{action.action_name}</p>
                      {action.daily_limit && <p className="text-xs text-muted-foreground">Limit: {action.daily_limit}/day</p>}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+{action.points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

