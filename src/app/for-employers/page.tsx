import Link from "next/link";
import { Building2, Users, TrendingUp, ArrowRight } from "lucide-react";

export const metadata = {
  title: "For Employers — ElimuX",
  description: "Post jobs, find talent, and partner with ElimuX.",
};

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-blue-600 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Hire Top Talent with ElimuX
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-blue-100">
          Post internships and jobs, access our student database, and build your employer brand.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/employer/register"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            Register as Employer
          </Link>
          <Link
            href="/internships"
            className="rounded-lg border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Browse Listings
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Building2,
              title: "Post Jobs & Internships",
              desc: "List openings and reach thousands of students across Africa and beyond.",
            },
            {
              icon: Users,
              title: "Access Talent Pool",
              desc: "Filter and connect with qualified candidates from verified institutions.",
            },
            {
              icon: TrendingUp,
              title: "Build Your Brand",
              desc: "Showcase your company culture and attract the best candidates.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <f.icon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to start hiring?</h2>
        <p className="mt-2 text-slate-600">Join hundreds of employers already using ElimuX.</p>
        <Link
          href="/employer/register"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
