"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type RequestType = "access" | "rectification" | "erasure" | "portability" | "objection";

export function DataRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    email: "",
    requestType: "access" as RequestType,
    details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gdpr/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to submit request");

      setSubmitted(true);
      toast.success("Request submitted! We will respond within 30 days.");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">Request Received</h3>
          <p className="text-slate-600">
            We have received your data request. We will process it within 30 days 
            and contact you at {form.email}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Request Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestType">Request Type</Label>
            <select
              id="requestType"
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value as RequestType })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="access">Access my data</option>
              <option value="rectification">Correct my data</option>
              <option value="erasure">Delete my data (Right to be Forgotten)</option>
              <option value="portability">Export my data</option>
              <option value="objection">Object to data processing</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Any specific information about your request..."
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
