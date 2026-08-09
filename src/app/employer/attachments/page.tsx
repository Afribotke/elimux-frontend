'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Attachment {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  department: string | null;
  supervisor_name: string | null;
  evaluation_score: number | null;
  student: { email: string; raw_user_meta_data: any } | null;
  university: { name: string } | null;
}

interface Evaluation {
  id: string;
  punctuality_score: number | null;
  teamwork_score: number | null;
  communication_score: number | null;
  technical_skills_score: number | null;
  initiative_score: number | null;
  overall_score: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  recommendation: string | null;
}

export default function EmployerAttachmentsPage() {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvalForm, setShowEvalForm] = useState(false);

  useEffect(() => { fetchAttachments(); }, []);

  async function fetchAttachments() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAttachments(data.data || []);
      if (data.data?.length > 0) setSelectedAttachment(data.data[0]);
    }
    setLoading(false);
  }

  async function fetchEvaluation(attachmentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${attachmentId}/evaluation`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setEvaluation(data.data);
    }
  }

  useEffect(() => {
    if (selectedAttachment) fetchEvaluation(selectedAttachment.id);
  }, [selectedAttachment]);

  async function submitEvaluation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedAttachment) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const body = {
      punctuality_score: parseInt(fd.get('punctuality_score') as string) || null,
      teamwork_score: parseInt(fd.get('teamwork_score') as string) || null,
      communication_score: parseInt(fd.get('communication_score') as string) || null,
      technical_skills_score: parseInt(fd.get('technical_skills_score') as string) || null,
      initiative_score: parseInt(fd.get('initiative_score') as string) || null,
      overall_score: parseInt(fd.get('overall_score') as string) || null,
      strengths: fd.get('strengths') as string || null,
      areas_for_improvement: fd.get('areas_for_improvement') as string || null,
      recommendation: fd.get('recommendation') as string || null
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${selectedAttachment.id}/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      setShowEvalForm(false);
      fetchEvaluation(selectedAttachment.id);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Assigned Students</h1>
        <p className="text-gray-500 mb-6">View student logbooks and submit final evaluations</p>

        {attachments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No students are currently assigned to your organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="lg:col-span-1 space-y-4">
              {attachments.map(att => (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttachment(att)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer border-2 ${selectedAttachment?.id === att.id ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      att.status === 'active' ? 'bg-green-100 text-green-700' :
                      att.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{att.status}</span>
                    {att.evaluation_score !== null && <span className="text-xs text-blue-600 font-medium">Evaluated: {att.evaluation_score}</span>}
                  </div>
                  <h3 className="font-semibold">{att.student?.raw_user_meta_data?.full_name || att.student?.email || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-500">{att.university?.name || 'Unknown University'}</p>
                  <p className="text-sm text-gray-400 mt-1">{att.department || 'No department'}</p>
                </div>
              ))}
            </div>

            {/* Evaluation Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Student Evaluation</h2>
                  {selectedAttachment?.status === 'active' && !evaluation && (
                    <button
                      onClick={() => setShowEvalForm(!showEvalForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      + Submit Evaluation
                    </button>
                  )}
                </div>

                {showEvalForm && (
                  <form onSubmit={submitEvaluation} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {['punctuality', 'teamwork', 'communication', 'technical_skills', 'initiative'].map(skill => (
                        <div key={skill}>
                          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{skill.replace('_', ' ')} (0-10)</label>
                          <input type="number" name={`${skill}_score`} min="0" max="10" required className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overall Score (0-100)</label>
                      <input type="number" name="overall_score" min="0" max="100" required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                      <textarea name="strengths" rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Student's key strengths..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                      <textarea name="areas_for_improvement" rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Areas where student can improve..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                      <select name="recommendation" required className="w-full px-3 py-2 border rounded-lg">
                        <option value="">Select...</option>
                        <option value="highly_recommend">Highly Recommend</option>
                        <option value="recommend">Recommend</option>
                        <option value="neutral">Neutral</option>
                        <option value="not_recommend">Do Not Recommend</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Submit Evaluation</button>
                      <button type="button" onClick={() => setShowEvalForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    </div>
                  </form>
                )}

                {evaluation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {evaluation.punctuality_score !== null && <ScoreCard label="Punctuality" score={evaluation.punctuality_score} max={10} />}
                      {evaluation.teamwork_score !== null && <ScoreCard label="Teamwork" score={evaluation.teamwork_score} max={10} />}
                      {evaluation.communication_score !== null && <ScoreCard label="Communication" score={evaluation.communication_score} max={10} />}
                      {evaluation.technical_skills_score !== null && <ScoreCard label="Technical Skills" score={evaluation.technical_skills_score} max={10} />}
                      {evaluation.initiative_score !== null && <ScoreCard label="Initiative" score={evaluation.initiative_score} max={10} />}
                      {evaluation.overall_score !== null && <ScoreCard label="Overall" score={evaluation.overall_score} max={100} color="blue" />}
                    </div>
                    {evaluation.strengths && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">Strengths</p>
                        <p className="text-sm text-green-700">{evaluation.strengths}</p>
                      </div>
                    )}
                    {evaluation.areas_for_improvement && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-amber-800">Areas for Improvement</p>
                        <p className="text-sm text-amber-700">{evaluation.areas_for_improvement}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Recommendation:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.recommendation === 'highly_recommend' ? 'bg-green-100 text-green-700' :
                        evaluation.recommendation === 'recommend' ? 'bg-blue-100 text-blue-700' :
                        evaluation.recommendation === 'neutral' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>{evaluation.recommendation?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No evaluation submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, score, max, color = 'green' }: { label: string; score: number; max: number; color?: string }) {
  const pct = (score / max) * 100;
  return (
    <div className={`rounded-lg p-3 ${color === 'blue' ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <div className={`text-2xl font-bold ${color === 'blue' ? 'text-blue-700' : 'text-gray-700'}`}>{score}<span className="text-sm font-normal text-gray-400">/{max}</span></div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
