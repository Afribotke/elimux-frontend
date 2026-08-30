"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CareerPathway } from "@/lib/schools-data";
import { ArrowRight, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function PathwaySelectorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pathways, setPathways] = useState<CareerPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchPathways();
  }, []);

  const fetchPathways = async () => {
    try {
      const res = await fetch("/api/pathways");
      const json = await res.json();
      if (json.data) setPathways(json.data);
    } catch (err) {
      console.error("Failed to fetch pathways:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (pathwayId: string) => {
    if (!user) {
      router.push("/auth/login?redirect=/pathways/select");
      return;
    }
    setSelecting(pathwayId);
    try {
      const res = await fetch("/api/pathways/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway_id: pathwayId }),
      });
      if (res.ok) {
        setSelected(pathwayId);
        setTimeout(() => router.push("/schools?tab=pathway"), 1500);
      }
    } catch (err) {
      console.error("Selection failed:", err);
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-500">Loading pathways...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> Career Pathways
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Choose Your Path</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the career pathway that matches your interests and strengths.
            We&apos;ll recommend the best schools for your choice.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pathways.map((pathway, index) => (
            <motion.div
              key={pathway.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 rounded-2xl bg-white ${
                  selected === pathway.id
                    ? "border-green-500 bg-green-50"
                    : "border-transparent hover:border-gray-200"
                }`}
                onClick={() => !selecting && handleSelect(pathway.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{pathway.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{pathway.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pathway.description}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                          Min Cluster: {pathway.required_cluster_min || "Any"}
                        </span>
                        {pathway.recommended_regions?.slice(0, 3).map((r) => (
                          <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {selected === pathway.id ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : selecting === pathway.id ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
