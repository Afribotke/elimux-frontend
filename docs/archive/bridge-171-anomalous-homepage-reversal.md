tsx
// app/(main)/page.tsx  (or your homepage/dashboard file)
"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Wrench,
  Award,
  Briefcase,
  MapPin,
  Trophy,
  Handshake,
  School,
  Clock,
} from "lucide-react";

interface FeatureCard {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
  comingSoon: boolean;
  colorClass: string; // Tailwind classes for the icon circle background
}

const features: FeatureCard[] = [
  {
    id: "universities",
    title: "Universities & College",
    icon: <GraduationCap className="w-6 h-6 text-white" />,
    href: "/institutions?type=university",
    comingSoon: false,
    colorClass: "bg-blue-600",
  },
  {
    id: "tvet",
    title: "Skills & Trades (TVET)",
    icon: <Wrench className="w-6 h-6 text-white" />,
    href: "/institutions?type=tvet",
    comingSoon: false,
    colorClass: "bg-orange-500",
  },
  {
    id: "scholarships",
    title: "Scholarships",
    icon: <Award className="w-6 h-6 text-white" />,
    href: "/scholarships",
    comingSoon: false,
    colorClass: "bg-purple-600",
  },
  {
    id: "internship",
    title: "Internship",
    icon: <Briefcase className="w-6 h-6 text-white" />,
    href: "/internships",
    comingSoon: false,
    colorClass: "bg-emerald-600",
  },
  {
    id: "attachment",
    title: "Attachment",
    icon: <MapPin className="w-6 h-6 text-white" />,
    href: "/attachments",
    comingSoon: false,
    colorClass: "bg-indigo-600",
  },
  {
    id: "bursary",
    title: "Bursary",
    icon: <Trophy className="w-6 h-6 text-white" />,
    href: "/bursaries",
    comingSoon: false,
    colorClass: "bg-yellow-500",
  },
  {
    id: "senior-schools",
    title: "Senior Schools",
    icon: <School className="w-6 h-6 text-white" />,
    href: "#",
    comingSoon: true,
    colorClass: "bg-teal-600",
  },
  {
    id: "career-pathways",
    title: "Career Pathways",
    subtitle: "Discover your path",
    icon: <Handshake className="w-6 h-6 text-white" />,
    href: "/career-pathways",
    comingSoon: false,
    colorClass: "bg-cyan-600",
  },
];

function FeatureCardItem({ feature }: { feature: FeatureCard }) {
  const Wrapper = feature.comingSoon ? "div" : Link;
  const wrapperProps = feature.comingSoon
    ? { className: "relative block" }
    : { href: feature.href, className: "relative block group" };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <div
        className={[
          "relative flex flex-col items-center justify-center rounded-2xl border p-6 text-center transition-all",
          "border-slate-700 bg-slate-800/60 backdrop-blur-sm",
          feature.comingSoon
            ? "opacity-60 cursor-not-allowed grayscale-[0.25]"
            : "hover:bg-slate-800 hover:border-slate-600 hover:shadow-lg cursor-pointer",
        ].join(" ")}
      >
        {/* Coming Soon Badge */}
        {feature.comingSoon && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900">
            <Clock className="w-3 h-3" />
            Soon
          </div>
        )}

        {/* Icon Circle */}
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-full shadow-md mb-3",
            feature.colorClass,
            feature.comingSoon ? "opacity-70" : "",
          ].join(" ")}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3
          className={[
            "text-sm font-semibold",
            feature.comingSoon ? "text-slate-400" : "text-white",
          ].join(" ")}
        >
          {feature.title}
        </h3>

        {/* Optional Subtitle */}
        {feature.subtitle && !feature.comingSoon && (
          <p className="mt-1 text-xs text-slate-400">{feature.subtitle}</p>
        )}
      </div>
    </Wrapper>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900">
      {/* Hero or existing content above stays untouched */}

      {/* Feature Cards Grid */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {features.map((feature) => (
            <FeatureCardItem key={feature.id} feature={feature} />
          ))}
        </div>

        {/* Optional footer note */}
        <p className="mt-8 text-center text-xs text-slate-500">
          New features launching weekly. Stay tuned.
        </p>
      </section>
    </main>
  );
}
End copying here.