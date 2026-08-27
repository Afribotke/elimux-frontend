bridge.md — Cycle 044: Auth Security Hardening
0. AUDIT FIRST (Do not change anything yet)
0.1 Check what auth methods exist in the login page
File: src/app/auth/login/page.tsx
Command to run:
powershell
Get-Content src/app/auth/login/page.tsx | Select-String -Pattern "signInWithPassword|signUp|signInWithOAuth" -Context 10,5
Report back: Paste the exact output showing every auth method call in that file.
0.2 Check if email confirmation is enabled in Supabase
File: This is a dashboard check, not code.
What the founder must do: Go to Supabase Dashboard → Authentication → Providers → Email → screenshot the "Confirm email" toggle state.
Report back: Is "Confirm email" ON or OFF?
0.3 Check if any post-login verification gate exists
Command to run:
powershell
Get-Content app/auth/callback/route.ts
Get-Content src/context/AuthContext.tsx | Select-String -Pattern "email_confirmed_at|verified" -Context 5,5
Report back: Does any file check email_confirmed_at after login?
1. DECISION GATE
Do not proceed to Section 2 until ALL three audit reports above are received.
Based on audit results, the fix will be one of:
Table
Scenario	Login page has signUp?	Confirm email toggle?	email_confirmed_at checked?	Action
A	YES	Any	Any	Remove signUp from login page, create separate /auth/register page
B	NO	OFF	NO	Enable Confirm email in Supabase + add verification gate in code
C	NO	ON	NO	Add verification gate in code only
D	NO	ON	YES	Already secure — investigate why unregistered users can sign in
2. FIX (Only after Section 1 gate is passed)
2.1 If Scenario A: Remove signUp from login page
File: src/app/auth/login/page.tsx
Action: Find any signUp call. Remove it entirely. The login page must ONLY call signInWithPassword.
Then create: src/app/auth/register/page.tsx
Minimum viable register page:
tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="mt-2 text-gray-600">We sent a verification link to {email}. Click it to activate your account.</p>
        <a href="/auth/login" className="mt-4 inline-block text-indigo-600 hover:underline">Go to login</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Create your ElimuX account</h1>
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="w-full rounded-md border px-3 py-2" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" className="w-full rounded-md border px-3 py-2" />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white disabled:opacity-50">{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="text-center text-sm text-gray-600">Already have an account? <a href="/auth/login" className="text-indigo-600 hover:underline">Sign in</a></p>
    </div>
  );
}
2.2 If Scenario B or C: Add email verification gate
File: app/auth/callback/route.ts
Add after exchangeCodeForSession succeeds:
TypeScript
// After: const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
// Add this block before the success redirect:

const { data: { user } } = await supabase.auth.getUser();
if (!user?.email_confirmed_at) {
  await supabase.auth.signOut();
  return NextResponse.redirect(
    `${origin}/auth/login?error=email_not_verified&message=${encodeURIComponent('Please verify your email before signing in. Check your inbox for the verification link.')}`
  );
}
File: src/app/auth/login/page.tsx
Add after signInWithPassword succeeds:
TypeScript
// After: const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
// Add this block before the redirect:

if (!signInError) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) {
    await supabase.auth.signOut();
    setError('Please verify your email before signing in. Check your inbox for the verification link.');
    setLoading(false);
    return;
  }
  // Continue to redirect...
}
2.3 Add middleware gate for all protected routes
File: src/middleware.ts
Add inside the existing auth check:
TypeScript
// After confirming session exists, add:
const { data: { user } } = await supabase.auth.getUser();
if (!user?.email_confirmed_at) {
  return NextResponse.redirect(new URL('/auth/login?error=email_not_verified', request.url));
}
3. BUILD & VERIFY
bash
npx tsc --noEmit
Must show 0 errors.
4. DEPLOY
bash
git checkout -b auth-security-preview
git add .
git commit -m "Cycle 044: Enforce email verification, separate login from signup"
git push -u origin auth-security-preview
Wait for Vercel preview. Test:
Register with new email → should see "Check your email" page
Try to login WITHOUT clicking verification link → should see error
Click verification link → should be able to login
Google sign-in → should work as before
END OF bridge.md