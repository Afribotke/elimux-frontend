'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  fetchScholarshipApplication,
  uploadApplicationDocument,
  submitScholarshipApplication,
  getApplicationGuidance,
  type ScholarshipApplication,
} from '@/lib/api';

const supabase = createClient();

function getStatusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'under_review': return 'bg-yellow-100 text-yellow-800';
    case 'awarded': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'withdrawn': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getProgress(app: ScholarshipApplication) {
  const total = (app.documents_uploaded?.length || 0) + (app.missing_documents?.length || 0);
  if (total === 0) return app.status === 'submitted' ? 100 : 50;
  return Math.round(((app.documents_uploaded?.length || 0) / total) * 100);
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = not checked yet
  const [app, setApp] = useState<ScholarshipApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    if (token === null) router.push(`/login?redirect=/applications/${id}`);
  }, [token, id, router]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const { data } = await fetchScholarshipApplication(id, token);
      setApp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function handleFileUpload(docName: string, file: File) {
    if (!token || !app) return;
    try {
      setUploading(true);
      setError('');
      await uploadApplicationDocument(app.id, file, docName, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleGuidance() {
    if (!token || !app) return;
    try {
      setGuidanceLoading(true);
      setError('');
      await getApplicationGuidance(app.id, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get guidance');
    } finally {
      setGuidanceLoading(false);
    }
  }

  async function handleSubmit() {
    if (!token || !app) return;
    if (!confirm('Submit this application? Make sure all required documents are uploaded.')) return;
    try {
      setSubmitting(true);
      setError('');
      await submitScholarshipApplication(app.id, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (token === undefined || (loading && token)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) return null; // redirect effect above is already firing

  if (error && !app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Error</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link href="/applications" className="text-blue-700 text-sm hover:underline">
            ← Back to My Applications
          </Link>
        </div>
      </div>
    );
  }

  if (!app) return null;

  const scholarship = app.scholarship;
  const isDraft = app.status === 'draft';
  const progress = getProgress(app);
  const applyUrl = scholarship?.application_url || scholarship?.source_url;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/applications" className="text-gray-600 text-sm hover:text-gray-900 mb-6 inline-block">
          ← Back to My Applications
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{scholarship?.title || 'Unknown Scholarship'}</h1>
              <p className="text-gray-600">{scholarship?.provider || 'Unknown provider'}</p>
            </div>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
              {app.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Amount</p>
              <p className="text-gray-900 font-medium">
                {scholarship?.amount ? `${scholarship.currency} ${scholarship.amount}` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Deadline</p>
              <p className="text-gray-900 font-medium">
                {scholarship?.application_deadline
                  ? new Date(scholarship.application_deadline).toLocaleDateString()
                  : 'Rolling'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Location</p>
              <p className="text-gray-900 font-medium">{scholarship?.country?.name || 'Any'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Level</p>
              <p className="text-gray-900 font-medium">{scholarship?.study_levels?.join(', ') || 'Any'}</p>
            </div>
          </div>

          {isDraft && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Application Progress</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {app.status !== 'draft' && (app.review_score !== null || app.review_notes) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h2 className="font-semibold text-yellow-900 mb-2">📋 Review Feedback</h2>
            {app.review_score !== null && (
              <p className="text-yellow-800 text-sm mb-1">Score: {app.review_score}/100</p>
            )}
            {app.review_notes && (
              <p className="text-yellow-800 text-sm whitespace-pre-wrap">{app.review_notes}</p>
            )}
          </div>
        )}

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-blue-900">🤖 AI Guidance</h2>
            {isDraft && (
              <button
                onClick={handleGuidance}
                disabled={guidanceLoading}
                className="text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-50"
              >
                {guidanceLoading ? 'Generating…' : app.ai_guidance ? 'Regenerate' : 'Get guidance'}
              </button>
            )}
          </div>
          {app.ai_guidance ? (
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{app.ai_guidance}</p>
          ) : (
            <p className="text-blue-700 text-sm">No guidance generated yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>

          {(app.missing_documents?.length ?? 0) > 0 && isDraft && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Required Documents</h3>
              <div className="space-y-3">
                {app.missing_documents.map((docName) => (
                  <div key={docName} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-red-500">●</span>
                        <span className="font-medium text-gray-900">{docName}</span>
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">Missing</span>
                      </div>
                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(docName, file);
                          }}
                        />
                        <span className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors inline-block">
                          {uploading ? 'Uploading…' : 'Upload'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB. PDF, JPEG, or PNG.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(app.documents_uploaded?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Uploaded Documents</h3>
              <div className="space-y-2">
                {app.documents_uploaded.map((doc, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-900">{doc.name}</span>
                    <span className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!app.missing_documents?.length && !app.documents_uploaded?.length && (
            <p className="text-gray-500 text-center py-4">No documents required for this scholarship</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {isDraft && (
            <button
              onClick={handleSubmit}
              disabled={submitting || (app.missing_documents?.length ?? 0) > 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={(app.missing_documents?.length ?? 0) > 0 ? 'Upload all required documents before submitting' : ''}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
          {isDraft && (app.missing_documents?.length ?? 0) > 0 && (
            <p className="text-yellow-700 text-sm">Upload all required documents before submitting</p>
          )}
          {applyUrl ? (
            <Link href={applyUrl} target="_blank" rel="noopener" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Apply on Provider Site →
            </Link>
          ) : (
            <span className="text-sm font-medium text-gray-400 cursor-not-allowed">Apply on Provider Site →</span>
          )}
        </div>
      </div>
    </div>
  );
}
