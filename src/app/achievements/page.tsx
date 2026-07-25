import Link from "next/link";
import { Trophy, Star, Zap, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Achievements — ElimuX",
  description: "Earn badges, track progress, and unlock rewards on ElimuX.",
};

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-amber-500 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Your Achievements
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-amber-100">
          Earn badges, climb leaderboards, and unlock rewards as you explore education opportunities.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/gamification"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50"
          >
            View Leaderboard
          </Link>
          <Link
            href="/partner"
            className="rounded-lg border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Partner Program
          </Link>
        </div>
      </section>

      {/* Badges Preview */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Star,
              title: "Explorer",
              desc: "Search and browse 10+ institutions.",
              color: "text-amber-500",
            },
            {
              icon: Zap,
              title: "Connector",
              desc: "Apply to 5+ programs or internships.",
              color: "text-blue-500",
            },
            {
              icon: Trophy,
              title: "Champion",
              desc: "Complete your profile and get verified.",
              color: "text-emerald-500",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 text-center">
              <b.icon className={`h-10 w-10 ${b.color} mx-auto mb-4`} />
              <h3 className="text-lg font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Start earning today</h2>
        <p className="mt-2 text-slate-600">Every action on ElimuX brings you closer to rewards.</p>
        <Link
          href="/gamification"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Go to Gamification <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
