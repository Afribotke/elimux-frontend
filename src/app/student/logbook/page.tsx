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
  supervisor_email: string | null;
  evaluation_score: number | null;
  certificate_issued: boolean;
  university: { name: string } | null;
  employer: { company_name: string } | null;
}

interface LogbookEntry {
  id: string;
  entry_date: string;
  week_number: number | null;
  tasks_completed: string;
  skills_learned: string | null;
  challenges_faced: string | null;
  supervisor_comments: string | null;
  hours_worked: number;
}

export default function LogbookPage() {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);

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

  async function fetchLogbook(attachmentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${attachmentId}/logbook`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setLogbookEntries(data.data || []);
    }
  }

  useEffect(() => {
    if (selectedAttachment) fetchLogbook(selectedAttachment.id);
  }, [selectedAttachment]);

  async function submitEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedAttachment) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${selectedAttachment.id}/logbook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        entry_date: fd.get('entry_date'),
        week_number: fd.get('week_number') ? parseInt(fd.get('week_number') as string) : null,
        tasks_completed: fd.get('tasks_completed'),
        skills_learned: fd.get('skills_learned'),
        challenges_faced: fd.get('challenges_faced'),
        hours_worked: fd.get('hours_worked') ? parseInt(fd.get('hours_worked') as string) : 0
      })
    });
    if (res.ok) {
      setShowEntryForm(false);
      form.reset();
      fetchLogbook(selectedAttachment.id);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Attachment</h1>
        <p className="text-gray-500 mb-6">View placement details and submit logbook entries</p>

        {attachments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">You have no active attachment placements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attachment Details */}
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
                    {att.certificate_issued && <span className="text-xs text-purple-600 font-medium">📜 Certificate</span>}
                  </div>
                  <h3 className="font-semibold">{att.employer?.company_name || 'Unknown Employer'}</h3>
                  <p className="text-sm text-gray-500">{att.university?.name || 'Unknown University'}</p>
                  <p className="text-sm text-gray-400 mt-1">{att.start_date} → {att.end_date || 'Ongoing'}</p>
                  {att.evaluation_score !== null && <p className="text-sm text-blue-600 mt-1">Score: {att.evaluation_score}/100</p>}
                </div>
              ))}
            </div>

            {/* Logbook */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Logbook Entries</h2>
                  {selectedAttachment?.status === 'active' && (
                    <button
                      onClick={() => setShowEntryForm(!showEntryForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      + Add Entry
                    </button>
                  )}
                </div>

                {showEntryForm && (
                  <form onSubmit={submitEntry} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" name="entry_date" required className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Week #</label>
                        <input type="number" name="week_number" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed *</label>
                      <textarea name="tasks_completed" required rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Describe what you worked on today..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills Learned</label>
                      <textarea name="skills_learned" rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="New skills or knowledge gained..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Challenges Faced</label>
                      <textarea name="challenges_faced" rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Any difficulties encountered..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                      <input type="number" name="hours_worked" min="0" className="w-full px-3 py-2 border rounded-lg" placeholder="8" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Submit Entry</button>
                      <button type="button" onClick={() => setShowEntryForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {logbookEntries.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No logbook entries yet. Start by adding your first entry above.</p>
                  ) : (
                    logbookEntries.map(entry => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{new Date(entry.entry_date).toLocaleDateString()}</span>
                            {entry.week_number && <span className="text-sm text-gray-500 ml-2">Week {entry.week_number}</span>}
                          </div>
                          <span className="text-sm text-gray-400">{entry.hours_worked}h</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{entry.tasks_completed}</p>
                        {entry.skills_learned && <p className="text-xs text-green-600 mb-1">Skills: {entry.skills_learned}</p>}
                        {entry.challenges_faced && <p className="text-xs text-amber-600 mb-1">Challenges: {entry.challenges_faced}</p>}
                        {entry.supervisor_comments && (
                          <div className="mt-2 bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700 font-medium">Supervisor: {entry.supervisor_comments}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
