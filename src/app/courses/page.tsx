"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, BookOpen, Clock, MapPin, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Program {
  id: string;
  name: string;
  duration_months: number;
  level: string;
  tuition_fees: number | null;
  currency: string | null;
  category_id: string;
  institution: {
    name: string;
    city: string | null;
    country: { name: string } | null;
  } | null;
}

export default function CourseSelector() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: progs }] = await Promise.all([
        supabase.from("program_categories").select("id, name, color, icon").eq("is_active", true).order("name"),
        supabase
          .from("programs")
          .select(
            "id, name, duration_months, level, tuition_fees, currency, category_id, institution:institutions(name, city, country:countries(name))"
          )
          .eq("is_active", true)
          .order("name")
          .limit(200),
      ]);
      setCategories(cats || []);
      setPrograms(((progs || []) as unknown) as Program[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = programs.filter((p) => {
    if (activeCategory && p.category_id !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesInstitution = p.institution?.name.toLowerCase().includes(q);
      if (!matchesName && !matchesInstitution) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero + Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Course</h1>
          <p className="mt-2 text-gray-500">Pick a category, then browse matching programs</p>

          <div className="relative mt-8">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                activeCategory === null
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  activeCategory === cat.id
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: cat.color || "#dbeafe" }}
                >
                  {cat.icon || ""}
                </span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-gray-500">{filtered.length} programs found</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-blue-600">{program.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{program.institution?.name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  <GraduationCap className="h-3 w-3" />
                  {program.level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  <Clock className="h-3 w-3" />
                  {program.duration_months} months
                </span>
                {(program.institution?.city || program.institution?.country?.name) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {[program.institution?.city, program.institution?.country?.name].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              {program.tuition_fees != null && (
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {program.currency || "$"}{program.tuition_fees.toLocaleString()}
                </p>
              )}
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <BookOpen className="mx-auto h-8 w-8 mb-2 text-gray-300" />
            <p>No programs match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
