"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download, Shield } from "lucide-react";

export default function CertificateClient({ cert }: { cert: any }) {
  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Certificate Not Found</h2>
            <p className="text-muted-foreground">The certificate number you entered could not be verified.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-2">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              {cert.is_verified ? (
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-amber-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">Certificate of {cert.certificate_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</CardTitle>
            <Badge className={cert.is_verified ? "bg-emerald-100 text-emerald-700 mt-2" : "bg-amber-100 text-amber-700 mt-2"}>
              {cert.is_verified ? "Verified" : "Pending Verification"}
            </Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div><p className="text-sm text-muted-foreground">Certificate Number</p><p className="font-mono font-medium">{cert.certificate_number}</p></div>
              <div><p className="text-sm text-muted-foreground">Issue Date</p><p className="font-medium">{new Date(cert.issue_date).toLocaleDateString()}</p></div>
              <div><p className="text-sm text-muted-foreground">Student Name</p><p className="font-medium">{cert.student?.full_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Course</p><p className="font-medium">{cert.student?.course_name}</p></div>
              <div><p className="text-sm text-muted-foreground">University</p><p className="font-medium">{cert.student?.university_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Employer</p><p className="font-medium">{cert.employer?.company_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Hours Completed</p><p className="font-medium">{cert.hours_completed}</p></div>
              <div><p className="text-sm text-muted-foreground">Completion Date</p><p className="font-medium">{cert.completion_date ? new Date(cert.completion_date).toLocaleDateString() : "N/A"}</p></div>
            </div>
            {cert.verified_by && (
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-700"><strong>Verified by:</strong> {cert.verified_by}</p>
                <p className="text-sm text-emerald-600"><strong>Date:</strong> {new Date(cert.verification_date).toLocaleDateString()}</p>
              </div>
            )}
            {cert.pdf_url && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => window.open(cert.pdf_url, "_blank")}>
                <Download className="w-4 h-4 mr-2" />Download Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

