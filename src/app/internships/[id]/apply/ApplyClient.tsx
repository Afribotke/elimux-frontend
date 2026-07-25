"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Send, ArrowLeft, Lock } from "lucide-react";

export default function ApplyClient({ internship, internshipId }: { internship: any; internshipId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: "",
    portfolioLinks: [""],
    videoIntroUrl: "",
    answers: {} as Record<string, string>,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/internships/" + internshipId + "/apply");
        return;
      }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!profile) {
        toast.error("Please complete your student profile first");
        router.push("/student/profile");
        return;
      }
      setStudentProfile(profile);
      setIsVerified(profile.is_university_verified);
      setLoading(false);
    };
    fetchData();
  }, [internshipId, router, supabase]);

  const handleSubmit = async () => {
    if (!isVerified) {
      toast.error("Only university-verified students can apply");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("applications").insert({
        student_id: studentProfile.id,
        internship_id: internshipId,
        cover_letter: formData.coverLetter,
        portfolio_links: formData.portfolioLinks.filter(Boolean),
        video_intro_url: formData.videoIntroUrl,
        answers: formData.answers,
        status: "submitted",
      });
      if (error) {
        if (error.code === "23505") toast.error("You have already applied for this internship");
        else throw error;
        return;
      }
      toast.success("Application submitted successfully!");
      router.push("/internships/my-applications");
    } catch (err) {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push("/internships")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Internships
        </Button>

        {!isVerified && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-red-600 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">Application Restricted</h3>
                  <p className="text-red-700 mb-4">
                    Only students whose details have been verified and uploaded by their university can apply for internships.
                    Your profile is pending verification.
                  </p>
                  <div className="bg-background rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-muted-foreground mb-2">To get verified:</p>
                    <ol className="text-sm text-foreground list-decimal list-inside space-y-1">
                      <li>Contact your university career services office</li>
                      <li>Ask them to upload your details to ElimuX</li>
                      <li>Your registration number: <strong>{studentProfile?.registration_number || "N/A"}</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              {internship.employer?.logo_url && (
                <img src={internship.employer.logo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <CardTitle className="text-2xl">{internship.title}</CardTitle>
                <CardDescription className="text-lg">{internship.employer?.company_name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <h4 className="font-semibold text-foreground">About this Role</h4>
              <p>{internship.description}</p>
              {internship.requirements && (
                <>
                  <h4 className="font-semibold text-foreground mt-4">Requirements</h4>
                  <p>{internship.requirements}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit Your Application</CardTitle>
            <CardDescription>
              {isVerified ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />Your profile is verified by {studentProfile?.university_name}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />Verification required before submission
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {internship.requires_cover_letter && (
              <div>
                <Label htmlFor="coverLetter">Cover Letter *</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell us why you are a great fit..."
                  className="mt-2 min-h-[150px]"
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  disabled={!isVerified}
                />
              </div>
            )}
            {internship.requires_portfolio && (
              <div>
                <Label>Portfolio / Project Links</Label>
                <div className="space-y-2 mt-2">
                  {formData.portfolioLinks.map((link, idx) => (
                    <Input
                      key={idx}
                      placeholder="https://github.com/yourproject"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...formData.portfolioLinks];
                        newLinks[idx] = e.target.value;
                        setFormData({ ...formData, portfolioLinks: newLinks });
                      }}
                      disabled={!isVerified}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, portfolioLinks: [...formData.portfolioLinks, ""] })}
                    disabled={!isVerified}
                  >
                    Add Another Link
                  </Button>
                </div>
              </div>
            )}
            {internship.requires_video_intro && (
              <div>
                <Label htmlFor="videoUrl">Video Introduction URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="YouTube or Loom link"
                  className="mt-2"
                  value={formData.videoIntroUrl}
                  onChange={(e) => setFormData({ ...formData, videoIntroUrl: e.target.value })}
                  disabled={!isVerified}
                />
              </div>
            )}
            {internship.application_form_questions?.map((q: any, idx: number) => (
              <div key={idx}>
                <Label>{q.question} {q.required && "*"}</Label>
                {q.type === "text" ? (
                  <Input
                    className="mt-2"
                    placeholder="Your answer..."
                    value={formData.answers[q.question] || ""}
                    onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.question]: e.target.value } })}
                    disabled={!isVerified}
                  />
                ) : (
                  <Textarea
                    className="mt-2"
                    placeholder="Your answer..."
                    value={formData.answers[q.question] || ""}
                    onChange={(e) => setFormData({ ...formData, answers: { ...formData.answers, [q.question]: e.target.value } })}
                    disabled={!isVerified}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your data is shared with the employer and NITA</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!isVerified || submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" />Submit Application</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

