"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Search, MapPin, Briefcase, Calendar, DollarSign, Users, Star, Filter, Zap, Clock, ChevronRight, Building2
} from "lucide-react";

const PROFESSIONS = [
  "All Professions","Engineering","Information Technology","Healthcare and Medicine",
  "Education","Business and Finance","Agriculture","Hospitality and Tourism",
  "Media and Communications","Law and Legal","Architecture and Design",
  "Science and Research","Social Sciences","Arts and Culture"
];

const COUNTIES = [
  "All Counties","Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu",
  "Machakos","Kajiado","Nyeri","Meru","Kakamega","Bungoma","Kisii","Nyamira",
  "Kericho","Bomet","Nandi","Elgeyo Marakwet","West Pokot","Turkana","Samburu",
  "Laikipia","Nyandarua","Murang'a","Kirinyaga","Embu","Tharaka Nithi","Kitui",
  "Makueni","Taita Taveta","Kilifi","Kwale","Lamu","Tana River","Garissa",
  "Wajir","Mandera","Marsabit","Isiolo","Busia","Siaya","Homa Bay","Migori"
];

export default function InternshipsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeVacancies, setActiveVacancies] = useState(0);
  const [filters, setFilters] = useState({
    query: "",
    profession: "All Professions",
    county: "All Counties",
    isPaid: null as boolean | null,
    isRemote: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) setStudentProfile(data);
      }
    };
    fetchProfile();
  }, [supabase]);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("internships")
        .select("*, employer:employers(company_name, logo_url, industry, average_rating, review_count)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }
      if (filters.profession !== "All Professions") {
        query = query.eq("profession_category", filters.profession);
      }
      if (filters.county !== "All Counties") {
        query = query.eq("location_county", filters.county);
      }
      if (filters.isPaid === true) {
        query = query.eq("is_paid", true);
      }
      if (filters.isRemote) {
        query = query.eq("is_remote", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      let processed = (data || []).map((i: any) => {
        let score = 0;
        if (studentProfile) {
          if (studentProfile.course_name && i.course_tags?.some((t: string) =>
            studentProfile.course_name.toLowerCase().includes(t.toLowerCase()))) score += 40;
          if (studentProfile.preferred_locations?.includes(i.location_county)) score += 20;
          if (studentProfile.preferred_industries?.includes(i.profession_category)) score += 15;
          if (studentProfile.is_open_to_remote && i.is_remote) score += 10;
          if (studentProfile.year_of_study >= (i.min_year_of_study || 1)) score += 10;
          if (i.is_paid) score += 5;
        }
        return { ...i, match_score: score };
      });

      if (studentProfile) {
        processed.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));
      }

      setInternships(processed);
      setTotalCount(processed.length);

      const { count } = await supabase
        .from("internships")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      setActiveVacancies(count || 0);
    } catch (err) {
      toast.error("Failed to load internships");
    } finally {
      setLoading(false);
    }
  }, [filters, studentProfile, supabase]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleApply = (id: string) => router.push(`/internships/${id}/apply`);

  const formatStipend = (min?: number, max?: number) => {
    if (!min && !max) return "Unpaid";
    if (min && max) return `KES ${min.toLocaleString()} - ${max.toLocaleString()}/mo`;
    if (min) return `KES ${min.toLocaleString()}/mo`;
    return "Paid";
  };

  const getMatchBadge = (score: number) => {
    if (score >= 70) return { label: "Excellent Match", color: "bg-green-500 text-white" };
    if (score >= 40) return { label: "Good Match", color: "bg-blue-500 text-white" };
    if (score >= 20) return { label: "Fair Match", color: "bg-yellow-500 text-white" };
    return { label: "Low Match", color: "bg-gray-400 text-white" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{activeVacancies} Active Vacancies Right Now</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Internship</h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              AI-powered matching connects you with employers actively seeking interns in your field.
              Only verified students can apply.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <Input
                placeholder="Search by job title, company or skill..."
                className="border-0 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 flex-1"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              />
              <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4" />Filters
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Search</Button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Profession</label>
                <Select value={filters.profession} onValueChange={(v) => setFilters({ ...filters, profession: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">County</label>
                <Select value={filters.county} onValueChange={(v) => setFilters({ ...filters, county: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Paid Only</label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={filters.isPaid === true} onCheckedChange={(v) => setFilters({ ...filters, isPaid: v ? true : null })} />
                  <span className="text-sm text-gray-600">Show paid internships only</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Remote</label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={filters.isRemote} onCheckedChange={(v) => setFilters({ ...filters, isRemote: v })} />
                  <span className="text-sm text-gray-600">Remote/Hybrid only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {loading ? "Loading..." : `${totalCount} Internships Found`}
          </h2>
          {studentProfile && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Zap className="w-3 h-3 mr-1" />AI Matching Active
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-32 bg-gray-200 animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No internships found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internships.map((i) => {
              const matchBadge = i.match_score ? getMatchBadge(i.match_score) : null;
              return (
                <Card key={i.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {i.employer?.logo_url ? (
                          <img src={i.employer.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg leading-tight">{i.title}</CardTitle>
                          <CardDescription className="text-sm">{i.employer?.company_name}</CardDescription>
                        </div>
                      </div>
                      {i.is_featured && (
                        <Badge className="bg-amber-500 text-white"><Star className="w-3 h-3 mr-1" />Featured</Badge>
                      )}
                    </div>
                    {matchBadge && (
                      <Badge className={`mt-2 ${matchBadge.color}`}>{matchBadge.label} ({i.match_score}%)</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{i.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs"><Briefcase className="w-3 h-3 mr-1" />{i.profession_category}</Badge>
                      <Badge variant="secondary" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{i.location_county}{i.is_remote && " (Remote)"}</Badge>
                      <Badge variant="secondary" className="text-xs"><Calendar className="w-3 h-3 mr-1" />{i.duration_weeks} weeks</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className={i.is_paid ? "text-green-700 font-medium" : "text-gray-500"}>
                          {formatStipend(i.stipend_amount_min, i.stipend_amount_max)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{i.remaining_slots} of {i.total_slots} slots left</span>
                      </div>
                    </div>
                    {i.employer?.average_rating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{i.employer.average_rating.toFixed(1)}</span>
                        <span className="text-gray-500">({i.employer.review_count} reviews)</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Deadline: {new Date(i.application_deadline).toLocaleDateString()}
                      </div>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApply(i.id)}>
                        Apply Now<ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
