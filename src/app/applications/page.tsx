'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import {
  fetchMyScholarshipApplications,
  submitScholarshipApplication,
  type ScholarshipApplication,
} from '@/lib/api';

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

function getDeadlineStatus(deadline: string | null | undefined) {
  if (!deadline) return { text: 'Rolling', color: 'text-blue-600' };
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: 'Closed', color: 'text-gray-500' };
  if (days <= 7) return { text: `${days}d left`, color: 'text-red-600 font-bold' };
  if (days <= 30) return { text: `${days}d left`, color: 'text-yellow-600' };
  return { text: d.toLocaleDateString(), color: 'text-green-600' };
}

export default function ApplicationsPage() {
  // Read the session AuthContext already resolved on mount instead of
  // calling supabase.auth.getSession() again here - a second concurrent
  // call on the shared singleton client (src/lib/supabase/client.ts) while
  // AuthContext's own getSession() is still in flight leaves this page
  // stuck on the loading spinner forever (same bug ScholarshipApplyButton
  // hit and fixed the same way).
  const { session, loading: authLoading } = useAuthContext();
  const token = session?.access_token ?? null;
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const json = await fetchMyScholarshipApplications(token);
      setApplications(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleSubmit = async (appId: string) => {
    if (!token) return;
    if (!confirm('Submit this application? Make sure all required documents are uploaded.')) return;
    try {
      await submitScholarshipApplication(appId, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  if (authLoading || (loading && token)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Applications</h1>
          <p className="text-gray-600 mb-6">Log in to track your scholarship applications</p>
          <Link href="/login" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-1">Track and manage your scholarship applications</p>
          </div>
          <Link href="/#scholarships" className="text-gray-700 hover:text-gray-900 font-medium">
            Browse Scholarships →
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h2>
            <p className="text-gray-600 mb-6">Start tracking scholarships you&apos;re interested in</p>
            <Link href="/#scholarships" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors">
              Find Scholarships
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {[...applications].sort((a, b) => {
              const da = a.scholarship?.application_deadline ? new Date(a.scholarship.application_deadline).getTime() : Infinity;
              const db = b.scholarship?.application_deadline ? new Date(b.scholarship.application_deadline).getTime() : Infinity;
              return da - db;
            }).map(app => {
              const progress = getProgress(app);
              const deadline = getDeadlineStatus(app.scholarship?.application_deadline);
              const applyUrl = app.scholarship?.application_url || app.scholarship?.source_url;

              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{app.scholarship?.title}</h3>
                        <p className="text-gray-600">{app.scholarship?.provider}</p>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      {app.status !== 'draft' && app.review_score !== null && app.review_score !== undefined && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Score: {app.review_score}/100
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
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

                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                      <span className={deadline.color}>Deadline: {deadline.text}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">{app.scholarship?.amount || 'Amount not specified'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">
                        {app.documents_uploaded?.length || 0} of {(app.documents_uploaded?.length || 0) + (app.missing_documents?.length || 0)} documents
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-gray-700 hover:text-gray-900 font-medium text-sm"
                      >
                        {app.status === 'draft' ? 'Continue Application' : 'View Details'}
                      </Link>
                      {app.status === 'draft' && (
                        <button
                          onClick={() => handleSubmit(app.id)}
                          className="text-green-700 hover:text-green-800 font-medium text-sm"
                        >
                          Submit Application
                        </button>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
