'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const supabase = createClient();

export default function NitaLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.session) { setError(authError?.message || 'Login failed'); setLoading(false); return; }

    const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', data.session.user.id).in('role', ['nita_admin', 'elimux_admin', 'admin']);
    if (!roleRows || roleRows.length === 0) {
      setError('Access denied. NITA admin credentials required.'); await supabase.auth.signOut(); setLoading(false); return;
    }
    router.push('/nita/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🇰🇪</div>
          <h1 className="text-2xl font-bold text-gray-900">NITA Portal</h1>
          <p className="text-gray-500 text-sm">National Industrial Training Authority</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Signing in...' : 'Access Dashboard'}</button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Authorized NITA personnel only.</p>
      </div>
    </div>
  );
}
