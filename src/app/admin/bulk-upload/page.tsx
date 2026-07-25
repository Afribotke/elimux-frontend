"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle } from "lucide-react";

export default function AdminBulkUploadPage() {
  const supabase = createClient();
  const [jsonInput, setJsonInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const students = JSON.parse(jsonInput);
      if (!Array.isArray(students)) {
        toast.error("Input must be a JSON array");
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const student of students) {
        const { error } = await supabase.from("student_profiles").upsert({
          registration_number: student.registration_number,
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          university_name: student.university_name,
          course_name: student.course_name,
          course_category: student.course_category,
          year_of_study: student.year_of_study || 1,
          is_university_verified: true,
        }, { onConflict: "registration_number" });

        if (error) {
          failed++;
          errors.push(`${student.registration_number}: ${error.message}`);
        } else {
          success++;
        }
      }

      setResults({ success, failed, errors });
      toast.success(`Uploaded: ${success} success, ${failed} failed`);
    } catch (err: any) {
      toast.error("Invalid JSON: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bulk Student Upload</h1>
        <p className="text-muted-foreground mb-8">Upload verified student data via JSON array.</p>

        <Card className="mb-6">
          <CardHeader><CardTitle>JSON Format</CardTitle></CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`[
  {
    "registration_number": "TU2024-001",
    "full_name": "John Doe",
    "email": "john@university.ac.ke",
    "phone": "+254712345678",
    "university_name": "Technical University of Kenya",
    "course_name": "Diploma in ICT",
    "course_category": "Information Technology",
    "year_of_study": 2
  }
]`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Upload Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Paste JSON Array</Label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
                placeholder="Paste your JSON array here..."
                className="font-mono text-sm"
              />
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleUpload} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload Students"}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" /><span className="font-bold">{results.success} Success</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <FileText className="w-5 h-5" /><span className="font-bold">{results.failed} Failed</span>
                </div>
              </div>
              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {results.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-700">{err}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

